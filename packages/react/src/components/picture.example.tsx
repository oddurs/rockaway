import { Picture } from '@rockaway/react';
import type { ReactNode } from 'react';

/** A sunset over the water, drawn inline so the example needs no file. */
const SUNSET = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b2f5c"/><stop offset=".55" stop-color="#e0766a"/>
      <stop offset="1" stop-color="#f4c38b"/></linearGradient></defs>
    <rect width="160" height="90" fill="url(#sky)"/>
    <circle cx="80" cy="58" r="14" fill="#fbe1a6"/>
    <rect y="60" width="160" height="30" fill="#33426b"/>
  </svg>`,
)}`;

export function Example(): ReactNode {
  return (
    <Picture
      src={SUNSET}
      alt="The sun setting over the water at Rockaway"
      ratio={16 / 9}
      cols={32}
      caption="Rockaway Beach, at the end of the day."
    />
  );
}
