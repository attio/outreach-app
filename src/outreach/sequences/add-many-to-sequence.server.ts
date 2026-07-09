import {complete, isErrored} from "@attio/fetchable"
import type {AttioPerson} from "../../graphql/attio-person"
import {getOutreach} from "../get-outreach"
import findOrCreateProspect from "../prospects/find-or-create-prospect.server"
import type {OutreachResult} from "../types"

export default async function addManyToSequence({
    people,
    sequenceId,
    mailboxId,
}: {
    people: AttioPerson[]
    sequenceId: number
    mailboxId: number
}): OutreachResult<{addedCount: number; failedCount: number}> {
    const outreach = getOutreach()
    const prospectResults = await Promise.all(people.map((person) => findOrCreateProspect(person)))

    const prospectIds: number[] = []
    let failedCount = 0
    for (const result of prospectResults) {
        if (isErrored(result)) {
            failedCount++
        } else {
            prospectIds.push(result.value)
        }
    }

    if (prospectIds.length === 0) {
        // All failed — find the first error to return
        const firstError = prospectResults.find((r) => isErrored(r))
        if (firstError && isErrored(firstError)) {
            return firstError
        }
        return complete({addedCount: 0, failedCount})
    }

    const result = await outreach.addProspectsToSequence({
        sequenceId: String(sequenceId),
        prospectIds: prospectIds.map(String),
        mailboxId: String(mailboxId),
    })

    if (isErrored(result)) {
        return result
    }

    return complete({addedCount: prospectIds.length, failedCount})
}
