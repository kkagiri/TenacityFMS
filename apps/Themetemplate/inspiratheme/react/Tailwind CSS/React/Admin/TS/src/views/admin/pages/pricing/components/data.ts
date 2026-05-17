export type PricingPlan = {
  title: string
  description: string
  price: string
  notes: string[]
  features: {
    label: string
    included: boolean
  }[]
  buttonText: string
  highlighted?: boolean
}

export const pricingPlans: PricingPlan[] = [
  {
    title: 'Free Plan',
    description: 'Great for solo developers trying things out',
    price: '$0',
    notes: ['No credit card required', 'Free forever'],
    buttonText: 'Start Free',
    features: [
      { label: '1 user license', included: true },
      { label: 'Access to basic components', included: true },
      { label: 'Community support only', included: true },
      { label: 'Limited documentation', included: true },
      { label: 'No commercial use', included: false },
      { label: 'No Figma/design files', included: false },
    ],
  },
  {
    title: 'Pro Plan',
    description: 'Ideal for freelancers and small teams with commercial needs',
    price: '$129',
    notes: ['One-time payment', 'Plus applicable taxes'],
    buttonText: 'Upgrade Now',
    highlighted: true,
    features: [
      { label: '3 user licenses', included: true },
      { label: 'Full component access', included: true },
      { label: 'Commercial project rights', included: true },
      { label: 'Email support', included: true },
      { label: 'Lifetime updates', included: true },
      { label: 'Figma design files', included: true },
    ],
  },
  {
    title: 'Enterprise Plan',
    description: 'Best for companies with scaling teams and critical projects',
    price: '$499',
    notes: ['One-time payment', 'Includes extended support'],
    buttonText: 'Contact Sales',
    features: [
      { label: 'Unlimited users', included: true },
      { label: 'All premium components & layouts', included: true },
      { label: 'Commercial & SaaS usage rights', included: true },
      { label: 'Dedicated support & onboarding', included: true },
      { label: 'Custom Figma UI kits', included: true },
      { label: 'Priority feature requests', included: true },
    ],
  },
]
