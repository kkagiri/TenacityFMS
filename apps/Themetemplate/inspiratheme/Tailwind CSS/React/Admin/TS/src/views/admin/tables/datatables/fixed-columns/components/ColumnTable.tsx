import DT from 'datatables.net'
import 'datatables.net-fixedcolumns'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect } from 'react'
import { columns, companies } from './data'

const ColumnTable = () => {
  DataTable.use(DT)

  useEffect(() => {
    setTimeout(() => {
      const tables = document.querySelectorAll('.dataTable')
      tables.forEach((tbl: any) => {
        if (tbl.api) tbl.api().columns.adjust().draw(false)
      })
    }, 300)
  }, [])

  return (
    <DataTable
      data={companies}
      columns={columns}
      options={{
        scrollX: true,
        paging: false,
        scrollY: '300px',
        scrollCollapse: true,
        pageLength: 10,
        ordering: true,
        responsive: false,
        fixedColumns: {
          leftColumns: 1,
          rightColumns: 1,
        },
        lengthChange: false,
      }}
      className="table-striped dt-responsive table align-middle"
    />
  )
}

export default ColumnTable
