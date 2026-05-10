/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Apps Calendar
 */

import { Calendar } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin, { Draggable } from "@fullcalendar/interaction"

class CalendarApp {
    constructor() {
        // Instance variables
        this.selectedEvent = null
        this.newEventData = null
    }

    init() {
        const getElement = (id) => document.getElementById(id)

        // Elements
        const calendarEl = getElement("calendar")
        const checkbox = getElement("drop-remove")
        const businessHoursCheckbox = getElement("businessCalendar")
        const weekNumberCalendar = getElement("weekNumberCalendar")
        const modalTitle = getElement("modal-title")
        const formEvent = getElement("form-event")
        const eventTitleInput = getElement("event-title")
        const externalEventContainerEl = getElement("external-events")
        const eventCategoryInput = getElement("event-category")
        const deleteEventBtn = getElement("btn-delete-event")
        const saveEventBtn = getElement("btn-save-event")

        const today = new Date()

        // Helpers
        const initializeDraggable = () => {
            new Draggable(externalEventContainerEl, {
                itemSelector: ".external-event",
                eventData: (eventEl) => ({
                    title: eventEl.innerText,
                    classNames: eventEl.getAttribute("data-class"),
                }),
            })
        }

        const getDefaultEvents = () => {
            return [
                {
                    title: "Interview - Backend Engineer",
                    start: today,
                    end: today,
                    className: "bg-primary/15 !text-primary border-s! !border-[3px] border-primary",
                },
                {
                    title: "Design Sprint Planning",
                    start: new Date(Date.now() + 16000000),
                    end: new Date(Date.now() + 20000000),
                    className: "bg-info/15 !text-info border-s! !border-[3px] border-info",
                },
                {
                    title: "Project Kick-off Meeting",
                    start: new Date(Date.now() + 400000000),
                    end: new Date(Date.now() + 440000000),
                    className: "bg-secondary/15 !text-secondary border-s! !border-[3px] border-secondary",
                },
                {
                    title: "UI/UX Design Review",
                    start: new Date(Date.now() + 80000000),
                    end: new Date(Date.now() + 180000000),
                    className: "bg-warning/15 !text-warning border-s! !border-[3px] border-warning",
                },
                {
                    title: "Code Review - Frontend",
                    start: new Date(Date.now() + 200000000),
                    end: new Date(Date.now() + 220000000),
                    className: "bg-success/15 !text-success border-s! !border-[3px] border-success",
                },
                {
                    title: "Team Stand-up Meeting",
                    start: new Date(Date.now() + 340000000),
                    end: new Date(Date.now() + 345000000),
                    className: "bg-secondary/15 !text-secondary border-s! !border-[3px] border-secondary",
                },
                {
                    title: "Client Presentation Prep",
                    start: new Date(Date.now() + 1200000000),
                    end: new Date(Date.now() + 1300000000),
                    className: "bg-danger/15 !text-danger border-s! !border-[3px] border-danger",
                },
                {
                    title: "Backend API Integration",
                    start: new Date(Date.now() + 2500000000),
                    end: new Date(Date.now() + 2600000000),
                    className: "bg-dark/15 !text-dark border-s! !border-[3px] border-dark",
                },
            ]
        }

        const addNewEvent = (info) => {
            formEvent.classList.remove("was-validated")
            formEvent.reset()
            this.selectedEvent = null
            modalTitle.innerText = "Add Event"
            this.newEventData = info
        }

        // Calendar instance
        this.calendarObj = new Calendar(calendarEl, {
            timeZone: "local",
            editable: true,
            droppable: true,
            selectable: true,
            height: window.innerHeight - 240,
            themeSystem: "tailwindcss",
            plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
            headerToolbar: {
                left: "prev,next,today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            },
            drop: (info) => checkbox.checked && info.draggedEl.parentNode.removeChild(info.draggedEl),
            eventClick: (info) => {
                HSOverlay.open("#event-modal")
                formEvent.reset()
                eventTitleInput.value = ""
                this.selectedEvent = info.event
                eventTitleInput.value = this.selectedEvent.title
                eventCategoryInput.value = this.selectedEvent.classNames[0]
                deleteEventBtn.classList.remove("hidden")
                this.newEventData = null
                saveEventBtn.innerText = "Edit Event"
            },
            dateClick: (info) => {
                HSOverlay.open("#event-modal")
                addNewEvent(info)
                deleteEventBtn.classList.add("hidden")
            },
            events: getDefaultEvents(),
        })

        formEvent.addEventListener("submit", (ev) => {
            ev.preventDefault()
            const updatedTitle = eventTitleInput.value
            const updatedCategory = eventCategoryInput.value
            if (!updatedTitle) return

            if (this.selectedEvent) {
                this.selectedEvent.setProp("title", updatedTitle)
                this.selectedEvent.setProp("classNames", [updatedCategory])
            } else {
                this.calendarObj.addEvent({
                    title: updatedTitle,
                    start: this.newEventData.date,
                    allDay: this.newEventData.allDay,
                    className: updatedCategory,
                })
            }
            HSOverlay.close("#event-modal")
        })

        deleteEventBtn.addEventListener("click", () => {
            if (this.selectedEvent) {
                this.selectedEvent.remove()
                this.selectedEvent = null
                HSOverlay.close("#event-modal")
            }
        })

        // Render and init external drag
        this.calendarObj.render()
        initializeDraggable()
    }
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        new CalendarApp().init()
    }, 20)
})
