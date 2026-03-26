'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      await supabase.auth.signOut()
      setMessage('Login succeeded, but session was not created.')
      setLoading(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      await supabase.auth.signOut()
      setMessage('Login succeeded, but could not load user.')
      setLoading(false)
      return
    }

    const { data: userRow, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (roleError || !userRow) {
      await supabase.auth.signOut()
      setMessage('Logged in, but could not load account role.')
      setLoading(false)
      return
    }

    if (userRow.role === 'business') {
      router.push('/business/dashboard')
      router.refresh()
      return
    }

    if (userRow.role === 'mashgiach') {
      router.push('/mashgiach/dashboard')
      router.refresh()
      return
    }

    await supabase.auth.signOut()
    setMessage('Unknown account role.')
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    await handleLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Log in
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Access your Mashgiach Now account.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            {message && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}
          </form>

          <div className="mt-6 space-y-3 border-t border-gray-200 pt-6 text-center text-sm">
            <div>
              <Link
                href="/forgot-password"
                className="text-gray-700 hover:text-black"
              >
                Forgot password?
              </Link>
            </div>

            <div className="text-gray-600">Need an account?</div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup/business"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 transition hover:bg-gray-50"
              >
                Join as a Business
              </Link>

              <Link
                href="/signup/mashgiach"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 transition hover:bg-gray-50"
              >
                Join as a Mashgiach
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}