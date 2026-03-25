'use client'

import Link from 'next/link'
import { supabase } from './lib/supabase'
import { useEffect, useState } from 'react'

export default function Home() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUser(user)
    }

    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      {/* TOP RIGHT */}
      <div className="absolute top-6 right-6">
        {!user ? (
          <Link
            href="/login"
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Login
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Logout
          </button>
        )}
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Mashgiach Now
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-gray-600">
          The fastest way for restaurants and food businesses to find qualified mashgiachs.
        </p>

        {/* MAIN ACTION BUTTONS */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/directory"
            className="rounded-xl bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 transition"
          >
            Browse Mashgiachim
          </Link>

          <Link
            href="/mashgiach/signup"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-900 hover:bg-gray-100 transition"
          >
            Join as a Mashgiach
          </Link>

          <Link
            href="/business/signup"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-900 hover:bg-gray-100 transition"
          >
            Join as a Business
          </Link>
        </div>

        {/* HOW IT WORKS */}
        <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            How it works
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">1. Sign up</h3>
              <p className="text-sm text-gray-600">
                Mashgiachs create a profile with experience, certifications, availability, and rate.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">2. Browse</h3>
              <p className="text-sm text-gray-600">
                Businesses browse the directory and view active mashgiach profiles.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">3. Unlock</h3>
              <p className="text-sm text-gray-600">
                Businesses unlock profiles to reveal full contact details and connect directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}