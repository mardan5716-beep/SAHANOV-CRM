'use client'

/**
 * Кнопка удаления с подтверждением через нативный confirm().
 * `action` — привязанный server action (например deleteOrder.bind(null, id)).
 */
export function ConfirmDeleteButton({
  action,
  label = 'Удалить',
  confirmText = 'Удалить? Действие необратимо.',
}: {
  action: () => Promise<void>
  label?: string
  confirmText?: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-xl border border-red-300 px-4 py-3 text-base font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.99] dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        {label}
      </button>
    </form>
  )
}
