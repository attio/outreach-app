import {complete, isErrored} from "@attio/fetchable"
import {getOutreach} from "../get-outreach"
import type {OutreachResult} from "../types"

export default async function getMailboxes(): OutreachResult<Array<{id: number; email: string}>> {
    const outreach = getOutreach()
    const result = await outreach.listMailboxes()

    if (isErrored(result)) {
        return result
    }

    return complete(
        result.value.map((mb) => ({
            id: Number(mb.id),
            email: mb.email,
        }))
    )
}
