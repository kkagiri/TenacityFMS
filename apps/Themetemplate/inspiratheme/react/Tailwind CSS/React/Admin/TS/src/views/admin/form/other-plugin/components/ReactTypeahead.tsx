import { Link } from 'react-router'
import { useState } from 'react'
import { Typeahead as TypeaheadClient } from 'react-bootstrap-typeahead'
import { Option } from 'react-bootstrap-typeahead/types/types'
import { options } from './data'

import Icon from '@/components/wrappers/Icon'
import 'react-bootstrap-typeahead/css/Typeahead.bs5.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'

const ReactTypeahead = () => {
  const [singleSelections, setSingleSelections] = useState<Option[]>([])

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Typeahead</h4>
      </div>

      <div className="card-body">
        <p className="text-default-400 mb-3">a flexible JavaScript library that provides a strong foundation for building robust typeaheads</p>
        <Link className="font-semibold text-primary flex items-center" to="https://twitter.github.io/typeahead.js/" target="_blank">
          Typeahead on View Official Website
          <Icon icon="chevron-right"></Icon>
        </Link>
      </div>

      <div className="card-body">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Basic</h5>
          <TypeaheadClient className="typeahead" placeholder="Enter states from USA" options={options} selected={singleSelections} onChange={setSingleSelections} />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">BloodHound (Suggestion Engine)</h5>
          <TypeaheadClient className="bloodhound-typeahead" labelKey="state" placeholder="Enter states from USA" options={options} multiple />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Prefetch</h5>
          <TypeaheadClient className="prefetch-typeahead" options={options} placeholder="Enter states from USA" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Default Suggestions</h5>
          <TypeaheadClient className="default-suggestions-typeahead" options={options} placeholder="Default Suggestions" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Custom Template</h5>
          <TypeaheadClient className="custom-template-typeahead" options={options} placeholder="Search For Oscar Winner" />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300"></div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Multiple Datasets</h5>
          <TypeaheadClient className="multi-datasets-typeahead" options={options} placeholder="NBA and NHL Teams" />
        </div>
      </div>
    </div>
  )
}

export default ReactTypeahead
