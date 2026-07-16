import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ClientCard } from '@/components/ClientCard'
import { SearchInput } from '@/components/SearchInput'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = searchParams.q?.trim()
  const where: Prisma.ClientWhereInput = q
    ? { name: { contains: q, mode: 'insensitive' } }
    : {}

  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <Link
          href="/clients/new"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          + Новый
        </Link>
      </div>

      <SearchInput placeholder="Поиск по имени" />

      {clients.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-gray-800">
          Клиенты не найдены
        </p>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
