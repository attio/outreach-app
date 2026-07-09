import "event-target-polyfill"
import "yet-another-abortcontroller-polyfill"
import {QueryClient, QueryClientProvider, useSuspenseQueries} from "@tanstack/react-query"

export {QueryClientProvider, useSuspenseQueries}

export const queryClient = new QueryClient()
