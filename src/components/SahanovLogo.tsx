/** Логотип-знак SAKHANOV: металлическая монограмма из фирменного логотипа. */
export function SahanovLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mark.png"
      alt="SAKHANOV"
      className={`rounded-xl bg-white object-contain ${className ?? ''}`}
    />
  )
}
