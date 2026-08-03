import {combineAsync, isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {getOutreach} from "../../../outreach/get-outreach"
import {SequenceStateUpdatedWebhookSchema} from "../../../outreach/types"
import {
    logOutreachTriggerApiError,
    logOutreachTriggerWebhookParseFailed,
} from "../../../utils/outreach-workflow-trigger-log"
import block from "./block"

export default Workflows.defineWorkflowBlockTrigger(block, async (request, {config}) => {
    const rawBody = await request.json()
    const parseResult = SequenceStateUpdatedWebhookSchema.safeParse(rawBody)

    if (!parseResult.success) {
        logOutreachTriggerWebhookParseFailed("triggerSequenceStateChanged", parseResult.error)
        return {type: "no-op"}
    }

    const webhookPayload = parseResult.data.data
    const sequenceStepId = webhookPayload.relationships.sequenceStep.id
    const outreach = getOutreach()

    const result = await combineAsync([
        outreach.getSequenceState(webhookPayload.id),
        outreach.getSequenceStep(sequenceStepId),
    ] as const)

    if (isErrored(result)) {
        logOutreachTriggerApiError(
            "triggerSequenceStateChanged",
            "getSequenceState_or_getSequenceStep",
            result.error
        )
        return {type: "no-op"}
    }

    const [sequenceState, sequenceStep] = result.value

    if (config.sequenceId !== sequenceState.sequenceId) {
        return {type: "no-op"}
    }

    const prospect = await outreach.getProspect(sequenceState.prospectId)

    if (isErrored(prospect)) {
        logOutreachTriggerApiError("triggerSequenceStateChanged", "getProspect", prospect.error)
        return {type: "no-op"}
    }

    return {
        type: "outcome",
        id: "done",
        data: {
            triggered_at: new Date(),
            sequence_id: sequenceState.sequenceId,
            sequence_step: sequenceStep.id,
            sequence_step_name: sequenceStep.displayName,
            prospect_id: sequenceState.prospectId,
            prospect_name: prospect.value.name ?? "",
            prospect_emails: prospect.value.emails,
        },
    }
})
