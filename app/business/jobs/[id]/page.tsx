'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabase'

type Job = {
  id: string
  title: string
  city: string
  job_type: string
  pay_rate: string | null
  description: string | null
}

export default function JobDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadJob() {
      if (!id) return

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (!error) {
        setJob(data)
      }

      setLoading(false)
    }

    loadJob()
  }, [id])

  if (loading) return <div className="p-6">Loading...</div>

  if (!job) {
    return <div className="p-6 text-red-600">Job not found</div>
  }

  return (
    <div className="p-6">
      <Link
        href="/business/jobs"
        className="mb-4 inline-block text-sm text-gray-600 hover:text-black"
      >
        ← Back to Jobs
      </Link>

      <h1 className="text-2xl font-bold">{job.title}</h1>
      <p className="text-gray-600">{job.city}</p>

      <div className="mt-4 space-y-2">
        <p><strong>Type:</strong> {job.job_type}</p>
        <p><strong>Pay:</strong> {job.pay_rate || 'Not listed'}</p>
        <p><strong>Description:</strong> {job.description || 'No description'}</p>
      </div>

      <Link
        href={`/business/jobs/${job.id}/applicants`}
        className="mt-6 inline-block rounded-xl bg-black px-4 py-2 text-white"
      >
        View Applicants
      </Link>
    </div>
  )
}