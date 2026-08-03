import {errored, isErrored} from "@attio/fetchable"
import {alert, runQuery, showDialog, showToast, Extensions} from "attio/client"
import React from "react"
import {AddToSequenceDialog} from "../../../components/add-to-sequence-dialog"
import {Loading} from "../../../components/loading"
import type {AttioPerson} from "../../../graphql/attio-person"
import GetPersonById from "../../../graphql/get-person-by-id.graphql"
import addToSequence from "../../../outreach/sequences/add-to-sequence.server"
import {outreachApiErrorUserMessage, unexpectedOutreachError} from "../../../outreach/types"
import {QueryClientProvider, queryClient} from "../../../react-query"

export default Extensions.defineExtension({
    type: "record-action",
    id: "person-add-to-sequence",
    label: "Add to Outreach sequence",
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
                text: "Please add an email address to the person to add them to a sequence.",
            })
        } else {
            await showDialog({
                title: "Add to Outreach sequence",
                Dialog: ({hideDialog}: {hideDialog: () => void}) => (
                    <QueryClientProvider client={queryClient}>
                        <React.Suspense fallback={<Loading text="Loading sequences..." />}>
                            <AddToSequenceDialog
                                onSubmit={async ({sequenceId, mailboxId}) => {
                                    hideDialog() // Why make the user wait?
                                    const {hideToast} = await showToast({
                                        title: "Adding to sequence...",
                                        variant: "neutral",
                                        dismissable: false,
                                        durationMs: Number.POSITIVE_INFINITY,
                                    })

                                    let result: Awaited<ReturnType<typeof addToSequence>>
                                    try {
                                        result = await addToSequence({
                                            person,
                                            sequenceId,
                                            mailboxId,
                                        })
                                    } catch (error) {
                                        console.error(error)
                                        result = errored(unexpectedOutreachError())
                                    } finally {
                                        await hideToast()
                                    }

                                    if (isErrored(result)) {
                                        await alert({
                                            title: "Error adding to sequence",
                                            text: outreachApiErrorUserMessage(result.error),
                                        })
                                    } else {
                                        await showToast({
                                            title: "Added to sequence",
                                            variant: "success",
                                        })
                                    }
                                }}
                            />
                        </React.Suspense>
                    </QueryClientProvider>
                ),
            })
        }
    },
})

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
