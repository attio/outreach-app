import {isErrored} from "@attio/fetchable"
import {Forms, useForm} from "attio/client"
import React from "react"
import getMailboxes from "../outreach/mailboxes/get-mailboxes.server"
import getSequences from "../outreach/sequences/get-sequences.server"
import {outreachApiErrorUserMessage} from "../outreach/types"
import {useSuspenseQueries} from "../react-query"

export function AddToSequenceDialog({
    onSubmit,
}: {
    onSubmit: (data: {sequenceId: number; mailboxId: number}) => Promise<void>
}) {
    const {Form, Combobox, SubmitButton} = useForm(
        {
            sequenceId: Forms.string(),
            mailboxId: Forms.string(),
        },
        {
            sequenceId: "",
            mailboxId: "",
        }
    )

    const [{data: sequences}, {data: mailboxes}] = useSuspenseQueries({
        queries: [
            {
                queryKey: ["sequences"],
                queryFn: async () => {
                    const result = await getSequences()
                    if (isErrored(result)) {
                        throw new Error(outreachApiErrorUserMessage(result.error))
                    }
                    return result.value
                },
                retry: false,
            },
            {
                queryKey: ["mailboxes"],
                queryFn: async () => {
                    const result = await getMailboxes()
                    if (isErrored(result)) {
                        throw new Error(outreachApiErrorUserMessage(result.error))
                    }
                    return result.value
                },
                retry: false,
            },
        ],
    })

    const sequenceOptions = React.useMemo(
        () =>
            sequences.map((sequence) => ({
                value: sequence.id.toString(),
                label: sequence.name,
            })),
        [sequences]
    )
    const mailboxOptions = React.useMemo(
        () =>
            mailboxes.map((mailbox) => ({
                value: mailbox.id.toString(),
                label: mailbox.email,
            })),
        [mailboxes]
    )

    return (
        <Form
            onSubmit={async (state) => {
                await onSubmit({
                    sequenceId: parseInt(state.sequenceId),
                    mailboxId: parseInt(state.mailboxId),
                })
            }}
        >
            <Combobox
                label="Mailbox"
                name="mailboxId"
                options={mailboxOptions}
                placeholder="Select Mailbox"
            />
            <Combobox
                label="Sequence"
                name="sequenceId"
                options={sequenceOptions}
                placeholder="Select Sequence"
            />
            <SubmitButton label="Add to Sequence" />
        </Form>
    )
}
