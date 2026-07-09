import {complete, errored, isErrored} from "@attio/fetchable"
import {getOutreach} from "../get-outreach"
import {type OutreachResult, outreachClientValidationError, type ProspectAttributes} from "../types"

export async function findOrCreateProspectId({
    emails,
    attributes,
}: {
    emails: string[]
    attributes?: Partial<Omit<ProspectAttributes, "emails">>
}): OutreachResult<string> {
    if (emails.length === 0) {
        return errored(outreachClientValidationError("No email addresses provided"))
    }

    const outreach = getOutreach()

    for (const email of emails) {
        const foundResult = await outreach.getProspectByEmail(email)
        if (isErrored(foundResult)) {
            return foundResult
        }
        if (foundResult.value) {
            return complete(foundResult.value.id)
        }
    }

    // Safe: length checked at function entry
    const primary = emails[0] as string

    const createdResult = await outreach.createProspect({
        email: primary,
        emails,
        attributes,
    })

    if (isErrored(createdResult)) {
        return createdResult
    }

    return complete(createdResult.value.id)
}
