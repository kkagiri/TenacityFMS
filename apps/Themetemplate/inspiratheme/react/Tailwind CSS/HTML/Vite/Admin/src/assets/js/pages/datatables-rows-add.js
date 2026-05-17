/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Datatables Add Rows
 */

import DataTable from "datatables.net-dt"
import "datatables.net-responsive-dt/js/responsive.dataTables"

document.addEventListener("DOMContentLoaded", () => {
    let counter = 1

    const tableElement = document.getElementById("add-rows-data")
    if (tableElement) {
        const table = new DataTable("#add-rows-data", {
            dom: "<'md:flex justify-between items-center mb-3'<'btn-toolbar'<'addRowBtn me-3'>><'dropdown'B>f>" + "<'row'<'col-sm-12'tr>>" + "<'md:flex justify-between items-center mt-base'ip>",
            language: {
                paginate: {
                    first: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 7l-5 5l5 5" /><path d="M17 7l-5 5l5 5" /></svg>',
                    previous:
                        '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>',
                    next: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>',
                    last: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7l5 5l-5 5" /><path d="M13 7l5 5l-5 5" /></svg>',
                },
            },
            columns: [{ title: "Company" }, { title: "Symbol" }, { title: "Price" }, { title: "Change" }, { title: "Volume" }, { title: "Market Cap" }, { title: "Rating" }, { title: "Status" }],
        })

        // Add a custom button (after table renders)
        const btnContainer = document.querySelector(".addRowBtn")
        if (btnContainer) {
            const btn = document.createElement("button")
            btn.id = "addRow"
            btn.className = "btn bg-primary text-white btn-sm hover:bg-primary-hover"
            btn.textContent = "Add Row"
            btnContainer.appendChild(btn)

            btn.addEventListener("click", () => {
                table.row
                    .add([
                        `New Company ${counter}`,
                        `SYM${counter}`,
                        `$${(Math.random() * 1000 + 1000).toFixed(2)}`,
                        `${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 2).toFixed(2)}%`,
                        Math.floor(Math.random() * 1000000).toLocaleString(),
                        `$${(Math.random() * 100).toFixed(2)}B`,
                        `${(Math.random() * 5).toFixed(1)} ★`,
                        `<span class="badge rounded-none ${Math.random() > 0.5 ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}">${Math.random() > 0.5 ? "Bullish" : "Bearish"}</span>`,
                    ])
                    .draw(false)
                counter++
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
