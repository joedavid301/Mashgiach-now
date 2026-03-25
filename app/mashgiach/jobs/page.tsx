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
  created_at: string
  vegetable_checking_required: boolean
  food_safety_required: boolean
  agency_required: boolean
  agency_name: string | null
  business_user_id: string
}

type Profile = {
  user_id: string
  contact_name: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadJobs() {
      setLoading(true)
      setError(null)

      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (jobsError) {
        setError(jobsError.message)
        setLoading(false)
        return
      }

      const jobsList = jobsData || []
      setJobs(jobsList)

      const userIds = Array.from(
        new Set(jobsList.map((j) => j.business_user_id))
      )

      if (userIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('business_profiles')
        .select('user_id, contact_name')
        .in('user_id', userIds)

      if (profilesError) {
        setError(profilesError.message)
        setLoading(false)
        return
      }

      const profileMap: Record<string, Profile> = {}
      profilesData?.forEach((p) => {
        profileMap[p.user_id] = p
      })

      setProfiles(profileMap)
      setLoading(false)
    }

    loadJobs()
  }, [])

  function formatName(profile?: Profile) {
    if (!profile?.contact_name) return 'Unknown'

    const parts = profile.contact_name.trim().split(' ')
    const first = parts[0]
    const lastInitial = parts.length > 1 ? `${parts[1][0]}.` : ''

    return `${first} ${lastInitial}`.trim()
  }

  function formatPay(pay: string | null) {
    if (!pay) return null

    const str = String(pay).trim()
    if (!str) return null
    if (str.includes('$')) return str

    return `$${str}/hr`
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold text-gray-900">Job Directory</h1>
      <p className="mt-2 text-sm text-gray-600">
        Browse available mashgiach positions.
      </p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading jobs...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">
            No jobs available right now.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => {
              const profile = profiles[job.business_user_id]

              return (
                <Link
                  key={job.id}
                  href={`/mashgiach/jobs/${job.id}`}
                  className="block p-6 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

                      <p className="mt-1 text-xs text-gray-500">
                        Posted by {formatName(profile)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.vegetable_checking_required && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            Vegetable Checking Required
                          </span>
                        )}

                        {job.food_safety_required && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            Food Safety Required
                          </span>
                        )}

                        {job.agency_required && job.agency_name && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            {job.agency_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}