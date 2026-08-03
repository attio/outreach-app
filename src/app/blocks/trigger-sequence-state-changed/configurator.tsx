import {isErrored} from "@attio/fetchable"
import {Workflows, useAsyncCache} from "attio/client"
import getSequences from "../../../outreach/sequences/get-sequences.server"
import block from "./block"

const sequenceStateChangedOutcomeSchema = Workflows.OutcomeSchema.struct({
    triggered_at: Workflows.OutcomeSchema.timestamp(),
    sequence_id: Workflows.OutcomeSchema.string(),
    sequence_step: Workflows.OutcomeSchema.string(),
    sequence_step_name: Workflows.OutcomeSchema.string(),
    prospect_id: Workflows.OutcomeSchema.string(),
    prospect_name: Workflows.OutcomeSchema.string(),
    prospect_emails: Workflows.OutcomeSchema.array(Workflows.OutcomeSchema.emailAddress()),
})

export default Workflows.defineConfigurator(block, (workflowBlock) => {
    const {ComboboxInput, Outcome} = Workflows.useConfigurator(workflowBlock.configSchema)
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
            <Outcome id="done" schema={sequenceStateChangedOutcomeSchema} />
        </>
    )
})
