import { EventInput, type EventClickArg, type EventDropArg } from '@fullcalendar/core'
import { DateClickArg, DropArg } from '@fullcalendar/interaction'
export type CalendarFormType = {
  isEditable: boolean
  eventData?: EventInput
  onUpdateEvent: (data: any) => void
  onRemoveEvent: () => void
  onAddEvent: (data: any) => void
  open: boolean
  toggle: () => void
}

export type CalendarProps = {
  onDateClick: (arg: DateClickArg) => void
  onEventClick: (arg: EventClickArg) => void
  onDrop: (arg: DropArg) => void
  onEventDrop: (arg: EventDropArg) => void
  events: EventInput[]
}

export type SubmitEventType = {
  title: string
  category: string
}

export const defaultEventData: EventInput[] = [
  {
    id: '1',
    title: 'Interview - Backend Engineer',
    start: new Date(),
    end: new Date(),
    className: 'bg-primary-subtle text-primary border-start border-3 border-primary',
  },
  {
    id: '2',
    title: 'Design Sprint Planning',
    start: new Date(Date.now() + 16000000),
    end: new Date(Date.now() + 20000000),
    className: 'bg-info-subtle text-info border-start border-3 border-info',
  },
  {
    id: '3',
    title: 'Project Kick-off Meeting',
    start: new Date(Date.now() + 400000000),
    end: new Date(Date.now() + 440000000),
    className: 'bg-secondary-subtle text-secondary border-start border-3 border-secondary',
  },
  {
    id: '4',
    title: 'UI/UX Design Review',
    start: new Date(Date.now() + 80000000),
    end: new Date(Date.now() + 180000000),
    className: 'bg-warning-subtle text-warning border-start border-3 border-warning',
  },
  {
    id: '5',
    title: 'Code Review - Frontend',
    start: new Date(Date.now() + 200000000),
    end: new Date(Date.now() + 220000000),
    className: 'bg-success-subtle text-success border-start border-3 border-success',
  },
  {
    id: '6',
    title: 'Team Stand-up Meeting',
    start: new Date(Date.now() + 340000000),
    end: new Date(Date.now() + 345000000),
    className: 'bg-secondary-subtle text-secondary border-start border-3 border-secondary',
  },
  {
    id: '7',
    title: 'Client Presentation Prep',
    start: new Date(Date.now() + 1200000000),
    end: new Date(Date.now() + 1300000000),
    className: 'bg-danger-subtle text-danger border-start border-3 border-danger',
  },
  {
    id: '8',
    title: 'Backend API Integration',
    start: new Date(Date.now() + 2500000000),
    end: new Date(Date.now() + 2600000000),
    className: 'bg-dark-subtle text-dark border-start border-3 border-dark',
  },
]

export type ExternalEventType = {
  title: string
  className: string
}

export const externalEventData: ExternalEventType[] = [
  { title: 'Project Kickoff', className: 'bg-primary-subtle text-primary border-primary ' },
  { title: 'Team Sync-up', className: 'bg-secondary-subtle text-secondary border-secondary' },
  { title: 'Client Meeting', className: 'bg-success-subtle text-success border-success' },
  { title: 'Product Launch', className: 'bg-danger-subtle text-danger border-danger' },
  { title: 'Internal Review', className: 'bg-info-subtle text-info border-info' },
  { title: 'Quarterly Planning', className: 'bg-warning-subtle text-warning border-warning' },
  { title: 'Year-End Celebration', className: 'bg-dark-subtle text-dark border-dark' },
]
