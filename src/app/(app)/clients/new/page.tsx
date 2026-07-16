import Link from 'next/link'
import { createClient } from '@/actions/clients'
import { ClientForm } from '@/components/ClientForm'

export const dynamic = 'force-dynamic'

export default function NewClientPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/clients"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ← Клиенты
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Новый клиент</h1>
      </div>

      <ClientForm action={createClient} submitLabel="Создать клиента" />
    </div>
  )
}
