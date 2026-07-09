import {complete, isErrored} from "@attio/fetchable"
import {getOutreach} from "../get-outreach"
import type {OutreachResult} from "../types"

export default async function getSequences(): OutreachResult<Array<{id: number; name: string}>> {
    const outreach = getOutreach()
    const result = await outreach.listSequences()

    if (isErrored(result)) {
        return result
    }

    return complete(
        result.value.map((seq) => ({
            id: Number(seq.id),
            name: seq.name,
        }))
    )
}
