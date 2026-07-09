import {TextBlock, useForm} from "attio/client"
import type {AttioPerson} from "../graphql/attio-person"

export function CreateProspectDialog({
    person,
    onSubmit,
}: {
    person: AttioPerson
    onSubmit: () => Promise<void>
}) {
    const {Form, SubmitButton} = useForm({}, {})

    return (
        <Form onSubmit={onSubmit}>
            <TextBlock>
                {person.name?.full_name?.trim() || "This person"} is not yet a prospect in Outreach.
            </TextBlock>
            <TextBlock>Would you like to create a new prospect for them?</TextBlock>
            <SubmitButton label="Create Prospect" />
        </Form>
    )
}
