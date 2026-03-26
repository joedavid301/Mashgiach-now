import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userRow?.role === 'business') {
      redirect('/business/dashboard')
    }

    if (userRow?.role === 'mashgiach') {
      redirect('/mashgiach/dashboard')
    }

    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Mashgiach Now
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-gray-600">
          A smarter way to hire mashgiachim — post jobs, browse profiles, and connect instantly.
        </p>

        <div className="flex w-full max-w-md flex-col gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-black px-6 py-3 text-center font-medium text-white transition hover:bg-gray-800"
          >
            Log In
          </Link>

          <Link
            href="/signup/business"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-center font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Join as a Business
          </Link>

          <Link
            href="/signup/mashgiach"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-center font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Join as a Mashgiach
          </Link>
        </div>
      </div>
    </div>
  )
}