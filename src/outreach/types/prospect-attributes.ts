/** Mutable attributes for creating or updating an Outreach prospect. */
export interface ProspectAttributes {
    emails: Array<string>
    firstName?: string
    lastName?: string
    name?: string
    company?: string
    occupation?: string
    title?: string
    addressStreet?: string
    addressStreet2?: string
    addressCity?: string
    addressState?: string
    addressCountry?: string
    addressZip?: string
    mobilePhones?: Array<string>
    homePhones?: Array<string>
    voipPhones?: Array<string>
    workPhones?: Array<string>
    linkedInUrl?: string
    facebookUrl?: string
    githubUrl?: string
    twitterUrl?: string
    websiteUrl1?: string
    gender?: string
}
