import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

function firstDayOfCurrentMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
}

function isSameMonth(dateString: string | null) {
  if (!dateString) return false

  const a = new Date(dateString)
  const b = new Date()

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth()
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const businessUserId = body?.businessUserId
    const mashgiachUserId = body?.mashgiachUserId

    if (!businessUserId || !mashgiachUserId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from('business_profiles')
      .select(
        'subscription_status, monthly_unlock_limit, unlocks_used_this_month, unlock_cycle_anchor'
      )
      .eq('user_id', businessUserId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403 }
      )
    }

    let used = profile.unlocks_used_this_month ?? 0
    const limit = profile.monthly_unlock_limit ?? 20

    // reset monthly
    if (!isSameMonth(profile.unlock_cycle_anchor)) {
      await supabaseAdmin
        .from('business_profiles')
        .update({
          unlocks_used_this_month: 0,
          unlock_cycle_anchor: firstDayOfCurrentMonth(),
        })
        .eq('user_id', businessUserId)

      used = 0
    }

    // already unlocked?
    const { data: existing } = await supabaseAdmin
      .from('profile_unlocks')
      .select('id')
      .eq('business_user_id', businessUserId)
      .eq('mashgiach_user_id', mashgiachUserId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        unlocksRemaining: limit - used,
      })
    }

    if (used >= limit) {
      return NextResponse.json(
        { error: 'Limit reached' },
        { status: 403 }
      )
    }

    // insert unlock
    await supabaseAdmin.from('profile_unlocks').insert({
      business_user_id: businessUserId,
      mashgiach_user_id: mashgiachUserId,
    })

    // increment usage
    await supabaseAdmin
      .from('business_profiles')
      .update({
        unlocks_used_this_month: used + 1,
      })
      .eq('user_id', businessUserId)

    return NextResponse.json({
      success: true,
      alreadyUnlocked: false,
      unlocksRemaining: limit - (used + 1),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Unlock failed' },
      { status: 500 }
    )
  }
}