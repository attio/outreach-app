import {complete, errored, isErrored} from "@attio/fetchable"
import type {AttioPerson} from "../../graphql/attio-person"
import {getOutreach} from "../get-outreach"
import {type OutreachResult, outreachClientValidationError} from "../types"
import {prospectAttributesFromAttioPerson} from "./attio-person-to-prospect-attributes"

export default async function createProspect(person: AttioPerson): OutreachResult<number> {
    const primary = person.email_addresses[0]
    if (!primary) {
        return errored(outreachClientValidationError("No email address on person"))
    }

    const outreach = getOutreach()
    const result = await outreach.createProspect({
        email: primary,
        emails: person.email_addresses,
        attributes: prospectAttributesFromAttioPerson(person),
    })

    if (isErrored(result)) {
        return result
    }

    return complete(Number(result.value.id))
}
