import {isErrored} from "@attio/fetchable"
import type {App} from "attio"
import type {RecordBatch} from "attio/client"
import {alert, runQuery, showDialog, showToast} from "attio/client"
import React from "react"
import {AddToSequenceDialog} from "../../components/add-to-sequence-dialog"
import {Loading} from "../../components/loading"
import type {AttioPerson} from "../../graphql/attio-person"
import GetPersonById from "../../graphql/get-person-by-id.graphql"
import addManyToSequence from "../../outreach/sequences/add-many-to-sequence.server"
import {outreachApiErrorUserMessage, unexpectedOutreachError} from "../../outreach/types"
import {QueryClientProvider, queryClient} from "../../react-query"

const PEOPLE_CHUNK_SIZE = 100

export const peopleBulkAddToSequenceAction: App.Record.BulkAction = {
    id: "add-many-to-sequence",
    label: "Add to Outreach sequence",
    objects: ["people"],
    onTrigger: async ({runRecordBatches}) => {
        let sequenceId: number | undefined
        let mailboxId: number | undefined

        await showDialog({
            title: "Add to Outreach sequence",
            Dialog: ({hideDialog}: {hideDialog: () => void}) => (
                <QueryClientProvider client={queryClient}>
                    <React.Suspense fallback={<Loading text="Loading sequences..." />}>
                        <AddToSequenceDialog
                            onSubmit={async ({
                                sequenceId: newSequenceId,
                                mailboxId: newMailboxId,
                            }) => {
                                sequenceId = newSequenceId
                                mailboxId = newMailboxId
                                hideDialog()
                            }}
                        />
                    </React.Suspense>
                </QueryClientProvider>
            ),
        })

        if (sequenceId === undefined || mailboxId === undefined) {
            return
        }
        const selectedSequenceId = sequenceId
        const selectedMailboxId = mailboxId

        let updateToast: ((opts: Parameters<typeof showToast>[0]) => Promise<void>) | undefined
        let hideToast: (() => Promise<void>) | undefined
        let totalAdded = 0
        let totalFailed = 0

        try {
            const drainOutcome = await runRecordBatches(
                {
                    batchSize: PEOPLE_CHUNK_SIZE,
                    onProgress: async (ctx) => {
                        const toastOpts = {
                            title: "Adding to sequence...",
                            text: `${ctx.processedRecords} of ${ctx.totalRecords} people`,
                            variant: "neutral" as const,
                            dismissable: false,
                            durationMs: Number.POSITIVE_INFINITY,
                            progress:
                                ctx.totalRecords > 0
                                    ? Math.round((ctx.processedRecords / ctx.totalRecords) * 100)
                                    : undefined,
                        }
                        if (updateToast) {
                            await updateToast(toastOpts)
                        } else {
                            const toast = await showToast(toastOpts)
                            updateToast = toast.updateToast
                            hideToast = toast.hideToast
                        }
                    },
                },
                async (batch: RecordBatch) => {
                    const people = await peopleFromRecordIds(batch.recordIds)
                    const noEmailCount = people.filter(
                        (person) => person.email_addresses.length === 0
                    ).length
                    if (noEmailCount > 0) {
                        throw new Error(
                            `${noEmailCount === 1 ? "One" : noEmailCount} of the selected people ${
                                noEmailCount === 1 ? "does" : "do"
                            } not have an email address.`
                        )
                    }

                    let result: Awaited<ReturnType<typeof addManyToSequence>>
                    try {
                        result = await addManyToSequence({
                            people,
                            sequenceId: selectedSequenceId,
                            mailboxId: selectedMailboxId,
                        })
                    } catch (err) {
                        console.error(err)
                        throw new Error(outreachApiErrorUserMessage(unexpectedOutreachError()))
                    }
                    if (isErrored(result)) {
                        throw new Error(outreachApiErrorUserMessage(result.error))
                    }
                    totalAdded += result.value.addedCount
                    totalFailed += result.value.failedCount
                }
            )

            if (!drainOutcome.success) {
                await hideToast?.()
                const err = drainOutcome.error
                const errorMessage = err instanceof Error ? err.message : String(err)

                const text =
                    totalAdded > 0
                        ? `${totalAdded} added before error: ${errorMessage}`
                        : errorMessage

                await alert({
                    title: totalAdded > 0 ? "Partially added to sequence" : "Error",
                    text,
                })
                return
            }

            if (updateToast) {
                await updateToast({
                    title: "Added to sequence",
                    text:
                        totalFailed > 0
                            ? `${totalAdded} added, ${totalFailed} failed.`
                            : `${totalAdded} ${totalAdded === 1 ? "person" : "people"} added.`,
                    variant: totalFailed > 0 ? "neutral" : "success",
                    dismissable: true,
                })
            }
        } catch (err) {
            await hideToast?.()
            await alert({
                title: "Error adding to sequence",
                text: err instanceof Error ? err.message : String(err),
            })
        }
    },
}

async function peopleFromRecordIds(recordIds: string[]): Promise<AttioPerson[]> {
    const results = await Promise.all(
        recordIds.map((recordId) => runQuery(GetPersonById, {recordId}))
    )
    const people: AttioPerson[] = []
    for (const r of results) {
        if (r.person == null) {
            throw new Error("Could not load a person from Attio.")
        }
        people.push(r.person)
    }
    return people
}
