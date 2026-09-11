import type { SVGProps } from 'react';

/**
 * The ASTHIWAR building emblem mark: the two architectural pillars.
 * Traced from public/brand/asthiwar-mark.svg (viewBox: 0 0 161 570).
 *
 * Uses fill="currentColor" so color is inherited from parent text/color styles.
 */
export function AsthiwarMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 161 570"
      role="img"
      aria-label="ASTHIWAR building pillar mark"
      fill="currentColor"
      focusable="false"
      {...props}
    >
      <g transform="translate(-1966 2)">
        <g transform="translate(0.000000,566.000000) scale(0.100000,-0.100000)">
          <path
            data-shape="tower-left"
            d="M20157 5162 l-477 -477 0 -2327 c0 -1279 3 -2333 6 -2342 5 -14 58 -16 490 -16 l484 0 0 2820 c0 2266 -2 2820 -13 2820 -7 0 -227 -215 -490 -478z"
          />
          <path
            data-shape="tower-right"
            d="M20878 2023 c-2 -1099 -1 -2004 1 -2010 2 -10 48 -13 187 -13 l184 0 0 1833 0 1832 -178 178 c-97 97 -180 177 -184 177 -4 0 -8 -899 -10 -1997z"
          />
        </g>
      </g>
    </svg>
  );
}
