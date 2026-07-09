import {complete, errored, isErrored} from "@attio/fetchable"
import {z} from "zod"
import {OUTREACH_API_BASE_URL} from "./constants"
import {
    createWebhookResponseSchema,
    idResponseSchema,
    jsonApiErrorSchema,
    mailboxSchema,
    type OutreachError,
    type OutreachResourceType,
    type OutreachResult,
    type Prospect,
    type ProspectAttributes,
    prospectResponseSchema,
    prospectSchema,
    type Sequence,
    type SequenceState,
    type SequenceStep,
    sequenceResponseSchema,
    sequenceSchema,
    sequenceStateResponseSchema,
    sequenceStepResponseSchema,
    type Webhook,
    webhookSchema,
} from "./types"

async function fetchOutreachJson({
    url,
    token,
    method,
    body,
    emptySuccessStatuses,
}: {
    url: string
    token: string
    method: string
    body?: unknown
    emptySuccessStatuses?: number[]
}): OutreachResult<{status: number; json: unknown}> {
    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/vnd.api+json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20_000),
    })

    const text = await response.text()
    const json = text ? safeParseJson(text) : undefined

    const parsedErrors = jsonApiErrorSchema.safeParse(json)
    if (parsedErrors.success) {
        console.warn("Outreach returned validation errors", {
            method,
            url,
            status: response.status,
            errors: parsedErrors.data.errors,
        })
        return errored(outreachErrorFromResponse(response.status, parsedErrors.data.errors))
    }

    if (response.status === 204 || emptySuccessStatuses?.includes(response.status)) {
        return complete({status: 204, json: null})
    }

    if (!response.ok) {
        console.error(
            JSON.stringify({
                msg: "Outreach request failed",
                method,
                url,
                status: response.status,
                body: text.slice(0, 500),
            })
        )
        throw new Error(text || response.statusText)
    }

    return complete({status: response.status, json})
}

function safeParseJson(text: string): unknown {
    try {
        return JSON.parse(text)
    } catch {
        return undefined
    }
}

function outreachErrorFromResponse(status: number, errors: OutreachError[]): OutreachError[] {
    if (status === 401) {
        return errors.length > 0
            ? errors
            : [
                  {
                      title: "Unauthorized",
                      detail: "Outreach connection is unauthorized. Please reconnect your Outreach account.",
                  },
              ]
    }

    if (status === 403) {
        return errors.length > 0
            ? errors
            : [
                  {
                      title: "Forbidden",
                      detail: "Access to this Outreach resource is forbidden. Please check your account permissions.",
                  },
              ]
    }

    return errors
}

async function request<T>({
    token,
    method,
    subUrl,
    body,
    responseSchema,
    emptySuccessStatuses,
}: {
    token: string
    method: "GET" | "POST" | "PATCH" | "DELETE"
    subUrl: string
    body?: unknown
    responseSchema?: z.ZodType<T, z.ZodTypeDef, unknown>
    emptySuccessStatuses?: number[]
}): OutreachResult<T> {
    const result = await fetchOutreachJson({
        url: `${OUTREACH_API_BASE_URL}${subUrl}`,
        token,
        method,
        body,
        emptySuccessStatuses,
    })

    if (isErrored(result)) {
        return result
    }

    const {status, json} = result.value

    if (status === 204) {
        if (responseSchema) {
            console.error(
                JSON.stringify({
                    msg: "Unexpected 204 response when a response body was expected",
                })
            )
            return errored([{title: "Unexpected error", detail: "An unexpected error occurred."}])
        }
        return complete(null as T)
    }

    if (responseSchema) {
        const parseResult = responseSchema.safeParse(json)
        if (!parseResult.success) {
            console.error(
                JSON.stringify({
                    msg: "Failed to parse Outreach API response",
                    error: parseResult.error.issues,
                })
            )
            return errored([{title: "Unexpected error", detail: "An unexpected error occurred."}])
        }
        return complete(parseResult.data)
    }

    return complete(json as T)
}

const paginatedResponseSchema = z.object({
    data: z.array(z.unknown()),
    links: z
        .object({
            next: z.string().nullable().optional(),
        })
        .optional(),
})

