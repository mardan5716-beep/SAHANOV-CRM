'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseClient } from '@/lib/validation'

export type ClientFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = parseClient(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const client = await prisma.client.create({ data: parsed.data })
  revalidatePath('/clients')
  revalidatePath('/')
  redirect(`/clients/${client.id}`)
}

export async function updateClient(
  id: string,
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = parseClient(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await prisma.client.update({ where: { id }, data: parsed.data })
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  revalidatePath('/')
  redirect(`/clients/${id}`)
}

export async function deleteClient(id: string): Promise<void> {
  await prisma.client.delete({ where: { id } })
  revalidatePath('/clients')
  revalidatePath('/')
  redirect('/clients')
}
