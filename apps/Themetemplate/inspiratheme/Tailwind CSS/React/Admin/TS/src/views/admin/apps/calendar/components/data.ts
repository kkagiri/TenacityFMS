import { EventInput, type EventClickArg, type EventDropArg } from '@fullcalendar/core'
import { DateClickArg, DropArg } from '@fullcalendar/interaction'

export type CalendarFormType = {
  isEditable: boolean
  eventData?: EventInput
  onUpdateEvent: (data: any) => void
  onRemoveEvent: () => void
  onAddEvent: (data: any) => void
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
    className: 'bg-primary/15 !text-primary border-s! !border-[3px] border-primary',
  },
  {
    id: '2',
    title: 'Design Sprint Planning',
    start: new Date(Date.now() + 16000000),
    end: new Date(Date.now() + 20000000),
    className: 'bg-info/15 !text-info border-s! !border-[3px] border-info',
  },
  {
    id: '3',
    title: 'Project Kick-off Meeting',
    start: new Date(Date.now() + 40000000),
    end: new Date(Date.now() + 80000000),
    className: 'bg-secondary/15 !text-secondary border-s! !border-[3px] border-secondary',
  },
  {
    id: '4',
    title: 'UI/UX Design Review',
    start: new Date(Date.now() + 120000000),
    end: new Date(Date.now() + 180000000),
    className: 'bg-warning/15 !text-warning border-s! !border-[3px] border-warning',
  },
  {
    id: '5',
    title: 'Code Review - Frontend',
    start: new Date(Date.now() + 200000000),
    end: new Date(Date.now() + 220000000),
    className: 'bg-success/15 !text-success border-s! !border-[3px] border-success',
  },
  {
    id: '6',
    title: 'Team Stand-up Meeting',
    start: new Date(Date.now() + 340000000),
    end: new Date(Date.now() + 345000000),
    className: 'bg-secondary/15 !text-secondary border-s! !border-[3px] border-secondary',
  },
  {
    id: '7',
    title: 'Client Presentation Prep',
    start: new Date(Date.now() + 1200000000),
    end: new Date(Date.now() + 1300000000),
    className: 'bg-danger/15 !text-danger border-s! !border-[3px] border-danger',
  },
  {
    id: '8',
    title: 'Backend API Integration',
    start: new Date(Date.now() + 2500000000),
    end: new Date(Date.now() + 2600000000),
    className: 'bg-dark/15 !text-dark border-s! !border-[3px] border-dark',
  },
]

export type ExternalEventType = {
  title: string
  className: string
}

export const externalEventData: ExternalEventType[] = [
  { title: 'Design Review', className: 'bg-primary/10 text-primary!' },
  { title: 'Marketing Strategy', className: 'bg-secondary/10 text-secondary!' },
  { title: 'Sales Demo', className: 'bg-success/10 text-success!' },
  { title: 'Deadline Submission', className: 'bg-danger/10 text-danger!' },
  { title: 'Training Session', className: 'bg-info/10 text-info!' },
  { title: 'Budget Review', className: 'bg-warning/10 text-warning!' },
  { title: 'Board Meeting', className: 'bg-dark/10 text-dark!' },
]
