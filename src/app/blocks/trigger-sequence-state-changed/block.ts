import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "trigger",
    id: "trigger-sequence-state-changed",
    title: "Sequence state changed",
    requireUserConnection: true,
    description:
        "Runs when a prospect's state changes in the selected Outreach sequence (e.g. step advances).",
    configSchema: Workflows.ConfigSchema.struct({
        sequenceId: Workflows.ConfigSchema.string(),
    }),
})
