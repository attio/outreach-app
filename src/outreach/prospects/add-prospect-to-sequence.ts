import {complete, isErrored} from "@attio/fetchable"
import {getOutreach} from "../get-outreach"
import type {OutreachResult, ProspectAttributes} from "../types"
import {findOrCreateProspectId} from "./find-or-create-prospect-id"

export async function addProspectToSequence({
    sequenceId,
    mailboxId,
    email,
    attributes,
}: {
    sequenceId: string
    mailboxId: string
    email: string
    attributes?: Partial<Omit<ProspectAttributes, "emails">>
}): OutreachResult<{id: string}> {
    const prospectResult = await findOrCreateProspectId({
        emails: [email],
        attributes,
    })

    if (isErrored(prospectResult)) {
        return prospectResult
    }

    const outreach = getOutreach()
    const result = await outreach.addProspectToSequence({
        prospectId: prospectResult.value,
        sequenceId,
        mailboxId,
    })

    if (isErrored(result)) {
        return result
    }

    return complete({id: prospectResult.value})
}
