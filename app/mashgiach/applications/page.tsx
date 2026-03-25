'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type Application = {
  id: string
  job_id: string
  status: string
  created_at: string
}

type Job = {
  id: string
  title: string
  city: string
  job_type: string
  pay_rate: string | null
  is_active: boolean
}

export default function MashgiachApplicationsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Record<string, Job>>({})

  useEffect(() => {
    async function loadApplications() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: applicationRows, error: applicationsError } = await supabase
        .from('job_applications')
        .select('id, job_id, status, created_at')
        .eq('mashgiach_user_id', user.id)
        .order('created_at', { ascending: false })

      if (applicationsError) {
        setError(applicationsError.message)
        setLoading(false)
        return
      }

      const apps = applicationRows || []
      setApplications(apps)

      if (apps.length === 0) {
        setLoading(false)
        return
      }

      const jobIds = Array.from(new Set(apps.map((app) => app.job_id)))

      const { data: jobRows, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, city, job_type, pay_rate, is_active')
        .in('id', jobIds)

      if (jobsError) {
        setError(jobsError.message)
        setLoading(false)
        return
      }

      const jobsMap: Record<string, Job> = {}
      ;(jobRows || []).forEach((job) => {
        jobsMap[job.id] = job
      })

      setJobs(jobsMap)
      setLoading(false)
    }

    loadApplications()
  }, [router])

  function formatPay(pay: string | null) {
    if (!pay) return null

    const str = String(pay).trim()
    if (!str) return null
    if (str.includes('$')) return str

    return `$${str}/hr`
  }

  function formatStatus(status: string) {
    if (!status) return 'Applied'

    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function statusClasses(status: string) {
    const normalized = (status || '').toLowerCase()

    if (normalized === 'accepted') {
      return 'bg-green-100 text-green-700'
    }

    if (normalized === 'rejected') {
      return 'bg-red-100 text-red-700'
    }

    if (normalized === 'interviewing' || normalized === 'reviewing') {
      return 'bg-blue-100 text-blue-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-gray-600">Loading applications...</div>
  }

  if (error) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-red-600">{error}</div>
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track the jobs you have applied to.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {applications.length === 0 ? (
          <div className="p-6">
            <p className="text-sm text-gray-600">You have not applied to any jobs yet.</p>

            <Link
              href="/mashgiach/jobs"
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {applications.map((application) => {
              const job = jobs[application.job_id]

              return (
                <div key={application.id} className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {job?.title || 'Job no longer available'}
                      </h2>

                      {job ? (
                        <p className="mt-1 text-sm text-gray-600">
                          {job.city} • {job.job_type}
                          {formatPay(job.pay_rate) ? ` • ${formatPay(job.pay_rate)}` : ''}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          This job may have been removed.
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
                            application.status
                          )}`}
                        >
                          {formatStatus(application.status)}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </span>

                        {job && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              job.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {job.is_active ? 'Job Active' : 'Job Inactive'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {job && (
                        <Link
                          href={`/mashgiach/jobs/${job.id}`}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View Job
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}