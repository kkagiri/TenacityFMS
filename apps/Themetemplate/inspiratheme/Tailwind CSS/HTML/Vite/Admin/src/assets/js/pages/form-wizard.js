import { HSTabs, HSStepper } from "preline"

window.$hsTabsCollection = window.$hsTabsCollection || []
window.$hsStepperCollection = window.$hsStepperCollection || []

document.addEventListener("DOMContentLoaded", () => {
    HSTabs.autoInit()
    HSStepper.autoInit()

    const stepperValidation = document.querySelector("#hs-stepper-validation")
    if (stepperValidation) {
        const stepper = HSStepper.getInstance(stepperValidation)
        if (stepper) {
            const validateCurrentStep = () => {
                const index = stepper.currentIndex
                const currentStep = stepperValidation.querySelector(`[data-hs-stepper-content-item*='"index": ${index}']`)

                if (!currentStep) return true

                const inputs = currentStep.querySelectorAll("input, select, textarea")
                let isValid = true

                inputs.forEach((input) => {
                    input.classList.remove("is-invalid", "is-valid")
                    if (!input.checkValidity()) {
                        input.classList.add("is-invalid")
                        isValid = false
                    } else {
                        input.classList.add("is-valid")
                    }
                })

                const item = stepper.getNavItem(index)
                if (!isValid) {
                    if (item) item.isProcessed = true
                    stepper.setErrorNavItem(index)
                } else {
                    if (item) item.isProcessed = false
                    const navItem = stepperValidation.querySelector(`[data-hs-stepper-nav-item*='"index": ${index}']`)
                    if (navItem) navItem.classList.remove("error", "hs-stepper-error")
                }
                return isValid
            }

            stepper.on("beforeNext", (index) => {
                const isValid = validateCurrentStep()
                const item = stepper.getNavItem(index)
                if (item) {
                    item.isProcessed = !isValid
                }
            })

            const navItems = stepperValidation.querySelectorAll("[data-hs-stepper-nav-item]")
            navItems.forEach((navItemEl) => {
                navItemEl.addEventListener(
                    "click",
                    (e) => {
                        const navData = JSON.parse(navItemEl.getAttribute("data-hs-stepper-nav-item"))
                        if (navData.index > stepper.currentIndex) {
                            if (!validateCurrentStep()) {
                                e.preventDefault()
                                e.stopImmediatePropagation()
                                return false
                            }
                        }
                    },
                    true
                )
            })

            stepperValidation.addEventListener("input", () => {
                stepper.enableButtons()
                const item = stepper.getNavItem(stepper.currentIndex)
                if (item && item.isProcessed) item.isProcessed = false
            })

            stepper.on("back", (index) => {
                const item = stepper.getNavItem(index)
                if (item) item.isProcessed = false
                const navItem = stepperValidation.querySelector(`[data-hs-stepper-nav-item*='"index": ${index}']`)
                if (navItem) {
                    navItem.classList.remove("error", "hs-stepper-error")
                }
            })
        }
    }

    const stepperProgress = document.querySelector("#hs-stepper-progress")
    if (stepperProgress) {
        const stepper = HSStepper.getInstance(stepperProgress)
        if (stepper) {
            const progressBar = stepperProgress.querySelector(".hs-stepper-progress-bar")
            const totalSteps = stepper.totalSteps

            const updateProgress = (index) => {
                const percentage = (index / totalSteps) * 100
                if (progressBar) progressBar.style.width = `${percentage}%`
            }

            stepper.on("active", (index) => {
                updateProgress(index)
            })

            updateProgress(stepper.currentIndex)
        }
    }
})
