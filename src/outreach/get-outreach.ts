import {getUserConnection} from "attio/server"
import {OutreachClient} from "./outreach-client"

export function getOutreach(): OutreachClient {
    return new OutreachClient(getUserConnection().value)
}
