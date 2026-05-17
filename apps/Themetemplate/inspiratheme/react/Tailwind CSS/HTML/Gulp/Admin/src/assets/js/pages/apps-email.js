/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Apps Email
 */

const selectAll = document.getElementById("select-all-email")

if (selectAll) {
    selectAll.addEventListener("change", function () {
        const checkboxes = document.querySelectorAll(".email-item-check")
        if (checkboxes && checkboxes.length > 0) {
            checkboxes.forEach((checkbox) => {
                checkbox.checked = this.checked
            })
        }
    })
}
