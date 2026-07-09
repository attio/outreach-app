import {isErrored} from "@attio/fetchable"
import {experimental_Workflow, kv} from "attio/server"
import {outreachApiErrorUserMessage} from "../../outreach/types"
import {cleanupWebhook} from "../../outreach/webhooks/cleanup-webhook"
import {sequenceStateCreatedCleanupKvKey} from "./activate"
import block from "./block"

export default experimental_Workflow.defineWorkflowBlockDeactivate(
    block,
    async (_config, metadata) => {
        const key = sequenceStateCreatedCleanupKvKey(metadata.uniqueActivationId)
        const entry = await kv.get(key)
        const cleanupToken = entry?.value

        if (typeof cleanupToken === "string") {
            const cleanupResult = await cleanupWebhook(cleanupToken)
            if (isErrored(cleanupResult)) {
                return {
                    type: "error",
                    errorMessage: outreachApiErrorUserMessage(cleanupResult.error),
                }
            }
            await kv.delete(key)
        } else {
            console.error("Cleanup token not found for key", key)
            await kv.delete(key)
        }

        return {type: "complete"}
    }
)
