import {complete, isErrored} from "@attio/fetchable"
import type {AttioPerson} from "../../graphql/attio-person"
import {getOutreach} from "../get-outreach"
import findOrCreateProspect from "../prospects/find-or-create-prospect.server"
import type {OutreachResult} from "../types"

export default async function addToSequence({
    person,
    sequenceId,
    mailboxId,
}: {
    person: AttioPerson
    sequenceId: number
    mailboxId: number
}): OutreachResult<null> {
    const outreach = getOutreach()
    const prospectResult = await findOrCreateProspect(person)

    if (isErrored(prospectResult)) {
        return prospectResult
    }

    const result = await outreach.addProspectToSequence({
        prospectId: String(prospectResult.value),
        sequenceId: String(sequenceId),
        mailboxId: String(mailboxId),
    })

    if (isErrored(result)) {
        return result
    }

    return complete(null)
}
