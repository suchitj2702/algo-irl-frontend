/**
 * AlgoIRL brand logo.
 *
 * Three inline-SVG variants (same pattern as src/components/icons/GoogleIcon.tsx):
 *  - <LogoIcon />     the two-diamond mark only
 *  - <LogoWordmark /> the "AlgoIRL" letterforms only
 *  - <LogoLockup />   icon + wordmark, side by side
 *
 * Path data is transcribed verbatim from the designer's corrected source SVGs
 * (src/assets/logo/AlgoIRL Logo Source Files/SVG/AlgoIRL Logo-0{1,2}.svg). The icon geometry is
 * identical in both files, so it is shared here.
 *
 * Color model:
 *  - The icon uses fixed brand colors and is self-contained, so it reads correctly on
 *    both light and dark backgrounds. The teal/periwinkle diamonds overlap into a navy
 *    intersection (#004D93). The "bowtie" connector is negative space in the source
 *    artwork; we paint it white so it stays crisp on dark backgrounds too.
 *  - The wordmark is filled with `currentColor`, so consumers control it with text color
 *    (default usage passes `text-content`, i.e. --foreground: #0F172A light / #F0F4F8 dark).
 *
 * Size with a height utility (e.g. `h-7 w-auto`) — the viewBox carries the aspect ratio.
 */

// Brand palette
const TEAL = '#00B19A';
const PERIWINKLE = '#666FF3';
const OVERLAP = '#004D93';
const BOWTIE = '#FFFFFF';

// --- Icon geometry (shared; viewBox "0 0 278 208.5") ---
const ICON_BOWTIE =
  'M190.2,82c-5-0.2-9.6,1.3-13.4,3.9c-9.7,6.6-21,10.6-32.7,11.1c-0.8,0-1.6,0-2.3,0h-5.7h0c-12.5,0-24.5-4.1-34.8-11.1c-0.5-0.3-1-0.6-1.5-0.9c-1-0.6-2.1-1.1-3.2-1.5c-2.7-1.1-5.8-1.6-8.9-1.5c-0.9,0-1.7,0.1-2.5,0.3c-2,0.3-3.9,0.9-5.7,1.6c-7.5,3.4-12.8,10.7-13.2,19.3c-0.5,9.6,5.1,17.9,13.2,21.5c2.8,1.2,5.9,1.9,9.1,1.9c4.6,0,8.9-1.4,12.5-3.8c10.6-7.1,22.9-11.2,35.7-11.2h4.3c12.8,0,25.1,4.1,35.7,11.2c3.6,2.4,7.8,3.8,12.5,3.8c3.2,0,6.3-0.7,9-1.9l-0.1,0.1c0.1,0,0.1,0,0.2-0.1c8.1-3.6,13.7-11.9,13.2-21.5c-0.4-8.6-5.7-16-13.2-19.3c-0.1,0-0.1,0-0.2-0.1l0.1,0.1C195.9,82.8,193.1,82.1,190.2,82z';

const ICON_PERIWINKLE = [
  'M270.7,86.8L191.1,7.2c-9.6-9.6-25.2-9.6-34.8,0L139,24.5l59.3,59.3c0.1,0,0.1,0,0.2,0.1c7.5,3.3,12.8,10.7,13.2,19.3c0.5,9.6-5.1,17.9-13.2,21.5c-0.1,0-0.1,0-0.2,0.1L139.1,184l17.3,17.3c9.6,9.6,25.2,9.6,34.8,0l79.6-79.6C280.4,112.1,280.4,96.5,270.7,86.8z',
  'M190.2,82C190.2,82,190.2,82,190.2,82c-5-0.2-9.7,1.3-13.5,3.9c-9.7,6.6-20.9,10.6-32.6,11.1c11.7-0.5,22.9-4.5,32.7-11.1C180.6,83.3,185.2,81.8,190.2,82z',
  'M189.3,126.6C189.3,126.6,189.3,126.6,189.3,126.6c-4.6,0-8.8-1.4-12.4-3.8C180.4,125.2,184.6,126.6,189.3,126.6z',
  'M85.3,82.3c0.8-0.1,1.7-0.2,2.5-0.3C86.9,82,86.1,82.1,85.3,82.3z',
];

