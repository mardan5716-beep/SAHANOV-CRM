/** Логотип-знак SAKHANOV: серебристая монограмма S в шестиграннике на графите. */
export function SahanovLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="SAKHANOV">
      <defs>
        <linearGradient id="sahanov-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset="0.55" stopColor="#c2c7cc" />
          <stop offset="1" stopColor="#8d939a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="#1b1d21" />
      {/* кольцо-шестигранник */}
      <path
        fillRule="evenodd"
        fill="url(#sahanov-steel)"
        d="M43 24 L33.5 40.45 L14.5 40.45 L5 24 L14.5 7.55 L33.5 7.55 Z
           M38.5 24 L31.25 36.56 L16.75 36.56 L9.5 24 L16.75 11.44 L31.25 11.44 Z"
      />
      {/* монограмма S */}
      <path
        d="M31.7 16.3 C14.4 13.4 16.3 25 24 24 C31.7 23 33.6 34.6 16.3 31.7"
        fill="none"
        stroke="url(#sahanov-steel)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
