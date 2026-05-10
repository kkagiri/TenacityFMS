import DT from 'datatables.net-bs5'
import 'datatables.net-fixedcolumns-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive-bs5'
import { useEffect } from 'react'
import { columns, companies } from './data'
const ColumnTable = () => {
  DataTable.use(DT)
  useEffect(() => {
    setTimeout(() => {
      const tables = document.querySelectorAll('.dataTable')
      tables.forEach((tbl) => {
        if (tbl.api) tbl.api().columns.adjust().draw(false)
      })
    }, 300)
  }, [])
  return (
    <>
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
        className="table table-striped align-middle mb-0 w-100"
      />
    </>
  )
}
export default ColumnTable
