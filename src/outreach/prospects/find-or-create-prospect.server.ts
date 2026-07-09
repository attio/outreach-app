import {complete, isErrored} from "@attio/fetchable"
import type {AttioPerson} from "../../graphql/attio-person"
import type {OutreachResult} from "../types"
import {prospectAttributesFromAttioPerson} from "./attio-person-to-prospect-attributes"
import {findOrCreateProspectId} from "./find-or-create-prospect-id"

export default async function findOrCreateProspect(person: AttioPerson): OutreachResult<number> {
    const result = await findOrCreateProspectId({
        emails: person.email_addresses,
        attributes: prospectAttributesFromAttioPerson(person),
    })

    if (isErrored(result)) {
        return result
    }

    return complete(Number(result.value))
}
