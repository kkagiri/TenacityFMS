export type TimelineEventType = {
  time?: string
  title: string
  description: string
  trackingNo: string
  trackingBy: string
}

export const shippingTimelineData: TimelineEventType[] = [
  {
    title: 'Pending Delivery',
    description: 'The package is out for delivery and will reach you shortly.',
    trackingNo: 'TRK123456789',
    trackingBy: 'Delivery Agent',
  },
  {
    time: 'Today, 9:00 AM',
    title: 'Out for Delivery',
    description: 'Courier picked up the package for final delivery.',
    trackingNo: 'TRK123456789',
    trackingBy: 'Local Courier',
  },
  {
    time: 'Yesterday, 3:15 PM',
    title: 'Arrived at Local Hub',
    description: 'Shipment arrived at the nearest delivery center.',
    trackingNo: 'TRK123456789',
    trackingBy: 'Sorting Facility',
  },
  {
    time: 'Monday, 6:00 PM',
    title: 'Departed Transit Facility',
    description: 'Package left the main transit facility and is en route to the local hub.',
    trackingNo: 'TRK123456789',
    trackingBy: 'Central Logistics',
  },
  {
    time: 'Monday, 8:00 AM',
    title: 'Arrived at Transit Facility',
    description: 'Package arrived at the central distribution hub for processing.',
    trackingNo: 'TRK123456789',
    trackingBy: 'Transit Center',
  },
  {
    time: 'Last Saturday, 2:00 PM',
    title: 'Dispatched from Warehouse',
    description: 'Package was picked up and dispatched by carrier from warehouse.',
    trackingNo: 'TRK123456789',
    trackingBy: 'Fulfillment Center',
  },
  {
    time: 'Last Friday, 5:00 PM',
    title: 'Order Confirmed',
    description: 'The order was successfully placed and is now being processed.',
    trackingNo: 'TRK123456789',
    trackingBy: 'Order System',
  },
]