const ICON_TEAL = [
  'M79.6,124.7c-8.1-3.6-13.7-11.9-13.2-21.5c0.4-8.6,5.7-15.9,13.2-19.3c1.8-0.8,3.7-1.3,5.7-1.6c-2,0.3-3.9,0.9-5.7,1.6L139,24.5L121.6,7.2c-9.6-9.6-25.2-9.6-34.8,0L7.2,86.9c-9.6,9.6-9.6,25.2,0,34.8l79.7,79.7c9.6,9.6,25.2,9.6,34.8,0l17.4-17.4l-0.1,0L79.6,124.7z',
  'M190.2,82c2.9,0.1,5.7,0.8,8.2,1.9l-0.1-0.1C195.9,82.8,193.1,82.1,190.2,82C190.3,82,190.2,82,190.2,82z',
  'M96.7,83.5c1.1,0.4,2.2,0.9,3.2,1.5C98.8,84.4,97.8,83.9,96.7,83.5z',
  'M136.1,97L136.1,97c-12.5,0-24.5-4.1-34.8-11.1c-0.5-0.3-1-0.6-1.5-0.9c0.5,0.3,1,0.6,1.5,0.9C111.6,92.9,123.6,97,136.1,97z',
  'M189.4,126.6C189.4,126.6,189.4,126.6,189.4,126.6c3.2,0,6.2-0.7,9-1.8l0.1-0.1C195.6,125.9,192.5,126.6,189.4,126.6z',
];

const ICON_OVERLAP = [
  'M189.4,126.6C189.4,126.6,189.4,126.6,189.4,126.6c-0.1,0-0.1,0-0.1,0c-4.7,0-8.9-1.4-12.4-3.8c-10.6-7.1-22.9-11.2-35.7-11.2h-4.3c-12.8,0-25.1,4.1-35.7,11.2c-3.6,2.4-7.9,3.8-12.5,3.8c-3.2,0-6.3-0.7-9.1-1.9L139,184l0.1,0l59.3-59.3C195.6,125.9,192.5,126.6,189.4,126.6z',
  'M85.3,82.3c0.8-0.1,1.7-0.2,2.5-0.3c3.1-0.1,6.1,0.4,8.9,1.5c1.1,0.4,2.2,0.9,3.2,1.5c0.5,0.3,1,0.6,1.5,0.9c10.3,7,22.3,11.1,34.8,11.1h5.7c0.8,0,1.6,0,2.3,0c11.7-0.5,22.9-4.5,32.6-11.1c3.8-2.6,8.5-4.1,13.5-3.9c0,0,0,0,0,0c0,0,0.1,0,0.1,0c2.8,0.1,5.6,0.8,8,1.8L139,24.5L79.6,83.9C81.4,83.1,83.3,82.6,85.3,82.3z',
];

