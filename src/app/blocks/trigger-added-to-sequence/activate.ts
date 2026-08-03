import {isErrored} from "@attio/fetchable"
import {Workflows, kv} from "attio/server"
import {getOutreach} from "../../../outreach/get-outreach"
import {OutreachResourceType, outreachApiErrorUserMessage} from "../../../outreach/types"
import {registerWebhook} from "../../../outreach/webhooks/register-webhook"
import block from "./block"

const sequenceStateCreatedCleanupKvKey = (workflowActivationId: string) =>
    `outreach-sequence-state-created-cleanup-${workflowActivationId}`

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
        action: "created",
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
        sequenceStateCreatedCleanupKvKey(metadata.uniqueActivationId),
        result.value.cleanupToken
    )

    return {type: "complete"}
})

export {sequenceStateCreatedCleanupKvKey}
