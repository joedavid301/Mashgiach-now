'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import BillingButton from '@/app/components/BillingButton'
import ManageSubscriptionButton from '@/app/components/ManageSubscriptionButton'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [unlocksRemaining, setUnlocksRemaining] = useState<number | null>(null)
  const [monthlyUnlockLimit, setMonthlyUnlockLimit] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadBilling() {
      setLoading(true)
      setErrorMessage(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        setErrorMessage(`Could not load logged-in user: ${userError.message}`)
        setLoading(false)
        return
      }

      if (!user) {
        setErrorMessage('No logged-in user found.')
        setLoading(false)
        return
      }

      setCurrentUserId(user.id)

      const { data, error } = await supabase
        .from('business_profiles')
        .select(
          'user_id, subscription_status, monthly_unlock_limit, unlocks_used_this_month'
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        setErrorMessage(`Could not load billing profile: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data) {
        setErrorMessage('No business profile row found for this user.')
        setLoading(false)
        return
      }

      const limit = data.monthly_unlock_limit ?? 0
      const used = data.unlocks_used_this_month ?? 0

      setIsSubscribed(data.subscription_status === 'active')
      setMonthlyUnlockLimit(limit)
      setUnlocksRemaining(Math.max(limit - used, 0))

      setLoading(false)
    }

    loadBilling()
  }, [])

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Billing</h1>

      {loading ? (
        <p className="mb-8 text-sm text-gray-600">Loading billing...</p>
      ) : errorMessage ? (
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-red-600">{errorMessage}</p>
          {currentUserId && (
            <p className="text-xs text-gray-500">
              Logged in user ID: {currentUserId}
            </p>
          )}
        </div>
      ) : isSubscribed ? (
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-green-700">
            Your subscription is active.
          </p>

          {unlocksRemaining !== null && monthlyUnlockLimit !== null && (
            <p className="text-sm text-gray-600">
              {unlocksRemaining} of {monthlyUnlockLimit} unlocks remaining this
              month
            </p>
          )}
        </div>
      ) : (
        <p className="mb-8 text-sm text-gray-600">
          Subscribe to unlock Mashgiach profiles and access full contact
          details.
        </p>
      )}

      <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <p className="text-lg font-semibold text-gray-900">$100 / month</p>
          <p className="text-sm text-gray-500">
            Simple pricing. Cancel anytime.
          </p>
        </div>

        <ul className="space-y-2 text-sm text-gray-700">
          <li>• 20 profile unlocks per month</li>
          <li>• Full contact details for mashgichim</li>
          <li>• Access to qualified candidates</li>
          <li>• Fast hiring without agencies</li>
        </ul>

        <div className="pt-2">
          {isSubscribed ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
                You are currently subscribed.
              </div>
              <ManageSubscriptionButton />
            </div>
          ) : (
            <BillingButton />
          )}
        </div>
      </div>
    </div>
  )
}