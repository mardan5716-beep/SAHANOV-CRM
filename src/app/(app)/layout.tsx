import { TopNav } from '@/components/TopNav'
import { BottomNav } from '@/components/BottomNav'
import { MobileHeader } from '@/components/MobileHeader'
import { requireManager } from '@/lib/session'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const manager = await requireManager()

  return (
    <div className="min-h-dvh">
      <MobileHeader managerName={manager.name} />
      <TopNav isAdmin={manager.isAdmin} managerName={manager.name} />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  )
}
