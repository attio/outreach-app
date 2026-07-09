import {experimental_Workflow} from "attio"

export default experimental_Workflow.defineWorkflowBlock({
    type: "trigger",
    id: "trigger-sequence-state-changed",
    title: "Sequence state changed",
    requireUserConnection: true,
    description:
        "Runs when a prospect's state changes in the selected Outreach sequence (e.g. step advances).",
    schema: experimental_Workflow.struct({
        sequenceId: experimental_Workflow.string(),
    }),
})
