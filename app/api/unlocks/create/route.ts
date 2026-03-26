import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const mashgiachUserId = body?.mashgiachUserId as string | undefined

    if (!mashgiachUserId) {
      return NextResponse.json(
        { error: 'Missing mashgiachUserId' },
        { status: 400 }
      )
    }

    const businessUserId = user.id

    if (businessUserId === mashgiachUserId) {
      return NextResponse.json(
        { error: 'Cannot unlock your own profile' },
        { status: 400 }
      )
    }

    const { data: businessUser, error: businessUserError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', businessUserId)
      .maybeSingle()

    if (businessUserError) {
      return NextResponse.json(
        { error: 'Could not verify user role' },
        { status: 500 }
      )
    }

    if (!businessUser || businessUser.role !== 'business') {
      return NextResponse.json(
        { error: 'Only business accounts can unlock profiles' },
        { status: 403 }
      )
    }

    const { data: businessProfile, error: businessError } = await supabaseAdmin
      .from('business_profiles')
      .select(
        'user_id, subscription_status, monthly_unlock_limit, unlocks_used_this_month, unlock_cycle_anchor'
      )
      .eq('user_id', businessUserId)
      .maybeSingle()

    if (businessError) {
      return NextResponse.json(
        { error: 'Could not load business profile' },
        { status: 500 }
      )
    }

    if (!businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      )
    }

    const { data: mashgiachProfile, error: mashgiachError } = await supabaseAdmin
      .from('mashgiach_profiles')
      .select('user_id')
      .eq('user_id', mashgiachUserId)
      .maybeSingle()

    if (mashgiachError) {
      return NextResponse.json(
        { error: 'Could not load mashgiach profile' },
        { status: 500 }
      )
    }

    if (!mashgiachProfile) {
      return NextResponse.json(
        { error: 'Mashgiach profile not found' },
        { status: 404 }
      )
    }

    if (businessProfile.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403 }
      )
    }

    let used = businessProfile.unlocks_used_this_month ?? 0
    const limit = businessProfile.monthly_unlock_limit ?? 20

    if (!isSameMonth(businessProfile.unlock_cycle_anchor)) {
      const { error: resetError } = await supabaseAdmin
        .from('business_profiles')
        .update({
          unlocks_used_this_month: 0,
          unlock_cycle_anchor: firstDayOfCurrentMonth(),
        })
        .eq('user_id', businessUserId)

      if (resetError) {
        return NextResponse.json(
          { error: 'Could not reset unlock cycle' },
          { status: 500 }
        )
      }

      used = 0
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('profile_unlocks')
      .select('id')
      .eq('business_user_id', businessUserId)
      .eq('mashgiach_user_id', mashgiachUserId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { error: 'Could not check existing unlock' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        unlocksRemaining: Math.max(limit - used, 0),
      })
    }

    if (used >= limit) {
      return NextResponse.json(
        { error: 'Limit reached' },
        { status: 403 }
      )
    }

    const { error: insertError } = await supabaseAdmin
      .from('profile_unlocks')
      .insert({
        business_user_id: businessUserId,
        mashgiach_user_id: mashgiachUserId,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyUnlocked: true,
          unlocksRemaining: Math.max(limit - used, 0),
        })
      }

      return NextResponse.json(
        { error: 'Could not create unlock' },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('business_profiles')
      .update({
        unlocks_used_this_month: used + 1,
      })
      .eq('user_id', businessUserId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Unlock created but usage update failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alreadyUnlocked: false,
      unlocksRemaining: Math.max(limit - (used + 1), 0),
    })
  } catch (error) {
    console.error('Unlock route error:', error)
    return NextResponse.json({ error: 'Unlock failed' }, { status: 500 })
  }
}