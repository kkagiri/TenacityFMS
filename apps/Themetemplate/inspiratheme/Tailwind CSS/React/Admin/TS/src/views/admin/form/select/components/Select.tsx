import ChoiceSelect from './ChoiceSelect'


type OptionType = {
  label: string
  value: string
}

const basicOptions: OptionType[] = [
  { value: 'Choice 1', label: 'Choice 1' },
  { value: 'Choice 2', label: 'Choice 2' },
  { value: 'Choice 3', label: 'Choice 3' },
]

const NoSearch: OptionType[] = [
  { value: 'Zero', label: 'Zero' },
  { value: 'One', label: 'One' },
  { value: 'Two', label: 'Two' },
  { value: 'Three', label: 'Three' },
  { value: 'Four', label: 'Four' },
  { value: 'Five', label: 'Five' },
  { value: 'Six', label: 'Six' },
]

const groupedOptions = [
  {
    label: 'UK',
    options: [
      { label: 'London', value: 'London' },
      { label: 'Manchester', value: 'Manchester' },
      { label: 'Liverpool', value: 'Liverpool' },
    ],
  },
  {
    label: 'FR',
    options: [
      { label: 'Paris', value: 'Paris' },
      { label: 'Lyon', value: 'Lyon' },
      { label: 'Marseille', value: 'Marseille' },
    ],
  },
  {
    label: 'DE',
    options: [
      { label: 'Hamburg', value: 'Hamburg' },
      { label: 'Munich', value: 'Munich' },
      { label: 'Berlin', value: 'Berlin' },
    ],
    isDisabled: true,
  },
  {
    label: 'US',
    options: [
      { label: 'New York', value: 'New York' },
      { label: 'Washington', value: 'Washington', isDisabled: true },
      { label: 'Michigan', value: 'Michigan' },
    ],
  },
  {
    label: 'SP',
    options: [
      { label: 'Madrid', value: 'Madrid' },
      { label: 'Barcelona', value: 'Barcelona' },
      { label: 'Malaga', value: 'Malaga' },
    ],
  },
  {
    label: 'CA',
    options: [
      { label: 'Montreal', value: 'Montreal' },
      { label: 'Toronto', value: 'Toronto' },
      { label: 'Vancouver', value: 'Vancouver' },
    ],
  },
]

const ReactSelect = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h4 className="card-title mb-1.5">Choices.Js</h4>
        <p className="text-default-400">Choices.js is a lightweight, configurable select box/text input plugin. Similar to Select2 and Selectize but without the jQuery dependency.</p>
      </div>

      <div className="card-body space-y-9">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Single Select Input: Default</h5>
            <p className="text-default-400">
              Set <code>data-choices</code>
              attribute to set a default single select.
            </p>
          </div>
          <div>
            <ChoiceSelect options={basicOptions} search={false} placeholder="This is a placeholder" />
          </div>
        </div>
        <hr className="border-default-300 my-7.5 border-dashed" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Single Select Input: Option Groups</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-groups</code>
              attribute to set option group
            </p>
          </div>
          <div>
            <ChoiceSelect groups={groupedOptions} search={false} placeholder="Select City" />
          </div>
        </div>
        <hr className="border-default-300 my-7.5 border-dashed" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Single Select Input: No Search</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-search-false data-choices-removeItem</code>
            </p>
          </div>
          <div>
            <ChoiceSelect options={NoSearch} search={false} removeItem />
          </div>
        </div>
        <hr className="border-default-300 my-7.5 border-dashed" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Single Select Input: No Sorting</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-sorting-false</code>
              attribute.
            </p>
          </div>
          <div>
            <ChoiceSelect options={basicOptions} sorting={false} search={false} />
          </div>
        </div>
        <hr className="border-default-300 my-7.5 border-dashed" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Multiple Select Input: Default</h5>
            <p className="text-default-400">
              Set
              <code>data-choices multiple</code>
              attribute.
            </p>
          </div>
          <div>
            <ChoiceSelect options={basicOptions} multiple defaultValue={['Choice 1']} />
          </div>
        </div>
        <hr className="border-default-300 my-7.5 border-dashed" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Multiple Select Input: With Remove Button</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-removeItem multiple</code>
              attribute.
            </p>
          </div>
          <div>
            <ChoiceSelect options={basicOptions} multiple removeItem defaultValue={['Choice 1']} />
          </div>
        </div>
        <hr className="border-default-300 my-7.5 border-dashed" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Multiple Select Input: Option Groups</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-multiple-groups=&quot;true&quot; multiple</code>
              attribute.
            </p>
          </div>
          <div>
            <ChoiceSelect groups={groupedOptions} multiple />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Text Input: Limit Values with Remove Button</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-limit=&quot;3&quot; data-choices-removeItem</code>
              attribute.
            </p>
          </div>
          <div>
            <ChoiceSelect type="text" limit={3} removeItem defaultValue="Task-1" />
            &nbsp;
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Text Input: Unique Values Only</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-text-unique-true</code>
              attribute.
            </p>
          </div>
          <div>
            <ChoiceSelect type="text" uniqueText defaultValue="Project-A, Project-B" />
          </div>
        </div>

        <hr className="border-default-300 my-7.5 border-dashed" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-2 text-sm">Text Input: Disabled</h5>
            <p className="text-default-400">
              Set
              <code>data-choices data-choices-text-disabled-true</code>
              attribute.
            </p>
          </div>
          <div>
            <ChoiceSelect type="text" disabled defaultValue="josh@abc.com, joe@xyz.com" />
            &nbsp;
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReactSelect
