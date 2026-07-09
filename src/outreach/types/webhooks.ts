import {z} from "zod"

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Outreach webhook event names used for trigger subscriptions. */
enum OutreachWebhookEventName {
    SEQUENCE_STATE_CREATED = "sequenceState.created",
    SEQUENCE_STATE_UPDATED = "sequenceState.updated",
}

/** JSON:API resource type identifiers used in Outreach webhook payloads. */
export enum OutreachResourceType {
    SEQUENCE_STATE = "sequenceState",
    SEQUENCE = "sequence",
    SEQUENCE_STEP = "sequenceStep",
    PROSPECT = "prospect",
    MAILBOX = "mailbox",
    USER = "user",
}

// ---------------------------------------------------------------------------
// Webhook payload schemas (incoming webhooks, separate from API responses)
// ---------------------------------------------------------------------------

/** Incoming webhook payload for a new prospect being added to a sequence. */
export const SequenceStateCreatedWebhookSchema = z.object({
    data: z.object({
        type: z.literal(OutreachResourceType.SEQUENCE_STATE),
        id: z.coerce.string(),
        attributes: z.unknown(),
        relationships: z.object({
            sequence: z.object({
                type: z.literal(OutreachResourceType.SEQUENCE),
                id: z.coerce.string(),
            }),
            prospect: z.object({
                type: z.literal(OutreachResourceType.PROSPECT),
                id: z.coerce.string(),
            }),
            mailbox: z.object({
                type: z.literal(OutreachResourceType.MAILBOX),
                id: z.coerce.string(),
            }),
            user: z.object({
                type: z.literal(OutreachResourceType.USER),
                id: z.coerce.string(),
            }),
        }),
    }),
    meta: z.object({
        eventName: z.literal(OutreachWebhookEventName.SEQUENCE_STATE_CREATED),
    }),
})

/** Incoming webhook payload for a sequence state change (e.g. step transition). */
export const SequenceStateUpdatedWebhookSchema = z.object({
    data: z.object({
        type: z.literal(OutreachResourceType.SEQUENCE_STATE),
        id: z.coerce.string(),
        attributes: z.unknown(),
        relationships: z.object({
            sequenceStep: z.object({
                type: z.literal(OutreachResourceType.SEQUENCE_STEP),
                id: z.coerce.string(),
            }),
        }),
    }),
    meta: z.object({
        eventName: z.literal(OutreachWebhookEventName.SEQUENCE_STATE_UPDATED),
    }),
})
