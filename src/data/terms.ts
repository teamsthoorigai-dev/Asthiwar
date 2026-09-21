/**
 * Terms & Conditions for the ASTHIWAR website.
 *
 * Follows the running order of the terms on novascape.in (website use,
 * information disclaimer, intellectual property, third-party links,
 * submissions, liability, privacy, changes, governing law), adapted to a
 * design-and-build practice. The wording is ASTHIWAR's own.
 *
 * "Cost Estimates & Quotations" restates the TERMS & STANDARD CONDITIONS
 * printed on the quotation PDF (backend/src/modules/pdf/pdf.service.ts), so a
 * customer reads the same terms on the site and on the document. The PDF keeps
 * its own copy: if a term changes there (the 30-day validity, the GST rate, the
 * payment rule), change it here too.
 */

import type { LegalPage } from './legal';

export const termsPage: LegalPage = {
  eyebrow: 'Legal',
  title: 'Terms & Conditions',
  effectiveDate: { iso: '2026-09-21', label: '21 September 2026' },
  intro:
    'These terms apply to your use of the website of ASTHIWAR Design & Build (“ASTHIWAR”, “we”, “us”). By using the website you accept them. If any part is not acceptable to you, please do not use the website.',
  closing: 'Questions about these terms?',
  sections: [
    {
      id: 'website-usage',
      title: 'Website Usage',
      blocks: [
        {
          type: 'text',
          text: 'The content on this website is provided for general information only. In using it, you agree to:',
        },
        {
          type: 'list',
          items: [
            'Use the website lawfully and responsibly.',
            'Not misuse, disrupt or interfere with the website or its operation, including through automated or bulk submissions.',
            'Not attempt to gain unauthorised access to restricted areas, systems or data.',
            'Not copy, reproduce or distribute website content without our permission.',
          ],
        },
        {
          type: 'text',
          text: 'We may restrict or end access for anyone who breaks these terms.',
        },
      ],
    },
    {
      id: 'project-information',
      title: 'Project Information Disclaimer',
      blocks: [
        {
          type: 'text',
          text: 'Project details, specifications, packages, prices, visuals and availability shown on this website, including our project portfolio, may change without prior notice.',
        },
        {
          type: 'text',
          text: 'We take care over accuracy, but the website may contain typing errors, outdated details or omissions. Photographs, renderings and 3D visuals are illustrative, and the finished work may differ from them.',
        },
        {
          type: 'text',
          text: 'Nothing on this website is an offer, a contract or a guarantee of any service or result.',
        },
      ],
    },
    {
      id: 'cost-estimates',
      title: 'Cost Estimates & Quotations',
      blocks: [
        {
          type: 'text',
          text: 'The cost calculator, and any quotation PDF generated from it, gives an indicative project budget, not a fixed price. The final cost depends on design, specifications, site conditions, materials and project requirements. Unless a written quotation says otherwise, these standard conditions apply:',
        },
        {
          type: 'facts',
          items: [
            {
              label: 'Validity',
              text: 'An estimate is valid for 30 calendar days from the date it is generated.',
            },
            {
              label: 'Rate basis',
              text: 'Built-up area is measured outer-to-outer, including balconies and parking as specified.',
            },
            {
              label: 'Inclusions',
              text: '100% material and labour, structural drawings, 3D elevation and site engineer supervision.',
            },
            {
              label: 'Exclusions',
              text: 'Government building approval fees, EB permanent connection deposits and borewell depth beyond allowances. The complete list of exclusions appears on every estimate and quotation.',
            },
            {
              label: 'Payments',
              text: 'No advance beyond the Stage 1 booking fee. Milestone payments fall due only after the site stage has been verified.',
            },
            {
              label: 'Taxes',
              text: 'GST at 18% is extra, as applicable.',
            },
          ],
        },
        {
          type: 'text',
          text: 'A project is confirmed only through a written quotation or agreement accepted by both ASTHIWAR and the client.',
        },
      ],
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      blocks: [
        {
          type: 'text',
          text: 'All content on this website, including text, graphics, logos, drawings, designs, images, videos and branding, is owned by or licensed to ASTHIWAR unless stated otherwise.',
        },
        {
          type: 'text',
          text: 'Copying, changing, reproducing or using any of it commercially without our permission is prohibited.',
        },
      ],
    },
    {
      id: 'third-party-links',
      title: 'Third-Party Links',
      blocks: [
        {
          type: 'text',
          text: 'For your convenience, the website may link to or embed third-party services, such as maps and social media platforms. We do not control or endorse their content, policies or practices, and we are not responsible for any loss or damage arising from your use of them.',
        },
      ],
    },
    {
      id: 'user-submissions',
      title: 'User Submissions',
      blocks: [
        {
          type: 'text',
          text: 'When you send an enquiry, request an estimate or share feedback or other details through the website, you agree that we may contact you about your enquiry and our services by phone call, email, SMS or messaging platforms such as WhatsApp.',
        },
        {
          type: 'text',
          text: 'You confirm that the information you submit is accurate and lawful.',
        },
      ],
    },
    {
      id: 'limitation-of-liability',
      title: 'Limitation of Liability',
      blocks: [
        {
          type: 'text',
          text: 'To the fullest extent permitted by law, ASTHIWAR is not liable for:',
        },
        {
          type: 'list',
          items: [
            'Any direct, indirect, incidental or consequential loss arising from use of the website.',
            'Delays, interruptions or technical failures.',
            'Decisions taken on the basis of information or estimates shown on the website.',
            'Loss of data, profit or business opportunity.',
          ],
        },
        { type: 'text', text: 'You use the website at your own risk.' },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      blocks: [
        {
          type: 'text',
          text: [
            'Your use of this website is also governed by our ',
            { label: 'Privacy Policy', href: '/privacy' },
            '.',
          ],
        },
      ],
    },
    {
      id: 'modifications',
      title: 'Modifications',
      blocks: [
        {
          type: 'text',
          text: 'We may update or revise these Terms & Conditions at any time without prior notice. The effective date at the top of this page shows when they last changed, and continuing to use the website after a change means you accept the revised terms.',
        },
      ],
    },
    {
      id: 'governing-law',
      title: 'Governing Law',
      blocks: [
        {
          type: 'text',
          text: 'These Terms & Conditions are governed by the laws of India. Any dispute arising from them falls under the jurisdiction of the appropriate courts.',
        },
      ],
    },
  ],
};
