export const pricingPlanData = [
  {
    name: 'Free Plan',
    subtitle: 'Great for solo developers trying things out',
    price: '$0',
    duration: 'monthly',
    planInfo: 'No credit card required',
    planInfo2: 'Free forever',
    buttonText: 'Start Free',
    href: '#!',
    buttonClassName: 'btn-dark',
    features: [
      {
        title: '1 user license',
        included: true,
      },
      {
        title: 'Access to basic components',
        included: true,
      },
      {
        title: 'Community support only',
        included: true,
      },
      {
        title: 'Limited documentation',
        included: true,
      },
      {
        title: 'No commercial use',
        included: false,
      },
      {
        title: 'No Figma/design files',
        included: false,
      },
    ],
  },
  {
    name: 'Pro Plan',
    subtitle: 'Ideal for freelancers and small teams with commercial needs',
    price: '$129',
    duration: 'yearly',
    planInfo: 'One-time payment',
    planInfo2: 'Plus applicable taxes',
    buttonText: 'Upgrade Now',
    href: '#!',
    buttonClassName: 'btn-primary',
    features: [
      {
        title: '3 user licenses',
        included: true,
      },
      {
        title: 'Full component access',
        included: true,
      },
      {
        title: 'Commercial project rights',
        included: true,
      },
      {
        title: 'Email support',
        included: true,
      },
      {
        title: 'Lifetime updates',
        included: true,
      },
      {
        title: 'Figma design files',
        included: true,
      },
    ],
    isPopular: true,
  },
  {
    name: 'Enterprise Plan',
    subtitle: 'Best for companies with scaling teams and critical projects',
    price: '$499',
    duration: 'yearly',
    planInfo: 'One-time payment',
    planInfo2: 'Includes extended support',
    buttonText: 'Contact Sales',
    href: '#!',
    buttonClassName: 'btn-dark',
    features: [
      {
        title: 'Unlimited users',
        included: true,
      },
      {
        title: 'All premium components & layouts',
        included: true,
      },
      {
        title: 'Commercial & SaaS usage rights',
        included: true,
      },
      {
        title: 'Dedicated support & onboarding',
        included: true,
      },
      {
        title: 'Custom Figma UI kits',
        included: true,
      },
      {
        title: 'Priority feature requests',
        included: true,
      },
    ],
  },
]
