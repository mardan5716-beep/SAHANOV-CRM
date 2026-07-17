import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateClient } from '@/actions/clients'
import { ClientForm } from '@/components/ClientForm'

export const dynamic = 'force-dynamic'

export default async function EditClientPage({
  params,
}: {
  params: { id: string }
}) {
  const client = await prisma.client.findFirst({
    where: { id: params.id, deletedAt: null },
  })
  if (!client) notFound()

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/clients/${client.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ← Назад
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Редактирование клиента</h1>
      </div>

      <ClientForm
        action={updateClient.bind(null, client.id)}
        defaults={{
          name: client.name,
          phone: client.phone,
          address: client.address,
          notes: client.notes,
        }}
        submitLabel="Сохранить"
      />
    </div>
  )
}
