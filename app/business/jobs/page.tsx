'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabase'

type Job = {
  id: string
  title: string
  city: string
  job_type: string
  pay_rate: string | null
  is_active: boolean
  created_at: string
}

export default function BusinessJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadJobs() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('You must be logged in to view your job posts.')
        setLoading(false)
        return
      }

      const { data, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, city, job_type, pay_rate, is_active, created_at')
        .eq('business_user_id', user.id)
        .order('created_at', { ascending: false })

      if (jobsError) {
        setError(jobsError.message)
        setLoading(false)
        return
      }

      setJobs(data || [])
      setLoading(false)
    }

    loadJobs()
  }, [])

  function formatPay(pay: string | null) {
    if (!pay) return null

    const str = String(pay).trim()
    if (!str) return null
    if (str.includes('$')) return str

    return `$${str}/hr`
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Posts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage the jobs you have posted.
          </p>
        </div>

        <Link
          href="/business/jobs/new"
          className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Post New Job
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading jobs...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">
            No job posts yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {job.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      {job.city} • {job.job_type}
                      {formatPay(job.pay_rate)
                        ? ` • ${formatPay(job.pay_rate)}`
                        : ''}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {job.is_active ? 'Active' : 'Inactive'} •{' '}
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex gap-2">
                    <Link
                      href={`/business/jobs/${job.id}/edit`}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/business/jobs/${job.id}/applicants`}
                      className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      Applicants
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}