async function requestPaginated<T>({
    token,
    subUrl,
    sort,
    filter,
    itemSchema,
}: {
    token: string
    subUrl: string
    sort?: string
    filter?: Record<string, string>
    itemSchema: z.ZodType<T, z.ZodTypeDef, unknown>
}): OutreachResult<Array<T>> {
    const allItems: Array<T> = []
    const maxPages = 3
    const pageSize = 1000

    let nextUrl: string | null = null

    for (let page = 0; page < maxPages; page++) {
        let url: string

        if (nextUrl) {
            url = nextUrl
        } else {
            const params = new URLSearchParams()
            params.set("page[size]", String(pageSize))
            if (sort) {
                params.set("sort", sort)
            }
            if (filter) {
                for (const [key, value] of Object.entries(filter)) {
                    params.set(`filter[${key}]`, value)
                }
            }
            url = `${OUTREACH_API_BASE_URL}${subUrl}?${params.toString()}`
        }

        const result = await fetchOutreachJson({url, token, method: "GET"})

        if (isErrored(result)) {
            return result
        }

        const parsed = paginatedResponseSchema.safeParse(result.value.json)

        if (!parsed.success) {
            console.error(
                JSON.stringify({
                    msg: "Failed to parse paginated response",
                    error: parsed.error.issues,
                })
            )
            return errored([{title: "Unexpected error", detail: "An unexpected error occurred."}])
        }

        for (const item of parsed.data.data) {
            const itemParsed = itemSchema.safeParse(item)
            if (itemParsed.success) {
                allItems.push(itemParsed.data)
            } else {
                console.error(
                    JSON.stringify({
                        msg: "Skipped item that failed schema validation in paginated response",
                        error: itemParsed.error.issues,
                    })
                )
            }
        }

        nextUrl = parsed.data.links?.next ?? null
        if (nextUrl && page === maxPages - 1) {
            console.error(
                JSON.stringify({
                    msg: "Paginated response truncated — more pages available but max page limit reached",
                    subUrl,
                    maxPages,
                    itemCount: allItems.length,
                })
            )
        }
        if (!nextUrl) {
            break
        }
    }

    return complete(allItems)
}

export class OutreachClient {
    constructor(private readonly token: string) {}

