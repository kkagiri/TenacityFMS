import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import { useWindowSize } from 'usehooks-ts'
import AddEditModal from './AddEditModal'
import { defaultEventData, externalEventData } from './data'
const CalendarPage = () => {
  const { height } = useWindowSize()
  const externalEventsEle = useRef(null)
  const draggableInstance = useRef(null)
  const [show, setShow] = useState(false)
  const onOpenModal = () => setShow(true)
  const [isEditable, setIsEditable] = useState(false)
  const [events, setEvents] = useState([...defaultEventData])
  const [eventData, setEventData] = useState()
  const [dateInfo, setDateInfo] = useState()
  const onCloseModal = () => {
    setEventData(undefined)
    setDateInfo(undefined)
    setShow(false)
  }
  const onDateClick = (arg) => {
    setDateInfo(arg)
    onOpenModal()
    setIsEditable(false)
  }
  const onEventClick = (arg) => {
    const classNames = arg.event.classNames
    const event = {
      id: arg.event.id,
      title: arg.event.title,
      className: Array.isArray(classNames) ? classNames.join(' ') : classNames || '',
    }
    setEventData(event)
    setIsEditable(true)
    onOpenModal()
  }
  const onDrop = (arg) => {
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
  const onAddEvent = (data) => {
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
  const onUpdateEvent = (data) => {
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
  const onEventDrop = (arg) => {
    const modifiedEvents = [...events]
    const idx = modifiedEvents.findIndex((e) => e.id === arg.event.id)
    modifiedEvents[idx].title = arg.event.title
    modifiedEvents[idx].className = arg.event.classNames
    modifiedEvents[idx].start = arg.event.start
    modifiedEvents[idx].end = arg.event.end
    setEvents(modifiedEvents)
    setIsEditable(false)
  }
  const createNewEvent = () => {
    setIsEditable(false)
    onOpenModal()
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
      <div className="outlook-box">
        <Card className="h-100 mb-0 d-none d-lg-flex rounded-end-0">
          <CardBody>
            <Button variant="primary" className="w-100 btn-new-event" onClick={createNewEvent}>
              <Icon icon="plus" className="me-2 align-middle" />
              Create New Event
            </Button>

            <div id="external-events" ref={externalEventsEle}>
              <p className="text-muted mt-2 fst-italic fs-xs mb-3">Drag and drop your event or click in the calendar</p>
              {externalEventData.map((event, idx) => (
                <div key={idx} className={clsx('external-event fc-event fw-semibold border-start border-3', event.className)} title={event.title} data-class={event.className}>
                  <Icon icon="circle-filled" className="me-2" />
                  {event.title}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="h-100 mb-0 rounded-start-0 flex-grow-1 border-start-0">
          <div className="d-lg-none d-inline-flex card-header">
            <Button variant="primary" className="btn-new-event" onClick={createNewEvent}>
              <Icon icon="plus" className="me-2 align-middle" />
              Create New Event
            </Button>
          </div>

          <SimpleBar
            className="card-body"
            style={{
              height: 'calc(100% - 350px)',
            }}
          >
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
                prev: 'Prev',
                next: 'Next',
              }}
              headerToolbar={{
                left: 'prev,next today',
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
        </Card>
      </div>

      <AddEditModal eventData={eventData} isEditable={isEditable} onAddEvent={onAddEvent} onRemoveEvent={onRemoveEvent} onUpdateEvent={onUpdateEvent} open={show} toggle={onCloseModal} />
    </>
  )
}
export default CalendarPage
