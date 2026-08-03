import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {addProspectToSequence} from "../../../outreach/prospects/add-prospect-to-sequence"
import type {ProspectAttributes} from "../../../outreach/types"
import {outreachApiErrorUserMessage} from "../../../outreach/types"
import block from "./block"

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const {sequenceId, mailboxId, email} = config
    type ProspectAttributesPayload = Partial<Omit<ProspectAttributes, "emails">>

    if (!sequenceId) {
        return {type: "error", errorMessage: "Sequence is required."}
    }

    if (!mailboxId) {
        return {type: "error", errorMessage: "Mailbox is required."}
    }

    if (!email.normalized) {
        return {type: "error", errorMessage: "Email address is required."}
    }

    const attributes = compactAttributes({
        firstName: config.firstName,
        lastName: config.lastName,
        company: config.companyName,
        title: config.title,
        addressStreet: config.addressStreet,
        addressStreet2: config.addressStreet2,
        addressCity: config.addressCity,
        addressState: config.addressState,
        addressCountry: config.addressCountry,
        addressZip: config.addressZip,
        linkedInUrl: config.linkedinUrl,
        facebookUrl: config.facebookUrl,
        githubUrl: config.githubUrl,
        twitterUrl: config.twitterUrl,
        websiteUrl1: config.websiteUrl,
        gender: config.gender,
        occupation: config.occupation,
        mobilePhones: config.mobilePhone ? [config.mobilePhone] : undefined,
        homePhones: config.homePhone ? [config.homePhone] : undefined,
        voipPhones: config.voipPhone ? [config.voipPhone] : undefined,
        workPhones: config.workPhone ? [config.workPhone] : undefined,
    } satisfies ProspectAttributesPayload)

    const result = await addProspectToSequence({
        sequenceId,
        mailboxId,
        email: email.normalized,
        attributes,
    })

    if (isErrored(result)) {
        return {
            type: "error",
            errorMessage: outreachApiErrorUserMessage(result.error),
        }
    }

    return {type: "outcome", id: "success", data: {prospectId: result.value.id}}
})

function compactAttributes(
    attributes: Partial<Omit<ProspectAttributes, "emails">>
): Partial<Omit<ProspectAttributes, "emails">> | undefined {
    const entries = Object.entries(attributes).filter(([, value]) => value !== undefined)

    return entries.length > 0 ? Object.fromEntries(entries) : undefined
}
