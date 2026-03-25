'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type Application = {
  id: string
  mashgiach_user_id: string
  status: string
  created_at: string
}

type MashgiachProfile = {
  user_id: string
  first_name: string
  last_name: string
  city: string
  phone: string | null
}

export default function JobApplicantsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState<string>('')
  const [applications, setApplications] = useState<Application[]>([])
  const [profiles, setProfiles] = useState<Record<string, MashgiachProfile>>({})

  useEffect(() => {
    async function loadApplicants() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: jobRow, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, business_user_id')
        .eq('id', jobId)
        .maybeSingle()

      if (jobError || !jobRow) {
        setError('Job not found.')
        setLoading(false)
        return
      }

      if (jobRow.business_user_id !== user.id) {
        setError('You do not have access to view applicants for this job.')
        setLoading(false)
        return
      }

      setJobTitle(jobRow.title)

      const { data: applicationRows, error: applicationsError } = await supabase
        .from('job_applications')
        .select('id, mashgiach_user_id, status, created_at')
        .eq('job_id', jobId)
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

      const mashgiachIds = Array.from(
        new Set(apps.map((app) => app.mashgiach_user_id))
      )

      const { data: profileRows, error: profileError } = await supabase
        .from('mashgiach_profiles')
        .select('user_id, first_name, last_name, city, phone')
        .in('user_id', mashgiachIds)

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      const profileMap: Record<string, MashgiachProfile> = {}
      ;(profileRows || []).forEach((profile) => {
        profileMap[profile.user_id] = profile
      })

      setProfiles(profileMap)
      setLoading(false)
    }

    loadApplicants()
  }, [jobId, router])

  if (loading) {
    return <div className="p-6">Loading applicants...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/jobs"
          className="mb-3 inline-block text-sm text-gray-600 hover:text-black"
        >
          ← Back to Jobs
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Applicants</h1>
        <p className="mt-2 text-sm text-gray-600">
          {jobTitle ? `Applicants for ${jobTitle}` : 'View applicants for this job.'}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">No applicants yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {applications.map((application) => {
            const profile = profiles[application.mashgiach_user_id]

            return (
              <Link
                key={application.id}
                href={`/mashgiach/${application.mashgiach_user_id}`}
                className="rounded-2xl border bg-white p-6 shadow-sm hover:bg-gray-50"
              >
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Unknown Applicant'}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {profile?.city || 'City not available'}
                </p>

                <p className="mt-3 text-sm text-gray-700">
                  Phone: {profile?.phone || 'Not available'}
                </p>

                <p className="mt-3 text-xs text-gray-500">
                  Status: {application.status}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Applied on {new Date(application.created_at).toLocaleDateString()}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}