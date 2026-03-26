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
      .select('id, email, role')
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
        { error: 'Only business users can subscribe' },
        { status: 403 }
      )
    }

    const { data: businessProfile, error: businessError } = await supabaseAdmin
      .from('business_profiles')
      .select('user_id, contact_name, stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      )
    }

    let stripeCustomerId = businessProfile.stripe_customer_id as string | null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userRecord.email ?? undefined,
        name: businessProfile.contact_name ?? undefined,
        metadata: {
          userId,
        },
      })

      stripeCustomerId = customer.id

      const { error: updateCustomerError } = await supabaseAdmin
        .from('business_profiles')
        .update({
          stripe_customer_id: stripeCustomerId,
        })
        .eq('user_id', userId)

      if (updateCustomerError) {
        console.error('Failed to save Stripe customer ID:', updateCustomerError)
        return NextResponse.json(
          { error: 'Failed to save customer' },
          { status: 500 }
        )
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID as string,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/billing?stripe=cancelled`,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
