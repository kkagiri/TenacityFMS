import TouchSpinInput from './TouchSpinInput'

const InputTouchspin = () => {
  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h4 className="card-title">Input Touchspin</h4>
        <span className="badge badge-label bg-success/15 text-success">Exclusive</span>
      </div>

      <div className="card-body">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Default Touchspin</h5>
          <div className="flex flex-col gap-3">
            <TouchSpinInput />
            <TouchSpinInput order="input-minus-plus" />
            <TouchSpinInput order="minus-plus-input" />
          </div>
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300" />

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Sizes</h5>
          <div className="flex flex-col gap-3">
            <TouchSpinInput />
            <TouchSpinInput />
          </div>
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300" />

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Colors</h5>
          <div className="flex flex-col gap-2">
            <TouchSpinInput minusBtnClass="btn bg-primary text-white hover:bg-primary-hover" plusBtnClass="btn bg-primary text-white hover:bg-primary-hover" />
            <TouchSpinInput minusBtnClass="btn bg-secondary text-white hover:bg-secondary-hover" plusBtnClass="btn bg-secondary text-white hover:bg-secondary-hover" />
            <TouchSpinInput minusBtnClass="btn bg-info text-white hover:bg-info-hover" plusBtnClass="btn bg-info text-white hover:bg-info-hover" />
            <TouchSpinInput minusBtnClass="btn bg-success text-white hover:bg-success-hover" plusBtnClass="btn bg-success text-white hover:bg-success-hover" />
            <TouchSpinInput minusBtnClass="btn bg-warning text-white hover:bg-warning-hover" plusBtnClass="btn bg-warning text-white hover:bg-warning-hover" />
            <TouchSpinInput minusBtnClass="btn bg-danger text-white hover:bg-danger-hover" plusBtnClass="btn bg-danger text-white hover:bg-danger-hover" />
            <TouchSpinInput minusBtnClass="btn bg-dark text-light hover:bg-dark-hover" plusBtnClass="btn bg-dark text-light hover:bg-dark-hover" />
            <TouchSpinInput minusBtnClass="btn bg-primary/15 text-primary hover:bg-primary hover:text-white" plusBtnClass="btn bg-primary/15 text-primary hover:bg-primary hover:text-white" />
          </div>
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300" />

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Readonly</h5>
          <TouchSpinInput readOnly />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300" />

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Disabled</h5>
          <TouchSpinInput disabled />
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300" />

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Style</h5>
          <div className="flex flex-col gap-2">
            <TouchSpinInput minusBtnClass="btn rounded-full! bg-primary text-white hover:bg-primary-hover" plusBtnClass="btn rounded-full! bg-primary text-white hover:bg-primary-hover" />

            <TouchSpinInput wrapperClass="input-group rounded-full!" minusBtnClass="btn rounded-full! bg-primary/15 text-primary hover:bg-primary hover:text-white" plusBtnClass="btn rounded-full! bg-primary/15 text-primary hover:bg-primary hover:text-white" />

            <TouchSpinInput wrapperClass="input-group p-0!" minusBtnClass="btn rounded-e-none! bg-primary/15 text-primary hover:bg-primary hover:text-white" plusBtnClass="btn rounded-s-none! bg-primary/15 text-primary hover:bg-primary hover:text-white" />
          </div>
        </div>

        <div className="my-7.5 border-t border-dashed border-default-300" />

        <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
          <h5 className="mb-2">Vertical Style</h5>
          <div className="flex flex-col gap-2">
            <TouchSpinInput
              vertical
              wrapperClass="flex items-center overflow-hidden"
              inputClass="form-input rounded-s-none! text-center w-full"
              plusBtnClass="btn rounded-none rounded-ss btn-icon w-7 h-4.75 bg-success/15 text-success"
              minusBtnClass="btn rounded-none rounded-es btn-icon w-7 h-4.75 bg-danger/15 text-danger"
              max={10}
            />

            <TouchSpinInput
              vertical
              wrapperClass="flex items-center overflow-hidden"
              inputClass="form-input rounded-s-none! text-center w-full"
              plusBtnClass="btn rounded-none rounded-ss btn-icon w-7 h-4.75 bg-success text-white"
              minusBtnClass="btn rounded-none rounded-es btn-icon w-7 h-4.75 bg-danger text-white hover:bg-danger-hover"
              max={10}
            />

            <TouchSpinInput
              vertical
              wrapperClass="flex items-center overflow-hidden"
              inputClass="form-input rounded-s-none! text-center w-full"
              plusBtnClass="btn rounded-none btn-icon w-7 h-4.75 text-white bg-dark"
              minusBtnClass="btn rounded-none btn-icon w-7 h-4.75 text-white bg-dark"
              max={10}
            />

            {/* <TouchSpinInput
              vertical
              verticalButtonsRight
              wrapperClass="flex items-center overflow-hidden"
              inputClass="form-input rounded-e-none! text-center w-full"
              plusBtnClass="btn rounded-none btn-icon w-7 h-4.75 text-white"
              minusBtnClass="btn rounded-none btn-icon w-7 h-4.75 text-white"
              max={10}
            /> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputTouchspin
