import type {AsyncResult} from "@attio/fetchable"

/** Error object returned by Outreach's JSON:API error payloads. */
export type OutreachError = {
    title: string
    detail: string
    code?: string
    id?: string
}

/** Unified result type for Outreach operations. */
export type OutreachResult<T = void> = AsyncResult<T, OutreachError[]>

/** Shared label for user-facing Outreach messages. */
const OUTREACH_USER_LABEL = "Outreach"

/** Creates a client-side validation error shaped like an Outreach API error. */
export function outreachClientValidationError(detail: string): OutreachError[] {
    return [
        {
            detail,
            title: "Validation",
        },
    ]
}

/** Creates a generic unexpected Outreach error for caught exceptions. */
export function unexpectedOutreachError(): OutreachError[] {
    return [
        {
            title: "Unexpected error",
            detail: "An unexpected error occurred.",
        },
    ]
}

/** Converts Outreach API errors into a human-readable message. */
export function outreachApiErrorUserMessage(errors: OutreachError[]): string {
    return outreachUserMessage(errors.map((error) => error.detail).join(" "))
}

/** Prefixes a message so users can distinguish Outreach-originated errors. */
function outreachUserMessage(message: string): string {
    return `${OUTREACH_USER_LABEL}: ${message}`
}
