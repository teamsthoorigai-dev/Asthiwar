import localFont from 'next/font/local';

export const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/satoshi-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi-700.woff2',
      weight: '600 800',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});
