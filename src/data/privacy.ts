/**
 * Privacy Policy for the ASTHIWAR website.
 *
 * Follows the running order of the policy on novascape.in (what is collected,
 * use, cookies, data protection, third parties, communication, rights, updates,
 * contact) in ASTHIWAR's own words, with a retention clause and a children's
 * clause added. It says only what this site does: there is no analytics,
 * advertising or newsletter here, so none is described. It also leaves out
 * Novascape's line reserving the right to contact people whose numbers are on
 * the Do Not Disturb register. Promotional calls and messages to a DND number
 * breach TRAI's rules, and this site sends none.
 *
 * Each claim traces to the code, so keep them in step with it:
 *  - collected:    home/EnquiryForm, calculator StepLeadCapture and
 *                  StepEstimateReport, backend enquiries.schema.ts
 *  - stored:       database/src/schema/{enquiries,estimates,auditLogs}.ts
 *  - shared with:  backend/src/services/{resend,whatsapp}.service.ts, and hosting
 *  - cookies:      backend/src/modules/auth, staff sign-in only
 * Adding analytics, advertising or a new processor means revisiting sections 1,
 * 3 and 5.
 */

import { legalContact, type LegalPage } from './legal';

export const privacyPage: LegalPage = {
  eyebrow: 'Legal',
  title: 'Privacy Policy',
  effectiveDate: { iso: '2026-09-21', label: '21 September 2026' },
  intro: [
    'ASTHIWAR Design & Build (“ASTHIWAR”, “we”, “us”) respects your privacy. This policy explains what personal information we collect through this website, how we use, share and protect it, and the choices you have. Please read it together with our ',
    { label: 'Terms & Conditions', href: '/terms' },
    '.',
  ],
  sections: [
    {
      id: 'information-we-collect',
      title: 'Information We Collect',
      blocks: [
        {
          type: 'text',
          text: 'The information we collect depends on how you use the website:',
        },
        {
          type: 'facts',
          items: [
            {
              label: 'Enquiries',
              text: 'Your name, phone number, email address and location, plus your project type, a preferred contact time and any message you choose to add.',
            },
            {
              label: 'Cost calculator',
              text: 'The same contact details, together with the plot size, floors, package, materials and add-ons you select, and the estimate and quotation we generate from them.',
            },
            {
              label: 'Technical data',
              text: 'Your IP address, browser and device type, and the time and outcome of requests to our servers, kept in security and error logs.',
            },
          ],
        },
        {
          type: 'text',
          text: 'We do not ask for bank, card or government ID details through this website.',
        },
      ],
    },
    {
      id: 'how-we-use-information',
      title: 'How We Use Your Information',
      blocks: [
        { type: 'text', text: 'We use your information to:' },
        {
          type: 'list',
          items: [
            'Respond to your enquiry and arrange a consultation or site visit.',
            'Prepare, store and send your cost estimate and quotation.',
            'Contact you about your enquiry, your project and our services.',
            'Keep records so that our team can follow up on your request consistently.',
            'Keep the website secure, prevent misuse such as automated or bulk submissions, and fix errors.',
            'Meet legal, tax and record-keeping obligations.',
          ],
        },
        { type: 'text', text: 'We do not sell your personal information.' },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies & Similar Technologies',
      blocks: [
        {
          type: 'text',
          text: 'The public pages of this website do not use advertising or analytics cookies, and they do not store your details in your browser.',
        },
        {
          type: 'text',
          text: 'The only cookies we set keep our own team signed in to the admin console. They are not set for visitors browsing the site.',
        },
        {
          type: 'text',
          text: 'If a page embeds third-party content, such as a map, that provider may set its own cookies once the content loads. We load embedded maps only when you choose to open them. You can block or delete cookies in your browser settings; the website will keep working.',
        },
      ],
    },
    {
      id: 'data-protection',
      title: 'Data Protection',
      blocks: [
        {
          type: 'text',
          text: 'We take reasonable technical and organisational steps to protect your information against unauthorised access, misuse, disclosure or loss. These include:',
        },
        {
          type: 'list',
          items: [
            'Sign-in protection for the admin console our team uses, with access limited by role.',
            'Private quotation links that expire and can be withdrawn.',
            'Masking of names, phone numbers and email addresses in our diagnostic logs.',
            'Limits on how often forms and estimates can be submitted, to deter abuse.',
          ],
        },
        {
          type: 'text',
          text: 'Anyone who has your quotation link can open your quotation, so please share it with care.',
        },
        {
          type: 'text',
          text: 'No method of transmission or storage over the internet is completely secure, so we cannot guarantee absolute security.',
        },
      ],
    },
    {
      id: 'third-party-services',
      title: 'Third-Party Services',
      blocks: [
        {
          type: 'text',
          text: 'We share your information only as far as needed to run the website and deal with your enquiry. The service providers we rely on include:',
        },
        {
          type: 'list',
          items: [
            'Cloud hosting and database providers, which store and serve the website and our records.',
            'An email delivery service, which sends quotations and other emails on our behalf.',
            'A messaging provider, if we contact you on WhatsApp.',
          ],
        },
        {
          type: 'text',
          text: 'These providers handle your information only to provide their service to us. Some may store or process it on servers outside India.',
        },
        {
          type: 'text',
          text: 'We may also disclose information where the law requires it, or to protect our rights, our team or others from harm.',
        },
      ],
    },
    {
      id: 'communication-consent',
      title: 'Communication Consent',
      blocks: [
        {
          type: 'text',
          text: 'When you send an enquiry or request an estimate, you agree that we may contact you about it by phone call, email, SMS or messaging platforms such as WhatsApp. We use your contact details for your enquiry, your quotation and your project, and to share information about our services.',
        },
        {
          type: 'text',
          text: 'You can ask us at any time to stop contacting you on a particular channel, or altogether, by writing to us using the contact details at the end of this policy. We will act on your request promptly.',
        },
      ],
    },
    {
      id: 'retention',
      title: 'How Long We Keep Your Information',
      blocks: [
        {
          type: 'text',
          text: 'We keep enquiry and quotation records for as long as they are needed to deal with your enquiry or project and to meet legal, tax and record-keeping requirements. When they are no longer needed, we delete or anonymise them.',
        },
        {
          type: 'text',
          text: 'A quotation link stops working when it expires. Diagnostic logs are kept only as long as needed for security and troubleshooting.',
        },
      ],
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      blocks: [
        {
          type: 'text',
          text: 'Under India’s Digital Personal Data Protection Act, 2023 and other applicable law, you may ask us to:',
        },
        {
          type: 'list',
          items: [
            'Tell you what personal information we hold about you and how we use it.',
            'Correct information that is inaccurate or out of date.',
            'Delete your personal information, unless the law requires us to keep it.',
            'Stop contacting you, or stop using your information for a purpose you agreed to.',
          ],
        },
        {
          type: 'text',
          text: 'To make a request, contact us using the details at the end of this policy. We may ask you to confirm who you are first, for example by quoting your quotation reference or the phone number you gave us.',
        },
        {
          type: 'text',
          text: 'If you are not satisfied with our response, you may also approach the Data Protection Board of India where the law allows.',
        },
      ],
    },
    {
      id: 'children',
      title: 'Children’s Privacy',
      blocks: [
        {
          type: 'text',
          text: 'This website is meant for adults planning a building project. It is not directed at children under 18, and we do not knowingly collect their personal information. If you believe a child has sent us their details, please contact us and we will delete them.',
        },
      ],
    },
    {
      id: 'policy-updates',
      title: 'Policy Updates',
      blocks: [
        {
          type: 'text',
          text: 'We may revise this Privacy Policy from time to time to reflect changes in the law or in how we operate. The effective date at the top of this page shows when it last changed, and continuing to use the website after a change means you accept the revised policy.',
        },
      ],
    },
    {
      id: 'contact-information',
      title: 'Contact Information',
      blocks: [
        {
          type: 'text',
          text: 'For any question, request or concern about your privacy, please contact us:',
        },
        {
          type: 'facts',
          items: [
            { label: 'Email', text: [legalContact.email] },
            { label: 'Phone', text: [legalContact.phone] },
            { label: 'Studios', text: legalContact.address },
          ],
        },
      ],
    },
  ],
};
