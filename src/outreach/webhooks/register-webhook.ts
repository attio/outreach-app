import {getOutreach} from "../get-outreach"
import type {OutreachResourceType} from "../types"

export async function registerWebhook({
    action,
    resource,
    callbackUrl,
}: {
    action: "created" | "updated"
    resource: OutreachResourceType
    callbackUrl: string
}) {
    const outreach = getOutreach()
    return outreach.createWebhook({
        action,
        resource,
        url: callbackUrl,
    })
}
