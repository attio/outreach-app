import {LoadingState} from "attio/client"

export function Loading({text = "Loading..."}: {text?: string}) {
    return <LoadingState>{text}</LoadingState>
}