// --- Wordmark letterforms A·l·g·o·I·R·L (within the lockup viewBox, x ≈ 274–894) ---
const WORDMARK_PATHS = [
  'M274,168.9l52.4-143.4h27.4l52.4,143.4h-26L340,54.2l-40.4,114.7H274z M297.4,135.1l6.5-19.5h70.7l6.5,19.5H297.4z',
  'M415.8,168.9V21.5h24.6V169h-24.6V168.9z',
  'M528.2,155c-5.7-2.6-13.2-4.2-22.3-4.9c-5.9-0.5-10.6-1.1-14.3-1.6c-3.7-0.5-6.7-1.1-8.9-1.7s-4.1-1.3-5.5-2.1c-0.2-0.1-0.5-0.3-0.7-0.4l8.1-7.9c4.2,1.2,8.9,1.8,14,1.8c8.6,0,16-1.7,22.1-5s10.8-7.8,14.1-13.5s4.9-11.9,4.9-18.7c0-6.8-1.6-12.9-4.7-18.4l11.5-0.8V65.7h-32c-4.8-1.6-10.1-2.5-16-2.5c-8.6,0-16,1.7-22.2,5.1s-11,7.9-14.2,13.5c-3.3,5.6-4.9,11.9-4.9,18.8c0,6.8,1.6,13.1,4.9,18.7c1.9,3.2,4.2,6,7,8.5l-18,18.9v4.7c1.8,1.8,4,3.5,6.8,5.2c1.7,1.1,3.6,2,5.7,2.9c-0.2,0.2-0.5,0.4-0.7,0.5c-4.3,3.5-7.5,7.2-9.6,11.3c-2.1,4-3.2,8.2-3.2,12.4c0,7.2,2,13.3,6,18.1s9.7,8.5,17,10.9s15.8,3.6,25.5,3.6c10.6,0,19.4-1.7,26.2-5.1c6.8-3.4,11.9-7.8,15.3-13.1c3.3-5.3,5-11,5-17c0-6.1-1.4-11.4-4.1-15.8C538.1,161.1,533.9,157.6,528.2,155z M484.1,87.3c3.7-3.1,8.5-4.6,14.3-4.6c5.9,0,10.6,1.5,14.1,4.6s5.3,7.6,5.3,13.4c0,5.9-1.8,10.4-5.3,13.5s-8.3,4.7-14.1,4.7s-10.6-1.6-14.3-4.7s-5.5-7.6-5.5-13.5S480.4,90.4,484.1,87.3z M519,190.2c-2,2.3-4.8,4.1-8.3,5.4c-3.5,1.3-7.7,1.9-12.5,1.9c-4.9,0-9.3-0.6-13.2-1.8c-3.9-1.2-7-3-9.2-5.4s-3.4-5.4-3.4-8.9c0-3.4,1.3-6.8,3.9-10c1.8-2.2,4.4-4.2,8-6c4.8,0.8,10.3,1.4,16.4,1.9c8.5,0.6,14.1,2.1,17,4.6s4.3,5.8,4.3,9.9C522,185.1,521,187.9,519,190.2z',
  'M596.6,171.4c-9.8,0-18.7-2.3-26.5-6.9c-7.8-4.6-14-10.9-18.4-19.1c-4.4-8.1-6.7-17.4-6.7-28c0-10.8,2.2-20.2,6.8-28.4c4.5-8.1,10.7-14.5,18.5-19.1S587,63,596.8,63s18.7,2.3,26.5,6.9s14,10.9,18.4,18.9s6.7,17.5,6.7,28.3s-2.2,20.2-6.8,28.3c-4.5,8.1-10.7,14.4-18.5,18.9C615.2,169.1,606.4,171.4,596.6,171.4z M596.6,150.3c4.9,0,9.4-1.2,13.4-3.7s7.3-6.1,9.7-11.1c2.5-4.9,3.7-11,3.7-18.2s-1.2-13.3-3.6-18.1c-2.4-4.8-5.6-8.5-9.6-11s-8.5-3.7-13.4-3.7c-4.8,0-9.2,1.2-13.3,3.7s-7.4,6.1-9.8,11s-3.7,10.9-3.7,18.1s1.2,13.3,3.7,18.2s5.7,8.6,9.7,11.1C587.4,149,591.8,150.3,596.6,150.3z',
  'M658.1,168.9V25.5h24.6v143.4H658.1L658.1,168.9z',
  'M694.6,168.9V25.5H746c11.3,0,20.7,2,28.2,5.8s13,9.1,16.6,15.6s5.4,13.8,5.4,22c0,7.7-1.8,14.8-5.3,21.3c-3.5,6.6-9.1,11.8-16.6,15.8s-17.1,5.9-28.9,5.9h-26.2v56.9L694.6,168.9L694.6,168.9z M719.1,93.8h25.2c9.2,0,15.9-2.2,20.2-6.7s6.5-10.3,6.5-17.5c0-7.1-2.1-12.8-6.3-17.1s-11-6.5-20.3-6.5h-25.2L719.1,93.8L719.1,93.8z M769.3,168.9l-30.1-63.3h26.6l31.5,63.3H769.3z',
  'M805.4,168.9V25.5H830v124.1h63.9v19.2L805.4,168.9L805.4,168.9z',
];

interface LogoProps {
  className?: string;
  /** Render decoratively (hidden from assistive tech) when a parent already supplies the label. */
  decorative?: boolean;
}

function a11yProps(decorative?: boolean) {
  return decorative
    ? ({ 'aria-hidden': true, focusable: false } as const)
    : ({ role: 'img', 'aria-label': 'AlgoIRL', focusable: false } as const);
}

/** Icon layers, shared by LogoIcon and LogoLockup (identical coordinates in both source files). */
function IconLayers() {
  return (
    <>
      {/* bowtie connector — negative space in source, painted white for dark-mode legibility */}
      <path fill={BOWTIE} d={ICON_BOWTIE} />
      {ICON_PERIWINKLE.map((d, i) => (
        <path key={`p${i}`} fill={PERIWINKLE} d={d} />
      ))}
      {ICON_TEAL.map((d, i) => (
        <path key={`t${i}`} fill={TEAL} d={d} />
      ))}
      {ICON_OVERLAP.map((d, i) => (
        <path key={`o${i}`} fill={OVERLAP} d={d} />
      ))}
    </>
  );
}

export function LogoIcon({ className = '', decorative }: LogoProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 278 208.5"
      {...a11yProps(decorative)}
    >
      <IconLayers />
    </svg>
  );
}

export function LogoWordmark({ className = '', decorative }: LogoProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="272 19.5 623.9 198.8"
      fill="currentColor"
      {...a11yProps(decorative)}
    >
      {WORDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function LogoLockup({ className = '', decorative }: LogoProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 893.9 216.4"
      {...a11yProps(decorative)}
    >
      <g fill="currentColor">
        {WORDMARK_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <IconLayers />
    </svg>
  );
}
