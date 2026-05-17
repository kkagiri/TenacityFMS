/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Form Validation
 */

document.getElementById("tailwindValidationForm").addEventListener("submit", function (e) {
    e.preventDefault()
    let valid = true

    // Validate normal inputs and selects
    this.querySelectorAll(".input-field").forEach((input) => {
        const wrapper = input.parentElement
        const validIcon = wrapper.querySelector(".valid-icon")
        const invalidIcon = wrapper.querySelector(".invalid-icon")
        const validMsg = wrapper.parentElement.querySelector(".valid-msg")
        const invalidMsg = wrapper.parentElement.querySelector(".invalid-msg")

        if (!input.checkValidity()) {
            valid = false
            input.classList.add("!border-danger")
            input.classList.remove("!border-success")
            invalidIcon?.classList.remove("hidden")
            validIcon?.classList.add("hidden")
            invalidMsg?.classList.remove("hidden")
            validMsg?.classList.add("hidden")
        } else {
            input.classList.remove("!border-danger")
            input.classList.add("!border-success")
            validIcon?.classList.remove("hidden")
            invalidIcon?.classList.add("hidden")
            invalidMsg?.classList.add("hidden")
            validMsg?.classList.remove("hidden")
        }
    })

    // ✅ Validate checkbox separately
    const checkbox = document.getElementById("terms")
    const checkboxError = checkbox.parentElement.querySelector(".invalid-msg")

    if (!checkbox.checked) {
        valid = false
        checkboxError.classList.remove("hidden")
        checkbox.classList.add("!border-danger")
    } else {
        checkboxError.classList.add("hidden")
        checkbox.classList.remove("!border-danger")
    }

    if (valid) this.submit()
})
