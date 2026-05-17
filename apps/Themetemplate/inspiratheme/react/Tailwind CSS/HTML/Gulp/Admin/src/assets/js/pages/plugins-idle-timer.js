/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Plugins Idle Timer
 */

class IdleDetector {
    constructor(options = {}) {
        this.idleLimit = options.idleLimit || 5
        this.idleTime = 0
        this.wasIdle = false

        this.alertSelector = options.alertSelector || ".idle-alert"
        this.toastIdleId = options.toastIdleId || "liveToast"
        this.toastReturnId = options.toastReturnId || "backToast"

        this.events = options.events || ["mousemove", "keydown", "scroll", "click"]
        this.interval = null

        this.init()
    }

    init() {
        // Attach activity listeners
        this.events.forEach((evt) => {
            window.addEventListener(evt, () => this.resetTimer())
        })

        // Start idle timer
        this.interval = setInterval(() => {
            this.idleTime++
            if (this.idleTime === this.idleLimit) {
                this.setIdleState()
            }
        }, 1000)
    }

    resetTimer() {
        this.idleTime = 0

        const alert = document.querySelector(this.alertSelector)
        if (alert && !alert.classList.contains("hidden")) {
            alert.classList.add("hidden")
        }

        if (this.wasIdle) {
            this.showToast(this.toastReturnId)
            this.wasIdle = false
        }
    }

    setIdleState() {
        this.wasIdle = true

        const alert = document.querySelector(this.alertSelector)
        if (alert) {
            alert.classList.remove("hidden")
        }

        this.showToast(this.toastIdleId)
    }

    showToast(toastId) {
        const toastEl = document.getElementById(toastId)
        if (!toastEl) return

        // Show toast
        toastEl.classList.add("block")
        toastEl.classList.remove("hidden")

        // Auto-hide after 3 seconds
        setTimeout(() => {
            toastEl.classList.remove("block")
            toastEl.classList.add("hidden")
        }, 3000)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new IdleDetector()
})
