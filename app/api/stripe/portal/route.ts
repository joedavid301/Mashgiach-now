import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/app/lib/stripe'
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
      return NextResponse.json({ error: 'Unauthorized: no token' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userRecord.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized user mismatch' }, { status: 403 })
    }

    if (userRecord.role !== 'business') {
      return NextResponse.json(
        { error: 'Only business users can manage subscriptions' },
        { status: 403 }
      )
    }

    const { data: businessProfile, error } = await supabaseAdmin
      .from('business_profiles')
      .select('user_id, stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Portal business profile lookup error:', error)
      return NextResponse.json(
        { error: 'Failed to load business profile' },
        { status: 500 }
      )
    }

    if (!businessProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe customer not found' },
        { status: 404 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: businessProfile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
