import Icon from '@/components/wrappers/Icon'
import React, { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { countries } from './data'
const FlagsGrid = () => {
  const [globalFilter, setGlobalFilter] = useState('')
  const filteredCountries = countries.filter((c) => c.name.toLowerCase().includes(globalFilter.toLowerCase()))
  const rows = []
  for (let i = 0; i < filteredCountries.length; i += 2) {
    rows.push(filteredCountries.slice(i, i + 2))
  }
  return (
    <Card>
      <CardHeader className="justify-content-between d-flex align-items-center">
        <div>
          <CardTitle as="h4" className="mb-1 d-flex align-items-center gap-2">
            Flags Listing (SVG)
          </CardTitle>
          <p className="mb-0 text-muted">We offer a set of scalable SVG flags, perfect for language selectors and international content.</p>
        </div>
        <div className="app-search d-flex align-items-center gap-2">
          <input type="search" className="form-control" placeholder="Search country..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
          <Icon icon="search" className="app-search-icon text-muted" />
        </div>
      </CardHeader>

      <CardBody>
        <div className="table-responsive">
          <table className="table table-bordered align-middle text-center w-100">
            <thead>
              <tr className="fs-xxs">
                <th>Flag</th>
                <th>Country Name</th>
                <th>Path</th>
                <th>Flag</th>
                <th>Country Name</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((pair, idx) => (
                  <tr key={idx}>
                    {pair.map((country, i) => (
                      <React.Fragment key={country.code}>
                        <td>
                          <img src={country.flag} alt={country.code} height={18} width={18} className="rounded" />
                        </td>
                        <td>{country.name}</td>
                        <td>assets/images/flags/{country.code}.svg</td>
                      </React.Fragment>
                    ))}
                    {pair.length === 1 && (
                      <>
                        <td></td>
                        <td></td>
                        <td></td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
export default FlagsGrid
