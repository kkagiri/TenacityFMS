import Icon from '@/components/wrappers/Icon'
import React, { useState } from 'react'
import { countries, CountryType } from './data'

const FlagsGrid = () => {
  const [globalFilter, setGlobalFilter] = useState('')

  const filteredCountries = countries.filter((c) => c.name.toLowerCase().includes(globalFilter.toLowerCase()))

  const rows: CountryType[][] = []
  for (let i = 0; i < filteredCountries.length; i += 2) {
    rows.push(filteredCountries.slice(i, i + 2))
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h4 className="card-title mb-1.5">Flags Listing (SVG)</h4>
          <p className="text-default-400">We offer a set of scalable SVG flags, perfect for language selectors and international content.</p>
        </div>

        <div className="relative flex items-center">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <Icon icon="search" className="text-default-400 text-lg" />
          </div>
          <input type="search" id="countrySearch" className="form-input w-57.5 ps-10" placeholder="Search country..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table id="flagTable" className="table-bordered table w-full text-center align-middle">
            <thead>
              <tr className="text-xs font-bold">
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
                          <img src={country.flag} alt={country.code} height={18} width={18} className="rounded h-4.5 mx-auto" />
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
            <tbody />
          </table>
        </div>
      </div>
    </div>
  )
}

export default FlagsGrid
