import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {getOutreach} from "../../../outreach/get-outreach"
import {SequenceStateCreatedWebhookSchema} from "../../../outreach/types"
import {
    logOutreachTriggerApiError,
    logOutreachTriggerWebhookParseFailed,
} from "../../../utils/outreach-workflow-trigger-log"
import block from "./block"

export default Workflows.defineWorkflowBlockTrigger(block, async (request, {config}) => {
    const rawBody = await request.json()
    const parseResult = SequenceStateCreatedWebhookSchema.safeParse(rawBody)

    if (!parseResult.success) {
        logOutreachTriggerWebhookParseFailed("triggerAddedToSequence", parseResult.error)
        return {type: "no-op"}
    }

    const expectedSequenceId = config.sequenceId
    const {data: webhookPayload} = parseResult.data

    if (expectedSequenceId !== webhookPayload.relationships.sequence.id) {
        return {type: "no-op"}
    }

    const outreach = getOutreach()
    const prospect = await outreach.getProspect(webhookPayload.relationships.prospect.id)

    if (isErrored(prospect)) {
        logOutreachTriggerApiError("triggerAddedToSequence", "getProspect", prospect.error)
        return {type: "no-op"}
    }

    return {
        type: "outcome",
        id: "done",
        data: {
            triggeredAt: new Date(),
            sequence_id: webhookPayload.relationships.sequence.id,
            mailbox_id: webhookPayload.relationships.mailbox.id,
            user_id: webhookPayload.relationships.user.id,
            prospect_id: webhookPayload.relationships.prospect.id,
            prospect_name: prospect.value.name ?? "",
            prospect_emails: prospect.value.emails,
        },
    }
})
