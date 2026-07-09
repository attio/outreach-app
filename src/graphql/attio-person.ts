import type {GetPersonByIdQuery} from "./get-person-by-id.graphql"

export type AttioPerson = NonNullable<GetPersonByIdQuery["person"]>
