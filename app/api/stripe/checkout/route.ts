import { NextResponse } from 'next/server'
import { stripe } from '@/app/lib/stripe'
import { supabase } from '@/app/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body?.userId as string | undefined

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: businessProfile, error: businessError } = await supabase
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

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userRecord.role !== 'business') {
      return NextResponse.json(
        { error: 'Only business users can subscribe' },
        { status: 403 }
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

      const { error: updateCustomerError } = await supabase
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