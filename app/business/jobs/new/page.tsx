'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

export default function NewJobPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [jobType, setJobType] = useState('full-time')
  const [payRate, setPayRate] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [vegetableCheckingRequired, setVegetableCheckingRequired] =
    useState(false)
  const [foodSafetyRequired, setFoodSafetyRequired] = useState(false)
  const [agencyRequired, setAgencyRequired] = useState(false)
  const [agencyName, setAgencyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Could not load your account.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('jobs').insert({
      business_user_id: user.id,
      title,
      city,
      job_type: jobType,
      pay_rate: payRate || null,
      description,
      requirements: requirements || null,
      vegetable_checking_required: vegetableCheckingRequired,
      food_safety_required: foodSafetyRequired,
      agency_required: agencyRequired,
      agency_name: agencyRequired ? agencyName || null : null,
      is_active: true,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/business/jobs')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new job listing for mashgichim to view.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Part-Time Mashgiach for Catering Hall"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Brooklyn"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="temporary">Temporary</option>
                <option value="one-time">One-Time</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Pay Rate
            </label>
            <input
              type="text"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              placeholder="Example: $25/hr or Flat $250"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the job, schedule, environment, and what you need."
              required
              rows={5}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Additional Requirements
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Optional: prior restaurant experience, agency familiarity, weekend availability, etc."
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Requirements</h2>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={vegetableCheckingRequired}
                  onChange={(e) =>
                    setVegetableCheckingRequired(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Vegetable checking required
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={foodSafetyRequired}
                  onChange={(e) => setFoodSafetyRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Food safety certification required
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={agencyRequired}
                  onChange={(e) => setAgencyRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Specific agency required
              </label>
            </div>

            {agencyRequired && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Agency Name
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Example: OU"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/business/jobs')}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
