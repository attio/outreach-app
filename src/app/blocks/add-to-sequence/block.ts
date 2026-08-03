import {Workflows} from "attio"

export const addToSequenceSchema = Workflows.ConfigSchema.struct({
    sequenceId: Workflows.ConfigSchema.string(),
    mailboxId: Workflows.ConfigSchema.string(),
    email: Workflows.ConfigSchema.emailAddress(),
    firstName: Workflows.ConfigSchema.string().optional(),
    lastName: Workflows.ConfigSchema.string().optional(),
    companyName: Workflows.ConfigSchema.string().optional(),
    title: Workflows.ConfigSchema.string().optional(),
    addressStreet: Workflows.ConfigSchema.string().optional(),
    addressStreet2: Workflows.ConfigSchema.string().optional(),
    addressCity: Workflows.ConfigSchema.string().optional(),
    addressState: Workflows.ConfigSchema.string().optional(),
    addressCountry: Workflows.ConfigSchema.string().optional(),
    addressZip: Workflows.ConfigSchema.string().optional(),
    linkedinUrl: Workflows.ConfigSchema.string().optional(),
    facebookUrl: Workflows.ConfigSchema.string().optional(),
    githubUrl: Workflows.ConfigSchema.string().optional(),
    twitterUrl: Workflows.ConfigSchema.string().optional(),
    websiteUrl: Workflows.ConfigSchema.string().optional(),
    gender: Workflows.ConfigSchema.string().optional(),
    occupation: Workflows.ConfigSchema.string().optional(),
    mobilePhone: Workflows.ConfigSchema.string().optional(),
    homePhone: Workflows.ConfigSchema.string().optional(),
    voipPhone: Workflows.ConfigSchema.string().optional(),
    workPhone: Workflows.ConfigSchema.string().optional(),
})

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "add-to-sequence",
    title: "Add to sequence",
    description:
        "Adds a prospect to an Outreach sequence using the selected mailbox and contact details.",
    requireUserConnection: true,
    configSchema: addToSequenceSchema,
})
