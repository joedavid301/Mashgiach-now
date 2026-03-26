'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type Job = {
  id: string
  title: string
  description: string | null
  city: string
  job_type: string
  pay_rate: string | null
  created_at: string
  vegetable_checking_required: boolean
  food_safety_required: boolean
  agency_required: boolean
  agency_name: string | null
  business_user_id: string
  is_active: boolean
}

type BusinessProfile = {
  user_id: string
  contact_name: string | null
}

export default function MashgiachJobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadJob() {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          city,
          job_type,
          pay_rate,
          created_at,
          vegetable_checking_required,
          food_safety_required,
          agency_required,
          agency_name,
          business_user_id,
          is_active
        `)
        .eq('id', jobId)
        .single()

      if (jobError) {
        setError(jobError.message)
        setLoading(false)
        return
      }

      if (!jobData) {
        setError('Job not found.')
        setLoading(false)
        return
      }

      setJob(jobData)

      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('user_id, contact_name')
        .eq('user_id', jobData.business_user_id)
        .maybeSingle()

      if (businessData) {
        setBusinessProfile(businessData)
      }

      if (user) {
        const { data: applicationData } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('mashgiach_user_id', user.id)
          .maybeSingle()

        setAlreadyApplied(!!applicationData)
      }

      setLoading(false)
    }

    loadJob()
  }, [jobId])

  async function handleApply() {
    if (!job) return

    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to apply.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('job_applications').insert({
      job_id: job.id,
      mashgiach_user_id: user.id,
      status: 'pending',
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setAlreadyApplied(true)
    setSuccessMessage('Application submitted successfully.')
    setSubmitting(false)
  }

  function formatContactName(name?: string | null) {
    if (!name) return 'Unknown'

    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return 'Unknown'

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

  if (loading) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-gray-600">Loading job...</div>
  }

  if (error && !job) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-red-600">{error}</div>
  }

  if (!job) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-gray-600">Job not found.</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/mashgiach/jobs"
        className="mb-6 inline-block text-sm text-gray-600 hover:text-black"
      >
        ← Back to Jobs
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>

            <p className="mt-1 text-sm text-gray-600">
              {job.city} • {job.job_type}
            </p>

            {formatPay(job.pay_rate) && (
              <p className="mt-1 text-sm text-gray-700">
                Pay: {formatPay(job.pay_rate)}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              Posted by {formatContactName(businessProfile?.contact_name)} ·{' '}
              {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            {alreadyApplied ? (
              <span className="inline-block rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                Applied
              </span>
            ) : (
              <button
                onClick={handleApply}
                disabled={submitting || !job.is_active}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Applying...' : 'Apply Now'}
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {error && job && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {job.description && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold">Job Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
              {job.description}
            </p>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold">Requirements</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {job.vegetable_checking_required && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Vegetable Checking Required
              </span>
            )}

            {job.food_safety_required && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Food Safety Required
              </span>
            )}

            {job.agency_required && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Agency: {job.agency_name || 'Required'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}