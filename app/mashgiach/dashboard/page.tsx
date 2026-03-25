'use client'

import Link from 'next/link'

export default function MashgiachDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Mashgiach Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your profile and browse available jobs.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/mashgiach/profile"
            className="rounded-xl border border-gray-200 p-5 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-900">My Profile</h2>
            <p className="mt-1 text-sm text-gray-600">
              Update your experience, certifications, and availability.
            </p>
          </Link>

          <Link
            href="/mashgiach/jobs"
            className="rounded-xl border border-gray-200 p-5 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-900">Browse Jobs</h2>
            <p className="mt-1 text-sm text-gray-600">
              View open jobs and apply.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}