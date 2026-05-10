import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn } from '@/utils/helpers'
import { DateInput, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { DateClickArg, Draggable, type DropArg } from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useEffect, useRef, useState } from 'react'
import { useWindowSize } from 'usehooks-ts'
import AddEditModal from './AddEditModal'
import { defaultEventData, externalEventData, type SubmitEventType } from './data'

const CalendarPage = () => {
  const { height } = useWindowSize()

  const externalEventsEle = useRef<HTMLDivElement | null>(null)

  const draggableInstance = useRef<Draggable | null>(null)

  const [isEditable, setIsEditable] = useState<boolean>(false)
  const [events, setEvents] = useState<EventInput[]>([...defaultEventData])
  const [eventData, setEventData] = useState<EventInput>()
  const [dateInfo, setDateInfo] = useState<DateClickArg>()

  const onCloseModal = () => {
    setEventData(undefined)
    setDateInfo(undefined)
    window.HSOverlay?.close('#event-modal')
  }

  const onDateClick = (arg: DateClickArg) => {
    setDateInfo(arg)
    window.HSOverlay?.open('#event-modal')
    setIsEditable(false)
  }

  const onEventClick = (arg: EventClickArg) => {
    const classNames = arg.event.classNames
    const event = {
      id: arg.event.id,
      title: arg.event.title,
      className: Array.isArray(classNames) ? classNames.join(' ') : classNames || '',
    }
    setEventData(event)
    setIsEditable(true)
    window.HSOverlay?.open('#event-modal')
  }

  const onDrop = (arg: DropArg) => {
    const dropEventData = arg
    const title = dropEventData.draggedEl.title
    if (title) {
      const newEvent = {
        id: String(events.length + 1),
        title,
        start: dropEventData ? dropEventData.dateStr : new Date(),
        className: dropEventData.draggedEl.dataset.class,
      }
      const modifiedEvents = [...events]
      modifiedEvents.push(newEvent)

      setEvents(modifiedEvents)
    }
  }

  const onAddEvent = (data: SubmitEventType) => {
    const modifiedEvents = [...events]
    const event = {
      id: String(modifiedEvents.length + 1),
      title: data.title,
      start: Object.keys(dateInfo ?? {}).length !== 0 ? dateInfo?.date : new Date(),
      className: data.category,
    }
    modifiedEvents.push(event)
    setEvents(modifiedEvents)
    onCloseModal()
  }

  const onUpdateEvent = (data: SubmitEventType) => {
    setEvents(
      events.map((e) => {
        if (e.id === eventData?.id) {
          return {
            ...e,
            title: data.title,
            className: data.category,
          }
        } else {
          return e
        }
      })
    )
    onCloseModal()
    setIsEditable(false)
  }

  const onRemoveEvent = () => {
    const modifiedEvents = [...events]
    const idx = modifiedEvents.findIndex((e) => e.id === eventData?.id)
    modifiedEvents.splice(idx, 1)
    setEvents(modifiedEvents)
    onCloseModal()
  }

  const onEventDrop = (arg: EventDropArg) => {
    const modifiedEvents = [...events]
    const idx = modifiedEvents.findIndex((e: EventInput) => e.id === arg.event.id)
    modifiedEvents[idx].title = arg.event.title
    modifiedEvents[idx].className = arg.event.classNames
    modifiedEvents[idx].start = arg.event.start as DateInput
    modifiedEvents[idx].end = arg.event.end as DateInput
    setEvents(modifiedEvents)
    setIsEditable(false)
  }

  const createNewEvent = () => {
    setIsEditable(false)
    setEventData(undefined)
    setDateInfo(undefined)
    window.HSOverlay?.open('#event-modal')
  }

  useEffect(() => {
    if (externalEventsEle.current) {
      draggableInstance.current = new Draggable(externalEventsEle.current, {
        itemSelector: '.external-event',
        eventData: function (eventEl) {
          return {
            title: eventEl.innerText,
            classNames: eventEl.getAttribute('data-class'),
          }
        },
      })
    }

    return () => {
      if (draggableInstance.current) {
        draggableInstance.current.destroy()
      }
    }
  }, [])

  return (
    <>
      <div className="flex lg:h-[calc(100vh-192px)]">
        <div className="card hidden lg:flex h-full">
          <div className="card-body">
            <button onClick={createNewEvent} className="btn bg-primary w-full text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="event-modal">
              <Icon icon="plus" className="me-1 align-middle"></Icon>
              Create New Event
            </button>

            <div id="external-events" ref={externalEventsEle}>
              <p className="text-default-400 mt-2.5 mb-5 text-xs italic">Drag and drop your event or click in the calendar</p>

              {externalEventData.map((event, idx) => (
                <div className={cn('external-event fc-event bg-primary/10 my-1.5 rounded px-4 py-2 font-semibold', event.className)} key={idx} title={event.title} data-class={event.className}>
                  <Icon icon="circle-filled" className="me-2" />
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card flex-1 h-full">
          <div className="card-header inline-flex lg:hidden">
            <button className="btn bg-primary w-full text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="event-modal" data-hs-overlay="#event-modal">
              <Icon icon="plus" className="me-2 align-middle"></Icon>
              Create New Event
            </button>
          </div>

          <div className="card-body">
            <SimpleBar id="calendar">
              <FullCalendar
                initialView="dayGridMonth"
                plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin]}
                bootstrapFontAwesome={false}
                handleWindowResize={true}
                slotDuration="00:30:00"
                slotMinTime="07:00:00"
                slotMaxTime="19:00:00"
                buttonText={{
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                  list: 'List',
                }}
                headerToolbar={{
                  left: 'prev,next,today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
                }}
                height={height - 240}
                editable={true}
                selectable={true}
                droppable={true}
                events={events}
                dateClick={onDateClick}
                eventClick={onEventClick}
                drop={onDrop}
                eventDrop={onEventDrop}
              />
            </SimpleBar>
          </div>
        </div>
      </div>

      <AddEditModal eventData={eventData} isEditable={isEditable} onAddEvent={onAddEvent} onRemoveEvent={onRemoveEvent} onUpdateEvent={onUpdateEvent} />
    </>
  )
}

export default CalendarPage
