import {experimental_Workflow} from "attio"

export default experimental_Workflow.defineWorkflowBlock({
    type: "trigger",
    id: "trigger-added-to-sequence",
    title: "Added to sequence",
    description: "Runs when a prospect is added to the selected Outreach sequence.",
    requireUserConnection: true,
    schema: experimental_Workflow.struct({
        sequenceId: experimental_Workflow.string(),
    }),
})
