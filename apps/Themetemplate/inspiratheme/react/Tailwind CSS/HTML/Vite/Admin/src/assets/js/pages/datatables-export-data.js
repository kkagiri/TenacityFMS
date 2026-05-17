/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Datatables Export Data
 */

import DataTable from "datatables.net-dt"
import "datatables.net-responsive-dt/js/responsive.dataTables"
import "datatables.net-buttons-dt/js/buttons.dataTables"
import "datatables.net-buttons/js/buttons.html5.min.js"
import "datatables.net-buttons/js/buttons.print.min.js"
import "jszip/dist/jszip.min.js"
import "pdfmake/build/pdfmake.min.js"
import "pdfmake/build/vfs_fonts.js"

document.addEventListener("DOMContentLoaded", () => {
    const exportDataTable = document.querySelector('[data-tables="export-data"]')
    if (exportDataTable) {
        new DataTable(exportDataTable, {
            dom: "<'md:flex justify-between items-center mb-3'Bf>" + "rt" + "<'md:flex justify-between items-center mt-4'ip>",
            responsive: true,
            buttons: [
                {
                    extend: "copy",
                    className: "btn btn-sm bg-secondary-hover text-white active",
                },
                {
                    extend: "csv",
                    className: "btn btn-sm bg-secondary text-white hover:bg-secondary-hover",
                },
                {
                    extend: "excel",
                    className: "btn btn-sm bg-secondary text-white hover:bg-secondary-hover",
                },
                {
                    extend: "print",
                    className: "btn btn-sm bg-secondary-hover text-white active",
                },
                {
                    extend: "pdf",
                    className: "btn btn-sm bg-secondary text-white hover:bg-secondary-hover",
                },
            ],
            language: {
                paginate: {
                    first: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 7l-5 5l5 5" /><path d="M17 7l-5 5l5 5" /></svg>', // Tabler First
                    previous:
                        '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>', // Tabler Prev
                    next: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>', // Tabler Next
                    last: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7l5 5l-5 5" /><path d="M13 7l5 5l-5 5" /></svg>', // Tabler Last
                },
            },
        })
    }

    const exportDropdownTable = document.querySelector('[data-tables="export-data-dropdown"]')
    if (exportDropdownTable) {
        new DataTable(exportDropdownTable, {
            dom: "<'md:flex justify-between items-center mb-3'<'hs-dropdown relative'B>f>" + "rt" + "<'md:flex justify-between align-center mt-4'ip>",
            responsive: true,
            buttons: [
                {
                    extend: "collection",
                    text: '<svg  xmlns="http://www.w3.org/2000/svg"  width="14"  height="14"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="me-1 align-baseline"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg> Export',
                    className: "btn btn-sm bg-secondary text-white *:flex hs-dropdown-toggle",
                    autoClose: true,
                    buttons: [
                        {
                            extend: "copy",
                            text: "Copy",
                        },
                        {
                            extend: "csv",
                            text: "CSV",
                        },
                        {
                            extend: "excel",
                            text: "Excel",
                        },
                        {
                            extend: "print",
                            text: "Print",
                        },
                        {
                            extend: "pdf",
                            text: "PDF",
                        },
                    ],
                },
            ],
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