    async getSequence(sequenceId: string | number): OutreachResult<Sequence> {
        const result = await request({
            token: this.token,
            method: "GET",
            subUrl: `/sequences/${String(sequenceId)}`,
            responseSchema: sequenceResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete(result.value.data)
    }

    async getSequenceState(sequenceStateId: string | number): OutreachResult<SequenceState> {
        const result = await request({
            token: this.token,
            method: "GET",
            subUrl: `/sequenceStates/${String(sequenceStateId)}`,
            responseSchema: sequenceStateResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete(result.value.data)
    }

    async getSequenceStep(sequenceStepId: string | number): OutreachResult<SequenceStep> {
        const result = await request({
            token: this.token,
            method: "GET",
            subUrl: `/sequenceSteps/${String(sequenceStepId)}`,
            responseSchema: sequenceStepResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete(result.value.data)
    }

    async getProspect(prospectId: string | number): OutreachResult<Prospect> {
        const result = await request({
            token: this.token,
            method: "GET",
            subUrl: `/prospects/${String(prospectId)}`,
            responseSchema: prospectResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete(result.value.data)
    }

    async getProspectByEmail(email: string): OutreachResult<Prospect | null> {
        const result = await requestPaginated({
            token: this.token,
            subUrl: "/prospects",
            filter: {emails: email},
            itemSchema: prospectSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete(result.value[0] ?? null)
    }

    async listMailboxes(): OutreachResult<Array<{id: string; email: string}>> {
        const result = await requestPaginated({
            token: this.token,
            subUrl: "/mailboxes",
            filter: {sendDisabled: "false"},
            sort: "-updatedAt",
            itemSchema: mailboxSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete(
            result.value
                .filter((mb) => mb.sendPermanentErrorAt == null)
                .map((mb) => ({id: mb.id, email: mb.email}))
        )
    }

    async listSequences(): OutreachResult<Array<{id: string; name: string}>> {
        return await requestPaginated({
            token: this.token,
            subUrl: "/sequences",
            sort: "-lastUsedAt",
            filter: {lockedAt: "__null__"},
            itemSchema: sequenceSchema,
        })
    }

    async listWebhooks(filterUrl?: string): OutreachResult<Array<Webhook>> {
        const result = await requestPaginated({
            token: this.token,
            subUrl: "/webhooks",
            itemSchema: webhookSchema,
        })

        if (isErrored(result)) {
            return result
        }

        if (filterUrl) {
            return complete(result.value.filter((wh) => wh.url === filterUrl))
        }

        return result
    }

    async addProspectToSequence({
        prospectId,
        sequenceId,
        mailboxId,
    }: {
        prospectId: string
        sequenceId: string
        mailboxId: string
    }): OutreachResult<{id: string}> {
        const result = await request({
            token: this.token,
            method: "POST",
            subUrl: "/sequenceStates",
            body: {
                data: {
                    type: "sequenceState",
                    relationships: {
                        prospect: {data: {type: "prospect", id: Number(prospectId)}},
                        sequence: {data: {type: "sequence", id: Number(sequenceId)}},
                        mailbox: {data: {type: "mailbox", id: Number(mailboxId)}},
                    },
                },
            },
            responseSchema: idResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete({id: result.value.data.id})
    }

    async addProspectsToSequence({
        sequenceId,
        prospectIds,
        mailboxId,
    }: {
        sequenceId: string
        prospectIds: string[]
        mailboxId: string
    }): OutreachResult<null> {
        const params = `actionParams[skipConfirmation]=true&${prospectIds
            .map((id) => `actionParams[filter][id][]=${id}`)
            .join("&")}`
        const result = await request<unknown>({
            token: this.token,
            method: "POST",
            subUrl: `/batches/actions/prospectsAddToSequence?${params}`,
            body: {
                data: {
                    attributes: {
                        sequenceId: Number(sequenceId),
                        mailboxId: Number(mailboxId),
                    },
                },
                type: "string",
            },
        })

        if (isErrored(result)) {
            return result
        }

        return complete(null)
    }

    async createWebhook({
        action,
        resource,
        url,
    }: {
        action: "created" | "updated"
        resource: OutreachResourceType
        url: string
    }): OutreachResult<{id: string; cleanupToken: string}> {
        const result = await request({
            token: this.token,
            method: "POST",
            subUrl: "/webhooks",
            body: {
                data: {
                    type: "webhook",
                    attributes: {
                        action,
                        active: true,
                        resource,
                        url,
                    },
                },
            },
            responseSchema: createWebhookResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete(result.value.data)
    }

    async createProspect({
        email,
        emails,
        attributes,
    }: {
        email: string
        emails?: string[]
        attributes?: Partial<Omit<ProspectAttributes, "emails">>
    }): OutreachResult<{id: string}> {
        const emailList = emails ?? [email]
        const result = await request({
            token: this.token,
            method: "POST",
            subUrl: "/prospects",
            body: {
                data: {
                    type: "prospect",
                    attributes: {
                        emails: emailList,
                        ...attributes,
                    },
                },
            },
            responseSchema: idResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete({id: result.value.data.id})
    }

    async updateProspect({
        prospectId,
        attributes,
    }: {
        prospectId: string
        attributes: Partial<Omit<ProspectAttributes, "emails">>
    }): OutreachResult<{id: string}> {
        const result = await request({
            token: this.token,
            method: "PATCH",
            subUrl: `/prospects/${prospectId}`,
            body: {
                data: {
                    type: "prospect",
                    id: Number(prospectId),
                    attributes,
                },
            },
            responseSchema: idResponseSchema,
        })

        if (isErrored(result)) {
            return result
        }

        return complete({id: result.value.data.id})
    }

    async deleteWebhook(webhookId: string | number): OutreachResult<null> {
        return request({
            token: this.token,
            method: "DELETE",
            subUrl: `/webhooks/${String(webhookId)}`,
        })
    }

    async cleanupWebhook(): OutreachResult<null> {
        const result = await request<null>({
            token: this.token,
            method: "POST",
            subUrl: "/webhooks/cleanup",
            emptySuccessStatuses: [404],
        })

        if (isErrored(result) && result.error.some((error) => error.title === "Unauthorized")) {
            return errored([
                {
                    title: "Unauthorized",
                    detail: "Webhook cleanup token is invalid or expired. Please reconnect your Outreach account.",
                },
            ])
        }

        return result
    }
}
