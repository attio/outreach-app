import type {ZodError} from "zod"
import type {OutreachError} from "../outreach/types/errors"

/**
 * Structured logs for workflow trigger paths that return `{ type: "no-op" }`.
 */
export function logOutreachTriggerWebhookParseFailed(triggerId: string, error: ZodError): void {
    console.error(
        JSON.stringify({
            msg: "Outreach workflow trigger: webhook body failed validation",
            triggerId,
            error: error.issues,
        })
    )
}

export function logOutreachTriggerApiError(
    triggerId: string,
    context: string,
    errors: OutreachError[]
): void {
    console.error(
        JSON.stringify({
            msg: "Outreach workflow trigger: Outreach API error",
            triggerId,
            context,
            errors,
        })
    )
}
