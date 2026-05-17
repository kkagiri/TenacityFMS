/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Datatables Show Hide Columns
 */

import DataTable from "datatables.net-dt"
import "datatables.net-responsive-dt/js/responsive.dataTables"

document.addEventListener("DOMContentLoaded", function () {
    const tableElement = document.getElementById("show-hide-column")
    if (tableElement) {
        const table = new DataTable(tableElement, {
            responsive: true,
            dom: "<'md:flex justify-between items-center mb-3'<'columnToggleWrapper'B>f>" + "rt" + "<'md:flex justify-between items-center mt-base'lp>",
            language: {
                paginate: {
                    first: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 7l-5 5l5 5" /><path d="M17 7l-5 5l5 5" /></svg>',
                    previous:
                        '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>',
                    next: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>',
                    last: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7l5 5l-5 5" /><path d="M13 7l5 5l-5 5" /></svg>',
                },
            },
        })

        // Define columns and labels
        const columnLabels = ["Company", "Symbol", "Price", "Change", "Volume", "Market Cap", "Rating", "Status"]

        // Create dropdown with toggles dynamically
        const columnToggleWrapper = document.querySelector(".columnToggleWrapper")

        if (columnToggleWrapper) {
            const dropdown = document.createElement("div")
            dropdown.className = "hs-dropdown [--auto-close:inside] relative inline-flex"

            dropdown.innerHTML = `
        <button class="hs-dropdown-toggle btn btn-sm bg-secondary text-white" type="button">
            Show/Hide Columns
        </button>
        <ul class="hs-dropdown-menu" id="columnToggleMenu">
            ${columnLabels
                .map(
                    (label, index) => `
                <li class="dropdown-item">
                    <div class="flex items-center gap-2">
                        <input class="form-checkbox form-checkbox-light mt-0 toggle-vis" 
                               type="checkbox" data-column="${index}" id="colToggle${index}" checked>
                        <label class="form-check-label font-medium cursor-pointer" for="colToggle${index}">
                            ${label}
                        </label>
                    </div>
                </li>
            `
                )
                .join("")}
        </ul>
    `

            columnToggleWrapper.appendChild(dropdown)

            // Handle visibility toggle
            document.getElementById("columnToggleMenu").addEventListener("change", function (e) {
                if (e.target.classList.contains("toggle-vis")) {
                    const colIndex = parseInt(e.target.dataset.column, 10)
                    const column = table.column(colIndex)
                    column.visible(e.target.checked)
                }
            })
        }
    }
})

const applyPagingColor = () => {
    document.querySelectorAll(".dt-paging-button").forEach((btn) => {
        if (btn.classList.contains("current")) {
            btn.style.setProperty("color", "white", "important")
        } else {
            btn.style.removeProperty("color")
        }
    })
}

// On initial load
setTimeout(applyPagingColor, 200)

// On click (DataTables pagination updates)
document.addEventListener("click", (e) => {
    if (e.target.closest(".dt-paging-button")) {
        setTimeout(applyPagingColor, 200)
    }
})
