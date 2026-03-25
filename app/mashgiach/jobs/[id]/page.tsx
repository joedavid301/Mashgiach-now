'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type Job = {
  id: string
  title: string
  city: string
  job_type: string
  pay_rate: string | null
  description: string
  requirements: string | null
  vegetable_checking_required: boolean
  food_safety_required: boolean
  agency_required: boolean
  agency_name: string | null
  business_user_id: string
  created_at: string
  is_active: boolean
}

type Profile = {
  user_id: string
  contact_name: string
}

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [applying, setApplying] = useState(false)
  const [applyMessage, setApplyMessage] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return

      setLoading(true)
      setError(null)
      setApplyMessage(null)

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError || !jobData) {
        setError('Job not found.')
        setLoading(false)
        return
      }

      if (!jobData.is_active) {
        setError('This job is no longer active.')
        setLoading(false)
        return
      }

      setJob(jobData)

      // ✅ FIXED HERE
      const { data: profileData } = await supabase
        .from('business_profiles')
        .select('user_id, contact_name')
        .eq('user_id', jobData.business_user_id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: applicationRow } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', jobData.id)
          .eq('mashgiach_user_id', user.id)
          .maybeSingle()

        setHasApplied(!!applicationRow)
      }

      setLoading(false)
    }

    loadJob()
  }, [jobId])

  function formatName(profile: Profile | null) {
    if (!profile?.contact_name) return 'Unknown'

    const parts = profile.contact_name.trim().split(' ')
    const first = parts[0]
    const lastInitial = parts.length > 1 ? `${parts[1][0]}.` : ''

    return `${first} ${lastInitial}`.trim()
  }

  async function handleApply() {
    setApplying(true)
    setApplyMessage(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setApplyMessage('You must be logged in as a mashgiach to apply.')
      setApplying(false)
      return
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!userRow || userRow.role !== 'mashgiach') {
      setApplyMessage('Only mashgichim can apply to jobs.')
      setApplying(false)
      return
    }

    if (!job) {
      setApplyMessage('Job not found.')
      setApplying(false)
      return
    }

    const { error } = await supabase.from('job_applications').insert({
      job_id: job.id,
      mashgiach_user_id: user.id,
    })

    if (error) {
      if (
        error.message.toLowerCase().includes('duplicate') ||
        error.message.toLowerCase().includes('unique')
      ) {
        setApplyMessage('You already applied to this job.')
        setHasApplied(true)
      } else {
        setApplyMessage(error.message)
      }
      setApplying(false)
      return
    }

    setHasApplied(true)
    setApplyMessage('Application submitted successfully.')
    setApplying(false)
  }

  if (loading) {
    return <div className="p-6">Loading job...</div>
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <Link href="/mashgiach/jobs">Back to Job Directory</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link href="/mashgiach/jobs" className="mb-4 inline-block text-sm text-gray-600">
        ← Back to Job Directory
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>

            <p className="mt-2 text-sm text-gray-600">
              {job.city} • {job.job_type}
              {job.pay_rate ? ` • ${job.pay_rate}` : ''}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Posted by {formatName(profile)} •{' '}
              {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleApply}
              disabled={applying || hasApplied}
              className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
            >
              {hasApplied ? 'Applied' : applying ? 'Applying...' : 'Apply Now'}
            </button>

            {applyMessage && (
              <p className="text-sm text-gray-600">{applyMessage}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {job.vegetable_checking_required && <span>Vegetable Checking Required</span>}
          {job.food_safety_required && <span>Food Safety Required</span>}
          {job.agency_required && job.agency_name && <span>{job.agency_name}</span>}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Job Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
            {job.description}
          </p>
        </div>

        {job.requirements && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Additional Requirements</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
              {job.requirements}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}