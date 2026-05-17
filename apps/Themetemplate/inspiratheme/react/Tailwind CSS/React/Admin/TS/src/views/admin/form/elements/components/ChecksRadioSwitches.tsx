const ChecksRadioSwitches = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Checks, Radios and Switches</h4>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Checkboxes</label>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkDefault" className="form-checkbox" />
                  <label htmlFor="checkDefault">Default Checkbox</label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkLight" className="form-checkbox bg-default-200! checked:bg-primary!" />
                  <label htmlFor="checkLight">Light Checkbox</label>
                </div>

                <div className="flex items-center gap-x-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkInline1" className="form-checkbox" defaultChecked />
                    <label htmlFor="checkInline1">Inline 1</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkInline2" className="form-checkbox" />
                    <label htmlFor="checkInline2">Inline 2</label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkIndeterminate" className="form-checkbox" />
                  <label htmlFor="checkIndeterminate">Disabled indeterminate checkbox</label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkCheckedDisabled" className="form-checkbox" defaultChecked disabled />
                  <label htmlFor="checkCheckedDisabled">Disabled checked checkbox</label>
                </div>

                <h5 className="mt-base mb-2 font-semibold">Sizes</h5>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkSize1" className="form-checkbox size-5!" defaultChecked />
                  <label htmlFor="checkSize1">I&apos;m 16px Checkbox</label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkSize2" className="form-checkbox checked:bg-secondary! size-6.25!" defaultChecked />
                  <label htmlFor="checkSize2">I&apos;m 20px Checkbox</label>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Switches</label>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="switch1" className="form-switch" defaultChecked />
                  <label htmlFor="switch1">Enabled Switch</label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="switch2" className="form-switch" disabled />
                  <label htmlFor="switch2" className="text-default-400">
                    Disabled Switch
                  </label>
                </div>

                <h5 className="mt-base mb-2 font-semibold">Sizes</h5>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkboxSize16" className="form-switch" defaultChecked />
                  <label htmlFor="checkboxSize16">I&apos;m 16px Switch</label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="checkboxSize20" className="form-switch form-switch-lg checked:bg-secondary!" defaultChecked />
                  <label htmlFor="checkboxSize20">I&apos;m 20px Switch</label>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Colored Checkboxes</label>
              </div>

              <div className="col-span-1 flex flex-wrap gap-9 lg:col-span-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkPrimary" className="form-checkbox checked:bg-primary!" defaultChecked />
                    <label htmlFor="checkPrimary">Primary</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkSecondary" className="form-checkbox checked:bg-secondary!" defaultChecked />
                    <label htmlFor="checkSecondary">Secondary</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkSuccess" className="form-checkbox checked:bg-success!" defaultChecked />
                    <label htmlFor="checkSuccess">Success</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkInfo" className="form-checkbox checked:bg-info!" defaultChecked />
                    <label htmlFor="checkInfo">Info</label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkWarning" className="form-checkbox checked:bg-warning!" defaultChecked />
                    <label htmlFor="checkWarning">Warning</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkDanger" className="form-checkbox checked:bg-danger!" defaultChecked />
                    <label htmlFor="checkDanger">Danger</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkDark" className="form-checkbox checked:bg-dark!" defaultChecked />
                    <label htmlFor="checkDark">Dark</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Colored Switches</label>
              </div>

              <div className="col-span-1 flex flex-wrap gap-9 lg:col-span-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkPrimary" className="form-switch checked:bg-primary!" defaultChecked />
                    <label htmlFor="checkPrimary">Primary</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkSecondary" className="form-switch checked:bg-secondary!" defaultChecked />
                    <label htmlFor="checkSecondary">Secondary</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkSuccess" className="form-switch checked:bg-success!" defaultChecked />
                    <label htmlFor="checkSuccess">Success</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkInfo" className="form-switch checked:bg-info!" defaultChecked />
                    <label htmlFor="checkInfo">Info</label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkWarning" className="form-switch checked:bg-warning!" defaultChecked />
                    <label htmlFor="checkWarning">Warning</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkDanger" className="form-switch checked:bg-danger!" defaultChecked />
                    <label htmlFor="checkDanger">Danger</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkDark" className="form-switch checked:bg-dark!" defaultChecked />
                    <label htmlFor="checkDark">Dark</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Radios</label>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <input type="radio" name="gridRadio" id="radio1" className="form-radio rounded-full!" defaultChecked />
                  <label htmlFor="radio1">Option 1</label>
                </div>

                <div className="flex items-center gap-2">
                  <input type="radio" name="gridRadio" id="radio2" className="form-radio rounded-full!" />
                  <label htmlFor="radio2">Option 2</label>
                </div>

                <div className="flex space-x-4">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="inlineRadioOptions" id="inlineRadio1" value="option1" className="form-radio rounded-full!" defaultChecked />
                    <label htmlFor="inlineRadio1">Inline 1</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="inlineRadioOptions" id="inlineRadio2" value="option2" className="form-radio rounded-full!" />
                    <label htmlFor="inlineRadio2">Inline 2</label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="radio" name="disabledRadioOptions" id="inlineRadio3" value="option3" className="form-radio rounded-full!" defaultChecked disabled />
                  <label htmlFor="inlineRadio3" className="text-default-400">
                    Disabled Checked Radio
                  </label>
                </div>

                <h5 className="mt-5 mb-2 font-semibold">Sizes</h5>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="paymentMethod" id="radioCash" value="cash" className="form-radio rounded-full! size-5!" defaultChecked />
                    <label htmlFor="radioCash">Cash</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="paymentMethod" id="radioCard" value="card" className="form-radio rounded-full! size-5!" />
                    <label htmlFor="radioCard">Card</label>
                  </div>
                </div>

                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="deliveryOption" id="radioPickup" value="pickup" className="form-radio rounded-full! size-6!" defaultChecked />
                    <label htmlFor="radioPickup">Pickup</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="deliveryOption" id="radioHome" value="home" className="form-radio rounded-full! size-6!" />
                    <label htmlFor="radioHome">Home Delivery</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Reverse</label>
              </div>

              <div className="col-span-1 w-full space-y-3 lg:col-span-2 lg:w-1/2">
                <div className="flex flex-row-reverse items-center gap-2">
                  <input type="checkbox" id="reverseCheck1" className="form-checkbox" defaultChecked />
                  <label htmlFor="reverseCheck1">Reverse checkbox</label>
                </div>

                <div className="flex flex-row-reverse items-center gap-2">
                  <input type="radio" id="reverseCheck2" name="reverseRadio" className="form-radio rounded-full!" disabled />
                  <label htmlFor="reverseCheck2">Disabled reverse radio</label>
                </div>

                <div className="flex flex-row-reverse items-center gap-2">
                  <input type="checkbox" id="switchCheckReverse" className="form-switch" defaultChecked />
                  <label htmlFor="switchCheckReverse">Reverse switch checkbox input</label>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Colored Radios</label>
              </div>

              <div className="col-span-1 flex flex-wrap gap-9 lg:col-span-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkPrimary" className="form-radio rounded-full! checked:bg-primary!" defaultChecked />
                    <label htmlFor="checkPrimary">Primary</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkSecondary" className="form-radio rounded-full! checked:bg-secondary!" defaultChecked />
                    <label htmlFor="checkSecondary">Secondary</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkSuccess" className="form-radio rounded-full! checked:bg-success!" defaultChecked />
                    <label htmlFor="checkSuccess">Success</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkInfo" className="form-radio rounded-full! checked:bg-info!" defaultChecked />
                    <label htmlFor="checkInfo">Info</label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkWarning" className="form-radio rounded-full! checked:bg-warning!" defaultChecked />
                    <label htmlFor="checkWarning">Warning</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkDanger" className="form-radio rounded-full! checked:bg-danger!" defaultChecked />
                    <label htmlFor="checkDanger">Danger</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="checkDark" className="form-radio rounded-full! checked:bg-dark!" defaultChecked />
                    <label htmlFor="checkDark">Dark</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Checkbox Toggle</label>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <div>
                  <input type="checkbox" id="toggleSingle" className="peer hidden" />
                  <label htmlFor="toggleSingle" className="btn border-primary text-primary peer-checked:bg-primary peer-checked:text-white">
                    Single Toggle
                  </label>
                </div>

                <div className="flex">
                  <div>
                    <input type="checkbox" id="toggle1" className="peer hidden" />
                    <label htmlFor="toggle1" className="btn rounded-e-none border-primary text-primary peer-checked:bg-primary peer-checked:text-white">
                      One
                    </label>
                  </div>
                  <div>
                    <input type="checkbox" id="toggle2" className="peer hidden" />
                    <label htmlFor="toggle2" className="btn rounded-none border-x-0 border-primary text-primary peer-checked:bg-primary peer-checked:text-white">
                      Two
                    </label>
                  </div>
                  <div>
                    <input type="checkbox" id="toggle3" className="peer hidden" />
                    <label htmlFor="toggle3" className="btn rounded-s-none border-primary text-primary peer-checked:bg-primary peer-checked:text-white">
                      Three
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Radio Toggle</label>
              </div>

              <div className="col-span-1 flex lg:col-span-2">
                <div>
                  <input type="radio" name="radiotoggle" id="radioLeft" className="peer hidden" defaultChecked />
                  <label htmlFor="radioLeft" className="btn rounded-e-none border-secondary text-secondary peer-checked:bg-secondary peer-checked:text-white">
                    Left
                  </label>
                </div>

                <div>
                  <input type="radio" name="radiotoggle" id="radioMiddle" className="peer hidden" />
                  <label htmlFor="radioMiddle" className="btn rounded-none border-x-0 border-secondary text-secondary peer-checked:bg-secondary peer-checked:text-white">
                    Middle
                  </label>
                </div>

                <div>
                  <input type="radio" name="radiotoggle" id="radioRight" className="peer hidden" />
                  <label htmlFor="radioRight" className="btn rounded-s-none border-secondary text-secondary peer-checked:bg-secondary peer-checked:text-white">
                    Right
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChecksRadioSwitches
