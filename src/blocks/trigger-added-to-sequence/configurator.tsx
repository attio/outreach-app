import {isErrored} from "@attio/fetchable"
import {experimental_Workflow, useAsyncCache} from "attio/client"
import getSequences from "../../outreach/sequences/get-sequences.server"
import block from "./block"

const addedToSequenceOutcomeSchema = experimental_Workflow.Outcome.struct({
    triggered_at: experimental_Workflow.Outcome.timestamp(),
    sequence_id: experimental_Workflow.Outcome.string(),
    mailbox_id: experimental_Workflow.Outcome.string(),
    user_id: experimental_Workflow.Outcome.string(),
    prospect_id: experimental_Workflow.Outcome.string(),
    prospect_name: experimental_Workflow.Outcome.string(),
    prospect_emails: experimental_Workflow.Outcome.array(
        experimental_Workflow.Outcome.emailAddress()
    ),
})

export default experimental_Workflow.defineConfigurator(block, (workflowBlock) => {
    const {ComboboxInput, Outcome} = experimental_Workflow.useConfigurator(workflowBlock.schema)
    const {values} = useAsyncCache({
        sequences: getSequences,
    })

    const sequences = isErrored(values.sequences)
        ? null
        : values.sequences.value.map((sequence) => ({
              id: String(sequence.id),
              name: sequence.name,
          }))

    return (
        <>
            <ComboboxInput
                name="sequenceId"
                label="Sequence"
                placeholder="Select a sequence..."
                searchPlaceholder="Search sequences..."
                options={{
                    async getOption(value: string) {
                        if (sequences == null) {
                            return {label: "Unknown sequence", value}
                        }
                        const sequence = sequences.find((s) => s.id === value)
                        return sequence
                            ? {label: sequence.name, value: sequence.id}
                            : {label: "Unknown sequence", value}
                    },
                    async search(query: string) {
                        if (sequences == null) {
                            return []
                        }
                        return sequences
                            .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
                            .map((s) => ({label: s.name, value: s.id}))
                    },
                }}
                disableVariables
            />
            <Outcome slug="done" schema={addedToSequenceOutcomeSchema} />
        </>
    )
})
