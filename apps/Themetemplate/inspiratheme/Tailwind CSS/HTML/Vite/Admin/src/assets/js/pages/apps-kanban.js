/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Apps Kanban
 */

import Sortable from "sortablejs"

document.addEventListener("DOMContentLoaded", () => {
    const sortables = document.querySelectorAll('[data-plugins="sortable"]')

    if (sortables && sortables.length > 0) {
        sortables.forEach((el) => {
            new Sortable(el, {
                animation: 150,
                group: "shared",
                ghostClass: "sortable-item-ghost",
                forceFallback: true,
                emptyInsertThreshold: 100,
                chosenClass: "sortable-item-active",
            })
        })
    }
})
