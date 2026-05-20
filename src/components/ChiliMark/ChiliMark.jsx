import React from "react";

function Svg({ size = 24, title, className, children }) {
  const a11y = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": "true", focusable: "false" };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      {...a11y}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function PepperCurl({ size, color = "currentColor", stemColor, className, title }) {
  const stem = stemColor || color;
  return (
    <Svg size={size} title={title} className={className}>
      <path
        d="M 70 26 C 38 22 18 38 18 56 C 18 78 38 90 64 84 L 64 72 C 46 76 32 70 32 56 C 32 42 46 36 64 38 Z"
        fill={color}
      />
      <path
        d="M 70 26 Q 66 16 58 18"
        stroke={stem}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="62" cy="20" rx="6" ry="3" transform="rotate(-22 62 20)" fill={stem} />
    </Svg>
  );
}

export function CLMonogram({ size, color = "currentColor", stemColor, className, title }) {
  const stem = stemColor || color;
  return (
    <Svg size={size} title={title} className={className}>
      <path
        d="M 52 26 C 28 26 18 40 18 56 C 18 74 32 86 54 86 L 54 74 C 38 74 30 66 30 56 C 30 44 40 38 52 38 Z"
        fill={color}
      />
      <path d="M 62 26 L 76 26 L 76 74 L 92 74 L 92 86 L 62 86 Z" fill={color} />
      <path
        d="M 36 20 Q 30 12 38 12"
        stroke={stem}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="40" cy="14" rx="5" ry="3" transform="rotate(-20 40 14)" fill={stem} />
    </Svg>
  );
}

export function PepperDrop({ size, color = "currentColor", stemColor, className, title }) {
  const stem = stemColor || color;
  return (
    <Svg size={size} title={title} className={className}>
      <path
        d="M 50 28 C 32 32 26 50 28 64 C 30 82 46 88 56 86 C 70 82 76 64 72 48 C 68 36 60 28 50 28 Z"
        fill={color}
      />
      <path d="M 36 22 Q 50 12 64 22 Q 60 30 50 30 Q 40 30 36 22 Z" fill={stem} />
      <line x1="50" y1="14" x2="50" y2="22" stroke={stem} strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

export function SeedDot({ size, color = "currentColor", stemColor, className, title }) {
  const stem = stemColor || color;
  return (
    <Svg size={size} title={title} className={className}>
      <circle cx="50" cy="56" r="34" fill={color} />
      <path d="M 44 22 Q 50 12 56 22 Q 56 26 50 26 Q 44 26 44 22 Z" fill={stem} />
      <line x1="50" y1="18" x2="50" y2="26" stroke={stem} strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

export default PepperCurl;
