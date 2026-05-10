import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Create Invoice" subtitle="Apps" />

      <div className="lg:w-10/12 w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-base">
          <div className="col-span-1 lg:col-span-3">
            <div className="card">
              <div className="card-body p-7.5">
                <div className="mb-7.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="border-default-300 relative flex h-15 w-65 items-center justify-between rounded border px-2 text-center">
                    <label htmlFor="invoiceLogo" className="absolute inset-0 flex cursor-pointer items-center justify-between px-2">
                      <img src={logoBlack} className="h-7 flex dark:hidden print:flex" alt="dark logo" />
                      <img src={logo} className="h-7 hidden dark:flex print:hidden" alt="dark logo" />
                      <Icon icon="cloud-upload" className="text-default-400 text-xl" />
                    </label>
                    <input type="file" id="invoiceLogo" accept="image/*" className="hidden" />
                  </div>

                  <div className="text-end">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-col">
                        <label htmlFor="invoiceNumber" className="mb-2 text-sm font-semibold">
                          Invoice #
                        </label>
                        <input type="text" id="invoiceNumber" className="form-input w-40" placeholder="e.g. INV-0001" />
                      </div>

                      <div className="flex flex-col">
                        <label htmlFor="currency" className="mb-2 text-sm font-semibold">
                          Currency
                        </label>
                        <select id="currency" className="form-select">
                          <option value="USD" defaultChecked>
                            USD ($)
                          </option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="INR">INR (₹)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="AUD">AUD (A$)</option>
                          <option value="CAD">CAD (C$)</option>
                          <option value="CNY">CNY (¥)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
                  <div>
                    <label htmlFor="invoiceDate" className="mb-2">
                      Invoice Date
                    </label>
                    <Flatpickr type="text" id="invoiceDate" className="form-input bg-transparent!" options={{ dateFormat: 'Y-m-d', defaultDate: new Date() }} placeholder="Select Date" readOnly />
                  </div>
                  <div>
                    <label htmlFor="dueDate" className="mb-2">
                      Due Date
                    </label>
                    <Flatpickr type="text" id="dueDate" className="form-input bg-transparent!" options={{ dateFormat: 'Y-m-d', defaultDate: new Date() }} readOnly />
                  </div>
                  <div>
                    <label htmlFor="paymentMethod" className="mb-2">
                      Payment Method
                    </label>
                    <select id="paymentMethod" className="form-input">
                      <option>Select</option>
                      <option>Credit / Debit Card</option>
                      <option>Bank Transfer</option>
                      <option>PayPal</option>
                      <option>UPI (GPay)</option>
                      <option>Cash</option>
                    </select>
                  </div>
                </div>
                <div className="mt-7.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
                    <div>
                      <label className="form-label">Billing Address</label>
                      <input type="text" className="form-input mb-3" placeholder="Name" />
                      <textarea rows={3} className="form-textarea mb-3" placeholder="Address" />
                      <div className="input-group flex">
                        <select className="form-select" style={{ maxWidth: 120 }} defaultValue={44}>
                          <option value={+1}>+1 (US)</option>
                          <option value={+44}>+44 (UK)</option>
                          <option value={+91}>+91 (IN)</option>
                          <option value={+61}>+61 (AU)</option>
                          <option value={+971}>+971 (UAE)</option>
                        </select>
                        <input type="text" className="form-input" placeholder="Phone Number" />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Shipping Address</label>
                      <input type="text" className="form-input mb-3" placeholder="Name" />
                      <textarea rows={3} className="form-textarea mb-3" placeholder="Address" />
                      <div className="input-group flex">
                        <select className="form-select" style={{ maxWidth: 120 }} defaultValue={+44}>
                          <option value={+1}>+1 (US)</option>
                          <option value={+44}>+44 (UK)</option>
                          <option value={+91}>+91 (IN)</option>
                          <option value={+61}>+61 (AU)</option>
                          <option value={+971}>+971 (UAE)</option>
                        </select>
                        <input type="text" className="form-input" placeholder="Phone Number" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-7.5 table-wrapper">
                  <table className="table mb-4 min-w-full text-center align-middle">
                    <thead className="bg-light/25 text-2xs tracking-wider uppercase">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2 text-left">Item Description</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2">Unit Price</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody id="invoice-items">
                      <tr>
                        <td className="px-2.25 py-3">1</td>
                        <td className="px-2.25 py-3">
                          <input type="text" className="form-input" placeholder="Description" />
                        </td>
                        <td className="px-2.25 py-3">
                          <input type="number" className="form-input" placeholder="1" />
                        </td>
                        <td className="px-2.25 py-3">
                          <input type="number" className="form-input" placeholder="0.00" />
                        </td>
                        <td className="px-2.25 py-3">
                          <input type="number" className="form-input" placeholder="0.00" />
                        </td>
                        <td className="px-2.25 py-3">
                          <button type="button" className="btn btn-icon bg-danger size-7.5 text-white hover:bg-danger-hover">
                            ×
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button type="button" className="btn bg-primary mt-3 text-white hover:bg-primary-hover">
                    <Icon icon="plus" />
                    Add Item
                  </button>
                </div>
                <div className="mt-7.5 flex justify-end">
                  <div className="md:w-1/3">
                    <div className="table-wrapper">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td className="text-end">Subtotal</td>
                            <td>
                              <input type="number" id="subtotal" placeholder="0.00" className="form-input" />
                            </td>
                          </tr>
                          <tr>
                            <td className="text-end">Tax (%)</td>
                            <td>
                              <input type="number" id="tax" placeholder="0.00" className="form-input" />
                            </td>
                          </tr>
                          <tr>
                            <td className="text-end">Discount</td>
                            <td>
                              <input type="number" id="discount" placeholder="0.00" className="form-input" />
                            </td>
                          </tr>
                          <tr className="font-bold">
                            <td className="text-end">Total</td>
                            <td>
                              <input type="number" id="total" placeholder="0.00" readOnly className="form-input bg-transparent!" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-7.5">
                  <label htmlFor="invoiceNote" className="mb-2">
                    Additional Notes
                  </label>
                  <textarea id="invoiceNote" className="form-textarea" rows={3} placeholder="e.g. Thank you for your business!" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-1">
            <div className="sticky top-25">
              <div className="card">
                <div className="card-body">
                  <div className="flex flex-col justify-center gap-2.5">
                    <a href="" className="btn bg-light hover:text-primary">
                      <Icon icon="eye" /> Preview
                    </a>
                    <a href="" className="btn bg-light hover:text-primary">
                      <Icon icon="download" /> Download
                    </a>
                    <a href="" className="btn btn-lg bg-danger text-white hover:bg-danger-hover">
                      <Icon icon="send-2" /> Send
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
