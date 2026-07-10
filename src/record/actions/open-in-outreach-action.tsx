import {errored, isErrored} from "@attio/fetchable"
import type {App} from "attio"
import {alert, runQuery, showDialog, showToast} from "attio/client"
import {CreateProspectDialog} from "../../components/create-prospect-dialog"
import type {AttioPerson} from "../../graphql/attio-person"
import GetPersonById from "../../graphql/get-person-by-id.graphql"
import findOrCreateProspect from "../../outreach/prospects/find-or-create-prospect.server"
import getProspectId from "../../outreach/prospects/get-prospect-id.server"
import {outreachApiErrorUserMessage, unexpectedOutreachError} from "../../outreach/types"
import {getOutreachProspectUrl} from "../../outreach/utils"

export const personOpenInOutreachAction: App.Record.Action = {
    id: "open-in-outreach",
    label: "Open in Outreach",
    objects: ["people"],
    onTrigger: async ({recordId}) => {
        const person = await loadPerson(recordId)
        if (person == null) {
            await alert({
                title: "Error",
                text: "Could not load this person from Attio.",
            })
            return
        }
        if (!person.email_addresses.length) {
            await alert({
                title: "No email address",
                text: "Please add an email address to the person to open them in Outreach.",
            })
        } else {
            const {hideToast} = await showToast({
                variant: "neutral",
                title: "Loading prospect...",
                text: "",
            })
            // No catch: Outreach API errors arrive as an errored result, so a rejection here
            // can only be an SDK-level error (e.g. missing connection) that must propagate
            // for Attio to handle — typically by prompting the user to connect.
            let prospectResult: Awaited<ReturnType<typeof getProspectId>>
            try {
                prospectResult = await getProspectId(person.email_addresses)
            } finally {
                await hideToast()
            }
            if (isErrored(prospectResult)) {
                await alert({
                    title: "Outreach error",
                    text: outreachApiErrorUserMessage(prospectResult.error),
                })
            } else if (prospectResult.value !== null) {
                window.open(getOutreachProspectUrl(prospectResult.value), "_blank")
            } else {
                await showDialog({
                    title: "Create Prospect",
                    Dialog: ({hideDialog}: {hideDialog: () => void}) => (
                        <CreateProspectDialog
                            person={person}
                            onSubmit={async () => {
                                let result: Awaited<ReturnType<typeof findOrCreateProspect>>
                                try {
                                    result = await findOrCreateProspect(person)
                                } catch (error) {
                                    console.error(error)
                                    result = errored(unexpectedOutreachError())
                                } finally {
                                    hideDialog()
                                }
                                if (isErrored(result)) {
                                    await showToast({
                                        variant: "error",
                                        title: "Failed to create prospect",
                                        text: outreachApiErrorUserMessage(result.error),
                                    })
                                    console.error(
                                        JSON.stringify({
                                            msg: "Open in Outreach: failed to create prospect",
                                            errors: result.error,
                                        })
                                    )
                                } else {
                                    window.open(getOutreachProspectUrl(result.value), "_blank")
                                }
                            }}
                        />
                    ),
                })
            }
        }
    },
}

async function loadPerson(recordId: string): Promise<AttioPerson | null> {
    const {hideToast} = await showToast({
        variant: "neutral",
        title: "Loading person...",
        dismissable: false,
        durationMs: Number.POSITIVE_INFINITY,
    })

    try {
        const data = await runQuery(GetPersonById, {recordId})
        return data.person ?? null
    } finally {
        hideToast()
    }
}
