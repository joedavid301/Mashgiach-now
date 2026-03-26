'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type Job = {
  id: string
  title: string
  city: string
  job_type: string
  pay_rate: string | null
  description: string | null
  vegetable_checking_required: boolean
  food_safety_required: boolean
  agency_required: boolean
  agency_name: string | null
  is_active: boolean
}

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [jobType, setJobType] = useState('')
  const [payRate, setPayRate] = useState('')
  const [description, setDescription] = useState('')
  const [vegetableCheckingRequired, setVegetableCheckingRequired] = useState(false)
  const [foodSafetyRequired, setFoodSafetyRequired] = useState(false)
  const [agencyRequired, setAgencyRequired] = useState(false)
  const [agencyName, setAgencyName] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    async function loadJob() {
      if (!id) return

      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Job not found.')
        setLoading(false)
        return
      }

      const job = data as Job

      setTitle(job.title || '')
      setCity(job.city || '')
      setJobType(job.job_type || '')
      setPayRate(job.pay_rate || '')
      setDescription(job.description || '')
      setVegetableCheckingRequired(!!job.vegetable_checking_required)
      setFoodSafetyRequired(!!job.food_safety_required)
      setAgencyRequired(!!job.agency_required)
      setAgencyName(job.agency_name || '')
      setIsActive(job.is_active ?? true)

      setLoading(false)
    }

    loadJob()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return

    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('jobs')
      .update({
        title,
        city,
        job_type: jobType,
        pay_rate: payRate || null,
        description: description || null,
        vegetable_checking_required: vegetableCheckingRequired,
        food_safety_required: foodSafetyRequired,
        agency_required: agencyRequired,
        agency_name: agencyRequired ? agencyName || null : null,
        is_active: isActive,
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/business/jobs')
    router.refresh()
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading job...</div>
  }

  if (error && !title) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/business/jobs"
          className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/business/jobs"
        className="mb-6 inline-block text-sm font-medium text-gray-600 hover:text-black"
      >
        ← Back to Jobs
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Job</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Job Type
            </label>
            <input
              type="text"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="Full-time, Part-time, Temporary"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Pay Rate
            </label>
            <input
              type="text"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="$25/hr"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[140px] w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 p-4">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={vegetableCheckingRequired}
                onChange={(e) => setVegetableCheckingRequired(e.target.checked)}
              />
              Vegetable checking required
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={foodSafetyRequired}
                onChange={(e) => setFoodSafetyRequired(e.target.checked)}
              />
              Food safety certificate required
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agencyRequired}
                onChange={(e) => setAgencyRequired(e.target.checked)}
              />
              Agency required
            </label>

            {agencyRequired && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Agency Name
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  placeholder="OU, CRC, OK, etc."
                />
              </div>
            )}

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Job is active
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/business/jobs')}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}