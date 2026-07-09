import type {AttioPerson} from "../../graphql/attio-person"
import type {ProspectAttributes} from "../types"

type PersonAttribute = AttioPerson["linkedin"]

function textAttributeValue(attr: PersonAttribute): string | undefined {
    return attr?.__typename === "TextValue" ? (attr.value ?? undefined) : undefined
}

/** Maps Attio GraphQL `person` fields into Outreach prospect attributes. */
export function prospectAttributesFromAttioPerson(
    person: AttioPerson
): Partial<Omit<ProspectAttributes, "emails">> {
    return {
        firstName: person.name?.first_name ?? undefined,
        lastName: person.name?.last_name ?? undefined,
        facebookUrl: textAttributeValue(person.facebook),
        linkedInUrl: textAttributeValue(person.linkedin),
        company: person.company?.name ?? undefined,
        workPhones: person.phone_numbers,
    }
}
