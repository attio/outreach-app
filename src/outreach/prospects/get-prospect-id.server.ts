import {complete, isErrored} from "@attio/fetchable"
import {getOutreach} from "../get-outreach"
import type {OutreachResult} from "../types"

export default async function getProspectId(
    emailAddresses: Array<string>
): OutreachResult<number | null> {
    const outreach = getOutreach()

    for (const email of emailAddresses) {
        const result = await outreach.getProspectByEmail(email)
        if (isErrored(result)) {
            return result
        }
        if (result.value) {
            return complete(Number(result.value.id))
        }
    }

    return complete(null)
}
