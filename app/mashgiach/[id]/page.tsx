import { redirect } from 'next/navigation'

export default async function MashgiachProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/directory/${id}`)
}