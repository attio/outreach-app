import {isErrored} from "@attio/fetchable"
import {experimental_Workflow, useAsyncCache} from "attio/client"
import Fuse from "fuse.js"
import {useMemo} from "react"
import getMailboxes from "../../outreach/mailboxes/get-mailboxes.server"
import getSequences from "../../outreach/sequences/get-sequences.server"
import block from "./block"

const fuseSearchOptions = {
    threshold: 0.35,
    ignoreLocation: true,
}

function createSearch<T>(items: T[] | null, keys: string[]) {
    return items == null ? null : new Fuse(items, {...fuseSearchOptions, keys})
}

function searchItems<T>(items: T[] | null, search: Fuse<T> | null, query: string) {
    if (items == null) {
        return []
    }

    const normalizedQuery = query.trim()
    return normalizedQuery === ""
        ? items
        : (search?.search(normalizedQuery).map(({item}) => item) ?? [])
}

export default experimental_Workflow.defineConfigurator(block, (workflowBlock) => {
    const {ComboboxInput, EmailAddressInput, TextInput, Outcome} =
        experimental_Workflow.useConfigurator(workflowBlock.schema)
    const {values} = useAsyncCache({
        sequences: getSequences,
        mailboxes: getMailboxes,
    })

    const sequences = useMemo(
        () =>
            isErrored(values.sequences)
                ? null
                : values.sequences.value.map((sequence) => ({
                      id: String(sequence.id),
                      name: sequence.name,
                  })),
        [values.sequences]
    )
    const mailboxes = useMemo(
        () =>
            isErrored(values.mailboxes)
                ? null
                : values.mailboxes.value.map((mailbox) => ({
                      id: String(mailbox.id),
                      email: mailbox.email,
                  })),
        [values.mailboxes]
    )
    const sequenceSearch = useMemo(() => createSearch(sequences, ["name"]), [sequences])
    const mailboxSearch = useMemo(() => createSearch(mailboxes, ["email"]), [mailboxes])

    return (
        <>
            <ComboboxInput
                name="sequenceId"
                label="Sequence"
                placeholder="Select a sequence..."
                searchPlaceholder="Search sequences..."
                options={{
                    async getOption(value: string) {
                        if (isErrored(values.sequences)) {
                            return {label: "Unable to load sequence", value}
                        }
                        if (sequences == null) {
                            return {label: "Unknown sequence", value}
                        }
                        const sequence = sequences.find((s) => s.id === value)
                        return sequence
                            ? {label: sequence.name, value: sequence.id}
                            : {label: "Unknown sequence", value}
                    },
                    async search(query: string) {
                        return searchItems(sequences, sequenceSearch, query).map((s) => ({
                            label: s.name,
                            value: s.id,
                        }))
                    },
                }}
                disableVariables
            />
            <ComboboxInput
                name="mailboxId"
                label="Mailbox"
                placeholder="Select a mailbox..."
                searchPlaceholder="Search mailboxes..."
                options={{
                    async getOption(value: string) {
                        if (isErrored(values.mailboxes)) {
                            return {label: "Unable to load mailbox", value}
                        }
                        if (mailboxes == null) {
                            return {label: "Unknown mailbox", value}
                        }
                        const mailbox = mailboxes.find((m) => m.id === value)
                        return mailbox
                            ? {label: mailbox.email, value: mailbox.id}
                            : {label: "Unknown mailbox", value}
                    },
                    async search(query: string) {
                        return searchItems(mailboxes, mailboxSearch, query).map((m) => ({
                            label: m.email,
                            value: m.id,
                        }))
                    },
                }}
                disableVariables
            />
            <EmailAddressInput name="email" label="Email" placeholder="Enter email address..." />
            <TextInput name="firstName" label="First name" placeholder="Enter first name..." />
            <TextInput name="lastName" label="Last name" placeholder="Enter last name..." />
            <TextInput
                name="companyName"
                label="Company name"
                placeholder="Enter company name..."
            />
            <TextInput name="title" label="Title" placeholder="Enter title..." />
            <TextInput
                name="addressStreet"
                label="Street address"
                placeholder="Enter street address..."
            />
            <TextInput
                name="addressStreet2"
                label="Street address 2"
                placeholder="Enter street address line 2..."
            />
            <TextInput name="addressCity" label="City" placeholder="Enter city..." />
            <TextInput name="addressState" label="State" placeholder="Enter state..." />
            <TextInput name="addressCountry" label="Country" placeholder="Enter country..." />
            <TextInput name="addressZip" label="Zip code" placeholder="Enter zip code..." />
            <TextInput
                name="linkedinUrl"
                label="LinkedIn URL"
                placeholder="Enter LinkedIn URL..."
            />
            <TextInput
                name="facebookUrl"
                label="Facebook URL"
                placeholder="Enter Facebook URL..."
            />
            <TextInput name="githubUrl" label="GitHub URL" placeholder="Enter GitHub URL..." />
            <TextInput name="twitterUrl" label="Twitter URL" placeholder="Enter Twitter URL..." />
            <TextInput name="websiteUrl" label="Website URL" placeholder="Enter website URL..." />
            <TextInput name="gender" label="Gender" placeholder="Enter gender..." />
            <TextInput name="occupation" label="Occupation" placeholder="Enter occupation..." />
            <TextInput
                name="mobilePhone"
                label="Mobile phone"
                placeholder="Enter mobile phone..."
            />
            <TextInput name="homePhone" label="Home phone" placeholder="Enter home phone..." />
            <TextInput name="voipPhone" label="VoIP phone" placeholder="Enter VoIP phone..." />
            <TextInput name="workPhone" label="Work phone" placeholder="Enter work phone..." />

            <Outcome
                slug="success"
                label="Success"
                schema={experimental_Workflow.Outcome.struct({
                    prospectId: experimental_Workflow.Outcome.string(),
                })}
            />
        </>
    )
})
