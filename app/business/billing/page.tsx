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
  const [extraUnlockCredits, setExtraUnlockCredits] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadBilling() {
      setLoading(true)
      setErrorMessage(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setErrorMessage('Could not load your account.')
        setLoading(false)
        return
      }

      setCurrentUserId(user.id)

      const { data, error } = await supabase
        .from('business_profiles')
        .select(
          'user_id, subscription_status, monthly_unlock_limit, extra_unlock_credits, unlocks_used_this_month'
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

      if (
        typeof data.monthly_unlock_limit !== 'number' ||
        typeof data.extra_unlock_credits !== 'number' ||
        typeof data.unlocks_used_this_month !== 'number'
      ) {
        setErrorMessage('Business billing fields are missing from this profile.')
        setLoading(false)
        return
      }

      const limit = data.monthly_unlock_limit
      const extraCredits = data.extra_unlock_credits
      const used = data.unlocks_used_this_month

      setIsSubscribed(data.subscription_status === 'active')
      setMonthlyUnlockLimit(limit)
      setExtraUnlockCredits(extraCredits)
      setUnlocksRemaining(Math.max(limit + extraCredits - used, 0))

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
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                {unlocksRemaining} of{' '}
                {monthlyUnlockLimit + (extraUnlockCredits ?? 0)} unlocks remaining
                this month
              </p>
              <p>
                Included plan: {monthlyUnlockLimit} unlocks
                {typeof extraUnlockCredits === 'number' && extraUnlockCredits > 0
                  ? ` • Extra credits: ${extraUnlockCredits}`
                  : ''}
              </p>
            </div>
          )}

          {unlocksRemaining !== null && unlocksRemaining <= 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                You have 0 unlocks remaining this month.
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Buy 5 more unlocks for $25 to continue.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 inline-flex cursor-not-allowed rounded-xl bg-black px-4 py-2 text-sm font-medium text-white opacity-70"
              >
                Buy 5 More Unlocks for $25
              </button>
              <p className="mt-2 text-xs text-amber-800">
                Checkout will be connected next.
              </p>
            </div>
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
          <li>• Buy 5 more unlocks for $25 when you run out</li>
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
