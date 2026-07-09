import {experimental_Workflow} from "attio"

export const addToSequenceSchema = experimental_Workflow.struct({
    sequenceId: experimental_Workflow.string(),
    mailboxId: experimental_Workflow.string(),
    email: experimental_Workflow.emailAddress(),
    firstName: experimental_Workflow.string().optional(),
    lastName: experimental_Workflow.string().optional(),
    companyName: experimental_Workflow.string().optional(),
    title: experimental_Workflow.string().optional(),
    addressStreet: experimental_Workflow.string().optional(),
    addressStreet2: experimental_Workflow.string().optional(),
    addressCity: experimental_Workflow.string().optional(),
    addressState: experimental_Workflow.string().optional(),
    addressCountry: experimental_Workflow.string().optional(),
    addressZip: experimental_Workflow.string().optional(),
    linkedinUrl: experimental_Workflow.string().optional(),
    facebookUrl: experimental_Workflow.string().optional(),
    githubUrl: experimental_Workflow.string().optional(),
    twitterUrl: experimental_Workflow.string().optional(),
    websiteUrl: experimental_Workflow.string().optional(),
    gender: experimental_Workflow.string().optional(),
    occupation: experimental_Workflow.string().optional(),
    mobilePhone: experimental_Workflow.string().optional(),
    homePhone: experimental_Workflow.string().optional(),
    voipPhone: experimental_Workflow.string().optional(),
    workPhone: experimental_Workflow.string().optional(),
})

export default experimental_Workflow.defineWorkflowBlock({
    type: "step",
    id: "add-to-sequence",
    title: "Add to sequence",
    description:
        "Adds a prospect to an Outreach sequence using the selected mailbox and contact details.",
    requireUserConnection: true,
    schema: addToSequenceSchema,
})
