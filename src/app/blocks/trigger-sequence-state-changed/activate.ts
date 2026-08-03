import {isErrored} from "@attio/fetchable"
import {Workflows, kv} from "attio/server"
import {getOutreach} from "../../../outreach/get-outreach"
import {OutreachResourceType, outreachApiErrorUserMessage} from "../../../outreach/types"
import {registerWebhook} from "../../../outreach/webhooks/register-webhook"
import block from "./block"

const sequenceStateUpdatedCleanupKvKey = (workflowActivationId: string) =>
    `outreach-sequence-state-updated-cleanup-${workflowActivationId}`

export default Workflows.defineWorkflowBlockActivate(block, async ({config, metadata}) => {
    if (!config.sequenceId) {
        return {type: "error", errorMessage: "Sequence is required."}
    }

    const outreach = getOutreach()
    const sequence = await outreach.getSequence(config.sequenceId)

    if (isErrored(sequence)) {
        return {
            type: "error",
            errorMessage: outreachApiErrorUserMessage(sequence.error),
        }
    }

    const result = await registerWebhook({
        action: "updated",
        resource: OutreachResourceType.SEQUENCE_STATE,
        callbackUrl: metadata.triggerCallbackUrl,
    })

    if (isErrored(result)) {
        return {
            type: "error",
            errorMessage: outreachApiErrorUserMessage(result.error),
        }
    }

    await kv.set(
        sequenceStateUpdatedCleanupKvKey(metadata.uniqueActivationId),
        result.value.cleanupToken
    )

    return {type: "complete"}
})

export {sequenceStateUpdatedCleanupKvKey}
