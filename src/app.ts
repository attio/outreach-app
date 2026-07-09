import type {App} from "attio"
import {peopleBulkAddToSequenceAction as addManyToSequenceAction} from "./record/actions/add-many-to-sequence-action"
import {personAddToSequenceAction as addToSequenceAction} from "./record/actions/add-to-sequence-action"
import {personOpenInOutreachAction as openInOutreachAction} from "./record/actions/open-in-outreach-action"

export const app: App = {
    record: {
        actions: [addToSequenceAction, openInOutreachAction],
        bulkActions: [addManyToSequenceAction],
        widgets: [],
    },
    callRecording: {
        insight: {textActions: []},
        summary: {textActions: []},
        transcript: {textActions: []},
    },
}
