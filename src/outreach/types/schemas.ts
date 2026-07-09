import {z} from "zod"

// ---------------------------------------------------------------------------
// JSON:API helpers
// ---------------------------------------------------------------------------

/** Wraps a resource schema in a JSON:API `{ data: ... }` envelope. */
function jsonApiResponse<T extends z.ZodTypeAny>(schema: T) {
    return z.object({data: schema})
}

/** Validates a JSON:API error response body. */
export const jsonApiErrorSchema = z.object({
    errors: z.array(
        z.object({
            code: z.string().optional().default("unknown"),
            detail: z.string(),
            id: z.string().optional().default("unknown"),
            title: z.string(),
        })
    ),
})

// ---------------------------------------------------------------------------
// Resource schemas
// ---------------------------------------------------------------------------

/** An Outreach prospect (contact). Flattened from JSON:API attributes. */
export const prospectSchema = z
    .object({
        id: z.coerce.string(),
        attributes: z.object({
            name: z.string().nullable().optional(),
            emails: z.array(z.string()).nullable().optional(),
        }),
    })
    .transform((p) => ({
        id: p.id,
        name: p.attributes.name ?? null,
        emails: p.attributes.emails ?? [],
    }))

/** @see {@link prospectSchema} */
export type Prospect = z.infer<typeof prospectSchema>

/** An Outreach email sequence. */
export const sequenceSchema = z
    .object({
        id: z.coerce.string(),
        attributes: z.object({name: z.string()}),
    })
    .transform((s) => ({id: s.id, name: s.attributes.name}))

/** @see {@link sequenceSchema} */
export type Sequence = z.infer<typeof sequenceSchema>

/** An Outreach mailbox used for sending sequence emails. */
export const mailboxSchema = z
    .object({
        id: z.coerce.string(),
        attributes: z.object({
            email: z.string(),
            sendDisabled: z.boolean().optional(),
            sendPermanentErrorAt: z.string().nullable().optional(),
        }),
    })
    .transform((m) => ({
        id: m.id,
        email: m.attributes.email,
        sendDisabled: m.attributes.sendDisabled,
        sendPermanentErrorAt: m.attributes.sendPermanentErrorAt,
    }))

/** An Outreach webhook subscription. */
export const webhookSchema = z
    .object({
        id: z.coerce.string(),
        attributes: z.object({
            url: z.string(),
            action: z.string(),
            resource: z.string(),
            active: z.boolean(),
        }),
    })
    .transform((w) => ({
        id: w.id,
        url: w.attributes.url,
        action: w.attributes.action,
        resource: w.attributes.resource,
        active: w.attributes.active,
    }))

/** @see {@link webhookSchema} */
export type Webhook = z.infer<typeof webhookSchema>

/** A prospect's state within a sequence, including related resource IDs. */
const sequenceStateSchema = z
    .object({
        id: z.coerce.string(),
        attributes: z.object({state: z.string()}),
        relationships: z.object({
            prospect: z.object({
                data: z.object({type: z.literal("prospect"), id: z.coerce.string()}),
            }),
            sequence: z.object({
                data: z.object({type: z.literal("sequence"), id: z.coerce.string()}),
            }),
            sequenceStep: z
                .object({
                    data: z
                        .object({type: z.literal("sequenceStep"), id: z.coerce.string()})
                        .nullable(),
                })
                .optional(),
        }),
    })
    .transform((d) => ({
        id: d.id,
        state: d.attributes.state,
        prospectId: d.relationships.prospect.data.id,
        sequenceId: d.relationships.sequence.data.id,
        sequenceStepId: d.relationships.sequenceStep?.data?.id ?? null,
    }))

/** @see {@link sequenceStateSchema} */
export type SequenceState = z.infer<typeof sequenceStateSchema>

/** A single step within an Outreach sequence. */
const sequenceStepSchema = z
    .object({
        id: z.coerce.string(),
        attributes: z.object({displayName: z.string()}),
    })
    .transform((d) => ({id: d.id, displayName: d.attributes.displayName}))

/** @see {@link sequenceStepSchema} */
export type SequenceStep = z.infer<typeof sequenceStepSchema>

// ---------------------------------------------------------------------------
// Response schemas (composed from resource schemas)
// ---------------------------------------------------------------------------

/** Single-prospect GET response. */
export const prospectResponseSchema = jsonApiResponse(prospectSchema)

/** Single-sequence GET response. */
export const sequenceResponseSchema = jsonApiResponse(sequenceSchema)

/** Single sequence-state GET response. */
export const sequenceStateResponseSchema = jsonApiResponse(sequenceStateSchema)

/** Single sequence-step GET response. */
export const sequenceStepResponseSchema = jsonApiResponse(sequenceStepSchema)

/** Generic response for create/update operations that only return an ID. */
export const idResponseSchema = jsonApiResponse(z.object({id: z.coerce.string()}))

/** Response from creating a webhook, includes the cleanup token. */
export const createWebhookResponseSchema = jsonApiResponse(
    z
        .object({
            id: z.coerce.string(),
            attributes: z.object({cleanupToken: z.string()}).passthrough(),
        })
        .transform((d) => ({id: d.id, cleanupToken: d.attributes.cleanupToken}))
)
