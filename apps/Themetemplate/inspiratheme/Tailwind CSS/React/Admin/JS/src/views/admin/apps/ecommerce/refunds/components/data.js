import amex from '@/assets/images/cards/american-express.svg'
import mastercard from '@/assets/images/cards/mastercard.svg'
import paypal from '@/assets/images/cards/paypal.svg'
import visa from '@/assets/images/cards/visa.svg'
import product1 from '@/assets/images/products/1.png'
import product10 from '@/assets/images/products/10.png'
import product2 from '@/assets/images/products/2.png'
import product3 from '@/assets/images/products/3.png'
import product4 from '@/assets/images/products/4.png'
import product5 from '@/assets/images/products/5.png'
import product6 from '@/assets/images/products/6.png'
import product7 from '@/assets/images/products/7.png'
import product8 from '@/assets/images/products/8.png'
import product9 from '@/assets/images/products/9.png'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
export const refundStatData = [
  {
    icon: 'credit-card-refund',
    title: 'Total Refund Requests',
    value: 2310,
    change: 5.42,
    iconClassName: 'bg-primary',
    badgeClassName: 'bg-primary/15 text-primary',
  },
  {
    icon: 'check',
    title: 'Approved Refunds',
    value: 1560,
    change: 3.18,
    iconClassName: 'bg-success',
    badgeClassName: 'bg-success/15 text-success',
  },
  {
    icon: 'alarm-snooze',
    title: 'Pending Refunds',
    value: 430,
    change: -1.09,
    iconClassName: 'bg-warning',
    badgeClassName: 'bg-warning/15 text-warning',
  },
  {
    icon: 'x',
    title: 'Rejected Refunds',
    value: 210,
    change: -0.62,
    iconClassName: 'bg-danger',
    badgeClassName: 'bg-danger/15 text-danger',
  },
  {
    icon: 'bolt',
    title: 'Fully Refunded',
    value: 110,
    change: 2.41,
    iconClassName: 'bg-info',
    badgeClassName: 'bg-info/15 text-info',
  },
]
export const refundData = [
  {
    orderId: '#INV-10423',
    product: {
      name: 'NoiseCancel Headphones',
      sku: 'NC-900',
      image: product1,
    },
    customer: {
      name: 'Mason Carter',
      email: 'mason.carter@shopmail.com',
      image: user2,
    },
    reason: 'Damaged on arrival',
    payment: {
      image: visa,
      type: 'card',
      number: 'xxxx 7832',
    },
    amount: '$129.45',
    status: 'pending',
    requestedDate: '08 Oct 2025',
  },
  {
    orderId: '#INV-10407',
    product: {
      name: 'Smartwatch Pro',
      sku: 'SW-PRO',
      image: product2,
    },
    customer: {
      name: 'Sofia Williams',
      email: 'sofia.williams@shopmail.com',
      image: user5,
    },
    reason: 'Wrong size received',
    payment: {
      image: mastercard,
      type: 'card',
      number: 'xxxx 2294',
    },
    amount: '$79.99',
    status: 'approved',
    requestedDate: '05 Oct 2025',
    processedDate: '06 Oct 2025',
  },
  {
    orderId: '#INV-10388',
    product: {
      name: '4K Action Camera',
      sku: 'AC-4K',
      image: product3,
    },
    customer: {
      name: 'Liam Brown',
      email: 'liam.brown@shopmail.com',
      image: user3,
    },
    reason: 'No longer needed',
    payment: {
      image: amex,
      type: 'card',
      number: 'xxxx 1145',
    },
    amount: '$249.0',
    status: 'refunded',
    requestedDate: '30 Sep 2025',
    processedDate: '01 Oct 2025',
  },
  {
    orderId: '#INV-10352',
    product: {
      name: 'Bluetooth Speaker Mini',
      sku: 'BS-MINI',
      image: product4,
    },
    customer: {
      name: 'Emma Johnson',
      email: 'emma.johnson@shopmail.com',
      image: user7,
    },
    reason: 'Product not as described',
    payment: {
      image: paypal,
      type: 'other',
      name: 'PayPal',
    },
    amount: '$59.99',
    status: 'rejected',
    requestedDate: '25 Sep 2025',
  },
  {
    orderId: '#INV-10341',
    product: {
      name: 'Wireless Mouse',
      sku: 'WM-450',
      image: product5,
    },
    customer: {
      name: 'Oliver Garcia',
      email: 'oliver.garcia@shopmail.com',
      image: user8,
    },
    reason: 'Did not work as expected',
    payment: {
      image: visa,
      type: 'card',
      number: 'xxxx 9821',
    },
    amount: '$39.0',
    status: 'pending',
    requestedDate: '22 Sep 2025',
  },
  {
    orderId: '#INV-10322',
    product: {
      name: 'Ergonomic Office Chair',
      sku: 'CHR-550',
      image: product6,
    },
    customer: {
      name: 'Lucas Turner',
      email: 'lucas.turner@shopmail.com',
      image: user4,
    },
    reason: 'Incorrect color delivered',
    payment: {
      image: amex,
      type: 'card',
      number: 'xxxx 6730',
    },
    amount: '$199.0',
    status: 'approved',
    requestedDate: '20 Sep 2025',
    processedDate: '21 Sep 2025',
  },
  {
    orderId: '#INV-10305',
    product: {
      name: 'Portable Vacuum Cleaner',
      sku: 'VC-201',
      image: product7,
    },
    customer: {
      name: 'Charlotte Davis',
      email: 'charlotte.d@shopmail.com',
      image: user9,
    },
    reason: 'Missing accessories',
    payment: {
      image: mastercard,
      type: 'card',
      number: 'xxxx 8142',
    },
    amount: '$89.5',
    status: 'refunded',
    requestedDate: '16 Sep 2025',
    processedDate: '18 Sep 2025',
  },
  {
    orderId: '#INV-10293',
    product: {
      name: 'Gaming Keyboard RGB',
      sku: 'GK-88',
      image: product8,
    },
    customer: {
      name: 'Henry Martin',
      email: 'henry.martin@shopmail.com',
      image: user10,
    },
    reason: 'Keys not functioning',
    payment: {
      image: paypal,
      type: 'other',
      name: 'PayPal',
    },
    amount: '$119.0',
    status: 'rejected',
    requestedDate: '12 Sep 2025',
  },
  {
    orderId: '#INV-10275',
    product: {
      name: 'Fitness Tracker Band',
      sku: 'FT-900',
      image: product9,
    },
    customer: {
      name: 'Ella Rodriguez',
      email: 'ella.rodriguez@shopmail.com',
      image: user3,
    },
    reason: 'Did not sync with app',
    payment: {
      image: visa,
      type: 'card',
      number: 'xxxx 9082',
    },
    amount: '$49.99',
    status: 'pending',
    requestedDate: '08 Sep 2025',
  },
  {
    orderId: '#INV-10261',
    product: {
      name: 'Laptop Stand Adjustable',
      sku: 'LS-101',
      image: product10,
    },
    customer: {
      name: 'James Anderson',
      email: 'james.anderson@shopmail.com',
      image: user2,
    },
    reason: 'Package arrived late',
    payment: {
      image: mastercard,
      type: 'card',
      number: 'xxxx 3210',
    },
    amount: '$64.99',
    status: 'approved',
    requestedDate: '05 Sep 2025',
    processedDate: '06 Sep 2025',
  },
]
