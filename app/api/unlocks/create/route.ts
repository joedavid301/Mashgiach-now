import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : null

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: no token' },
        { status: 401 }
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const mashgiachUserId = body?.mashgiachUserId as string | undefined

    if (!mashgiachUserId) {
      return NextResponse.json(
        { error: 'Missing mashgiachUserId' },
        { status: 400 }
      )
    }

    // 🔥 CALL THE ATOMIC DB FUNCTION (THIS IS THE FIX)
    const { data, error } = await supabaseAdmin.rpc(
      'create_profile_unlock_atomic',
      {
        p_business_user_id: user.id,
        p_mashgiach_user_id: mashgiachUserId,
      }
    )

    if (error) {
      console.error('unlock rpc error:', error)
      return NextResponse.json(
        { error: 'Failed to create unlock' },
        { status: 500 }
      )
    }

    if (!data?.ok) {
      const code = data?.code

      if (code === 'NOT_BUSINESS') {
        return NextResponse.json({ error: data.message }, { status: 403 })
      }

      if (
        code === 'SELF_UNLOCK' ||
        code === 'PROFILE_NOT_FOUND' ||
        code === 'BUSINESS_PROFILE_NOT_FOUND'
      ) {
        return NextResponse.json({ error: data.message }, { status: 400 })
      }

      if (code === 'SUBSCRIPTION_REQUIRED') {
        return NextResponse.json({ error: data.message }, { status: 402 })
      }

      if (code === 'NO_CREDITS_LEFT') {
        return NextResponse.json({ error: data.message }, { status: 409 })
      }

      return NextResponse.json(
        { error: data.message || 'Unlock failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      alreadyUnlocked: data.already_unlocked,
      message: data.message,
      remainingUnlocks: data.remaining_unlocks,
      monthlyUnlockLimit: data.monthly_unlock_limit,
      unlocksUsedThisMonth: data.unlocks_used_this_month,
    })
  } catch (error) {
    console.error('Unlock route error:', error)
    return NextResponse.json(
      { error: 'Unlock failed' },
      { status: 500 }
    )
  }
}