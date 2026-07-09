import {OutreachClient} from "../outreach-client"
import type {OutreachResult} from "../types"

export async function cleanupWebhook(cleanupToken: string): OutreachResult<null> {
    return new OutreachClient(cleanupToken).cleanupWebhook()
}
