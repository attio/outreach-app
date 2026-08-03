import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "trigger",
    id: "trigger-added-to-sequence",
    title: "Added to sequence",
    description: "Runs when a prospect is added to the selected Outreach sequence.",
    requireUserConnection: true,
    configSchema: Workflows.ConfigSchema.struct({
        sequenceId: Workflows.ConfigSchema.string(),
    }),
})
