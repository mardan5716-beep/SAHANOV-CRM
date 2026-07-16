'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  pendingText = 'Сохранение…',
  className,
}: {
  children: React.ReactNode
  pendingText?: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        'inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition active:scale-[0.99] disabled:opacity-60'
      }
    >
      {pending ? pendingText : children}
    </button>
  )
}
