import { contact } from './nav';

export const contactPage = {
  eyebrow: 'Contact',
  title: 'Start a project.',
  body: 'Tell us about your project, your site and what you want to build.',
  details: [
    { label: 'Address', value: contact.address },
    { label: 'Phone', value: contact.phone },
    { label: 'Email', value: contact.email },
    { label: 'Hours', value: 'Mon – Sat: 9:00 AM – 6:30 PM' },
  ],
  map: {
    previewSrc: '/images/lime-plaster.jpg',
    previewAlt: 'A lime-plastered facade with deep shade.',
    title: 'Coimbatore & Virudhunagar',
    detail: 'Studio hubs in Coimbatore and Virudhunagar, Tamil Nadu',
    buttonLabel: 'Open city map',
    embedSrc: 'https://www.google.com/maps?q=Coimbatore%2C%20Tamil%20Nadu&output=embed',
    embedTitle: 'Map of Coimbatore, Tamil Nadu',
  },
} as const;
