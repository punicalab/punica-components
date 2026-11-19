/**
 * The few glyphs components draw themselves, as static SVG markup for a
 * shadow template. Each is 1em square, takes `currentColor` and is hidden
 * from assistive technology; the control around it carries the name.
 */
const svg = (path) =>
  `<svg part="icon" class="icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;

export const icons = {
  chevronDown: svg('<path d="m6 9 6 6 6-6"/>'),
  chevronUp: svg('<path d="m6 15 6-6 6 6"/>'),
  /** Points to the inline end; mirror it under `:dir(rtl)`. */
  chevronEnd: svg('<path d="m9 6 6 6-6 6"/>'),
  /** Points to the inline start; mirror it under `:dir(rtl)`. */
  chevronStart: svg('<path d="m15 6-6 6 6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: svg('<path d="m5 12 5 5 9-10"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  more: svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  warning: svg('<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>'),
  error: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16h.01"/>'),
  success: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
  upload: svg('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
  externalLink: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  send: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  play: svg('<path d="M8 5v14l11-7z"/>'),
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>')
};
