import DT from 'datatables.net'
import DataTable, { DataTableRef } from 'datatables.net-react'
import 'datatables.net-responsive'
import { useRef } from 'react'
import { columns, paginationIcons, tableData } from '../../data'

const columnLabels = ['Company', 'Symbol', 'Price', 'Change', 'Volume', 'Market Cap', 'Rating', 'Status']

const Table = () => {
  DataTable.use(DT)

  const tableRef = useRef<DataTableRef | null>(null)

  // Render controls inside DataTable header
  const renderTopStart = () => {
    const container = document.createElement('div')
    container.className = 'flex items-center gap-2'

    /* ---------- Dropdown ---------- */
    const dropdown = document.createElement('div')
    dropdown.className = 'hs-dropdown'

    const toggleBtn = document.createElement('button')
    toggleBtn.type = 'button'
    toggleBtn.className = 'hs-dropdown-toggle btn btn-sm bg-secondary text-white'
    toggleBtn.setAttribute('data-bs-toggle', 'dropdown')
    toggleBtn.setAttribute('aria-expanded', 'false')
    toggleBtn.textContent = 'Show/Hide Columns'

    // Add click handler to toggle the dropdown
    toggleBtn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true'
      toggleBtn.setAttribute('aria-expanded', (!isExpanded).toString())
      menu.classList.toggle('show', !isExpanded)
    }
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target as Node)) {
        toggleBtn.setAttribute('aria-expanded', 'false')
        menu.classList.remove('show')
      }
    })

    const menu = document.createElement('ul')
    menu.className = 'hs-dropdown-menu'

    columnLabels.forEach((label, index) => {
      const li = document.createElement('li')
      li.className = 'dropdown-item'

      const wrapper = document.createElement('div')
      wrapper.className = 'flex items-center gap-2'

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'form-checkbox form-checkbox-light mt-0 toggle-vis'
      checkbox.id = `col-${index}`
      checkbox.checked = true

      checkbox.onchange = () => {
        tableRef.current?.dt()?.column(index).visible(checkbox.checked)
      }

      const text = document.createElement('label')
      text.className = 'form-check-label font-medium'
      text.htmlFor = checkbox.id
      text.textContent = label

      wrapper.appendChild(checkbox)
      wrapper.appendChild(text)
      li.appendChild(wrapper)
      menu.appendChild(li)
    })

    dropdown.appendChild(toggleBtn)
    dropdown.appendChild(menu)
    container.appendChild(dropdown)

    return container
  }

  return (
    <>
      <DataTable
        ref={tableRef}
        data={tableData.body}
        columns={columns}
        options={{
          responsive: true,
          lengthChange: false,
          layout: {
            topStart: renderTopStart,
            topEnd: 'search',
          },
          language: {
            paginate: paginationIcons,
          },
        }}
        className="table table-striped dt-responsive align-middle mb-0"
      >
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {tableData.header.map((label, idx) => (
              <th key={idx}>{label}</th>
            ))}
          </tr>
        </thead>
      </DataTable>
    </>
  )
}

export default Table
