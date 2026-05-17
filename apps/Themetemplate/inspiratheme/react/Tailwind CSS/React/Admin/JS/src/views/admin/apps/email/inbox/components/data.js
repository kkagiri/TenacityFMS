import user1 from '@/assets/images/users/user-1.jpg'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
export const actionData = [
  {
    icon: 'trash',
    label: 'Delete',
  },
  {
    icon: 'mail-opened',
    label: 'Mark as Read',
  },
  {
    icon: 'tag',
    label: 'Tag',
  },
  {
    icon: 'archive',
    label: 'Archive',
  },
  {
    icon: 'folder',
    label: 'Move to Folder',
  },
  {
    icon: 'mail-forward',
    label: 'Forward',
  },
  {
    icon: 'clock-pause',
    label: 'Snooze',
  },
  {
    icon: 'alert-circle',
    label: 'Mark as Important',
  },
]
export const emailData = [
  {
    id: 1,
    isStarred: true,
    user: {
      image: user5,
      name: 'Amanda Reyes',
    },
    subject: 'Design Review & Feedback',
    snippet: 'I’ve reviewed the updated UI mockups. Great work overall—just a few...',
    attachments: 3,
    date: 'Apr 20',
    time: '10:12 AM',
    isRead: false,
  },
  {
    id: 2,
    isStarred: true,
    user: {
      image: user2,
      name: 'George Thomas',
    },
    subject: 'Request for Meeting',
    snippet: 'Are you available for a quick sync-up this week regarding the roadmap?',
    attachments: 1,
    date: 'Apr 19',
    time: '4:45 PM',
    isRead: false,
  },
  {
    id: 3,
    isStarred: false,
    className: 'bg-primary/70',
    user: {
      name: 'Lucas Martin',
    },
    subject: 'Q2 Marketing Strategy',
    snippet: "Here's the proposed outline for our Q2 campaign and goals...",
    attachments: 2,
    date: 'Apr 19',
    time: '11:30 AM',
    isRead: true,
  },
  {
    id: 4,
    isStarred: true,
    user: {
      image: user6,
      name: 'Sophia Lee',
    },
    subject: 'Final Invoice Attached',
    snippet: 'Attached is the invoice for the April sprint deliverables. Let me know...',
    attachments: 1,
    date: 'Apr 18',
    time: '6:05 PM',
    isRead: true,
  },
  {
    id: 5,
    isStarred: false,
    className: 'bg-danger/70',
    user: {
      name: 'Daniel Kim',
    },
    subject: 'Team Offsite Agenda',
    snippet: 'Here’s a rough outline for the team offsite activities next month...',
    attachments: 0,
    date: 'Apr 18',
    time: '1:20 PM',
    isRead: true,
  },
  {
    id: 6,
    isStarred: false,
    className: 'bg-secondary/15 text-secondary',
    user: {
      name: 'Chloe Bennett',
    },
    subject: 'Welcome to the Project!',
    snippet: 'Excited to have you on board. Let’s have a quick intro call tomorrow...',
    attachments: 0,
    date: 'Apr 17',
    time: '9:18 AM',
    isRead: true,
  },
  {
    id: 7,
    isStarred: true,
    user: {
      image: user6,
      name: 'James Carter',
    },
    subject: 'Meeting Follow-up Notes',
    snippet: 'Thanks for the insights today. Please find the summary and action points...',
    attachments: 1,
    date: 'Apr 17',
    time: '2:45 PM',
    isRead: false,
  },
  {
    id: 8,
    isStarred: false,
    user: {
      image: user7,
      name: 'Sophia Allen',
    },
    subject: 'Project Files Delivered',
    snippet: 'The final batch of designs and documentation has been uploaded to the drive...',
    attachments: 2,
    date: 'Apr 16',
    time: '11:05 AM',
    isRead: true,
  },
  {
    id: 9,
    isStarred: false,
    user: {
      image: user8,
      name: 'Michael Chen',
    },
    subject: 'Re: Budget Estimate',
    snippet: 'The budget looks good overall, but we might need to adjust the Q3 allocations...',
    attachments: 1,
    date: 'Apr 15',
    time: '6:28 PM',
    isRead: false,
  },
  {
    id: 10,
    isStarred: false,
    className: 'bg-dark/70',
    user: {
      name: 'Emma Watson',
    },
    subject: 'Collaboration Opportunity',
    snippet: 'I’d love to chat about a possible partnership on our upcoming launch event...',
    attachments: 0,
    date: 'Apr 14',
    time: '3:59 PM',
    isRead: true,
  },
  {
    id: 11,
    isStarred: true,
    user: {
      image: user10,
      name: 'Daniel White',
    },
    subject: 'Reschedule Request',
    snippet: 'Can we move our call to Friday afternoon instead? Something urgent came up...',
    attachments: 0,
    date: 'Apr 13',
    time: '10:20 AM',
    isRead: true,
  },
  {
    id: 12,
    isStarred: true,
    user: {
      image: user3,
      name: 'James Walker',
    },
    subject: 'Monthly Report Submission',
    snippet: 'Please find the attached monthly performance report for your review...',
    attachments: 1,
    date: 'Apr 16',
    time: '11:42 AM',
    isRead: false,
  },
  {
    id: 13,
    isStarred: false,
    className: 'bg-warning/70',
    user: {
      name: 'Emma Johnson',
    },
    subject: 'Design Assets Update',
    snippet: 'I’ve uploaded the latest illustrations and icons to the shared folder...',
    attachments: 0,
    date: 'Apr 16',
    time: '8:09 AM',
    isRead: true,
  },
  {
    id: 14,
    isStarred: true,
    user: {
      image: user9,
      name: 'Noah Patel',
    },
    subject: 'Updated Meeting Schedule',
    snippet: "Please review the adjusted times for next week's client meetings...",
    attachments: 2,
    date: 'Apr 15',
    time: '4:55 PM',
    isRead: true,
  },
  {
    id: 15,
    isStarred: false,
    user: {
      image: user3,
      name: 'Ava Thompson',
    },
    subject: 'Client Feedback Notes',
    snippet: 'Attached is the client feedback from last week’s demo session...',
    attachments: 1,
    date: 'Apr 15',
    time: '9:32 AM',
    isRead: true,
  },
  {
    id: 16,
    isStarred: false,
    user: {
      image: user1,
      name: 'Liam Garcia',
    },
    subject: 'Weekly Sync Meeting',
    snippet: 'Let’s discuss blockers and updates on the current sprints in our sync...',
    attachments: 0,
    date: 'Apr 14',
    time: '3:30 PM',
    isRead: true,
  },
]
