export type PurchasedOrderType = {
  id: string
  supplier: {
    name: string
    email: string
  }
  items: number
  orderDate: string
  orderTime: string
  delivery: {
    date: string
    status: 'expected' | 'delivered'
  }
  amount: string
  paymentStatus: 'paid' | 'pending' | 'unpaid' | 'overdue'
  orderStatus: 'received' | 'in-progress' | 'partially-received' | 'cancelled'
}

export const purchasedOrderData: PurchasedOrderType[] = [
  {
    id: 'PO-2025-0148',
    supplier: {
      name: 'TechVision Supplies',
      email: 'techvision@email.com',
    },
    items: 12,
    orderDate: '05 Oct, 2025',
    orderTime: '09:15 AM',
    delivery: {
      date: '10 Oct, 2025',
      status: 'expected',
    },
    amount: '$3480.0',
    paymentStatus: 'paid',
    orderStatus: 'received',
  },
  {
    id: 'PO-2025-0149',
    supplier: {
      name: 'Global Stationers',
      email: 'orders@globalstationers.com',
    },
    items: 8,
    orderDate: '06 Oct, 2025',
    orderTime: '02:45 PM',
    delivery: {
      date: '12 Oct, 2025',
      status: 'expected',
    },
    amount: '$1260.0',
    paymentStatus: 'pending',
    orderStatus: 'in-progress',
  },
  {
    id: 'PO-2025-0150',
    supplier: {
      name: 'NextGen Components',
      email: 'support@nextgen.com',
    },
    items: 25,
    orderDate: '02 Oct, 2025',
    orderTime: '11:05 AM',
    delivery: {
      date: '09 Oct, 2025',
      status: 'expected',
    },
    amount: '$7920.0',
    paymentStatus: 'paid',
    orderStatus: 'partially-received',
  },
  {
    id: 'PO-2025-0151',
    supplier: {
      name: 'EcoHome Essentials',
      email: 'contact@ecohome.com',
    },
    items: 5,
    orderDate: '04 Oct, 2025',
    orderTime: '03:30 PM',
    delivery: {
      date: '09 Oct, 2025',
      status: 'delivered',
    },
    amount: '$980.0',
    paymentStatus: 'unpaid',
    orderStatus: 'received',
  },
  {
    id: 'PO-2025-0152',
    supplier: {
      name: 'BrightLine Textiles',
      email: 'info@brightline.com',
    },
    items: 16,
    orderDate: '07 Oct, 2025',
    orderTime: '08:20 AM',
    delivery: {
      date: '14 Oct, 2025',
      status: 'expected',
    },
    amount: '$4250.0',
    paymentStatus: 'paid',
    orderStatus: 'in-progress',
  },
  {
    id: 'PO-2025-0153',
    supplier: {
      name: 'Urban Office Supplies',
      email: 'sales@urbanoffice.com',
    },
    items: 9,
    orderDate: '03 Oct, 2025',
    orderTime: '01:10 PM',
    delivery: {
      date: '07 Oct, 2025',
      status: 'delivered',
    },
    amount: '$2340.0',
    paymentStatus: 'overdue',
    orderStatus: 'cancelled',
  },
  {
    id: 'PO-2025-0154',
    supplier: {
      name: 'Northway Electronics',
      email: 'contact@northway.com',
    },
    items: 14,
    orderDate: '08 Oct, 2025',
    orderTime: '10:00 AM',
    delivery: {
      date: '15 Oct, 2025',
      status: 'expected',
    },
    amount: '$5610.0',
    paymentStatus: 'pending',
    orderStatus: 'in-progress',
  },
  {
    id: 'PO-2025-0155',
    supplier: {
      name: 'Apex Industrial Tools',
      email: 'sales@apextools.com',
    },
    items: 20,
    orderDate: '01 Oct, 2025',
    orderTime: '04:30 PM',
    delivery: {
      date: '06 Oct, 2025',
      status: 'delivered',
    },
    amount: '$9875.0',
    paymentStatus: 'paid',
    orderStatus: 'received',
  },
  {
    id: 'PO-2025-0156',
    supplier: {
      name: 'GreenLeaf Packaging',
      email: 'hello@greenleafpack.com',
    },
    items: 7,
    orderDate: '09 Oct, 2025',
    orderTime: '11:50 AM',
    delivery: {
      date: '15 Oct, 2025',
      status: 'expected',
    },
    amount: '$2120.0',
    paymentStatus: 'pending',
    orderStatus: 'cancelled',
  },
  {
    id: 'PO-2025-0157',
    supplier: {
      name: 'BlueSky Furnishings',
      email: 'orders@bluesky.com',
    },
    items: 10,
    orderDate: '06 Oct, 2025',
    orderTime: '09:40 AM',
    delivery: {
      date: '11 Oct, 2025',
      status: 'expected',
    },
    amount: '$3950.0',
    paymentStatus: 'paid',
    orderStatus: 'in-progress',
  },
  {
    id: 'PO-2025-0158',
    supplier: {
      name: 'PrimeTech Hardware',
      email: 'info@primetech.com',
    },
    items: 18,
    orderDate: '05 Oct, 2025',
    orderTime: '05:25 PM',
    delivery: {
      date: '13 Oct, 2025',
      status: 'expected',
    },
    amount: '$6730.0',
    paymentStatus: 'overdue',
    orderStatus: 'cancelled',
  },
]
