import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { settingStepsData } from './data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Shop Settings" subtitle="Ecommerce" />
      <div className="card">
        <div className="card-body">
          <div data-hs-stepper>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-base">
              <div data-hs-stepper='{"mode": "non-linear"}'>
                <ul className="relative flex flex-col gap-1.5">
                  {settingStepsData.map((step, idx) => (
                    <li className="group" data-hs-stepper-nav-item={`{"index": ${idx + 1}}`} key={idx}>
                      <span className="group inline-flex w-full">
                        <span className="hs-stepper-active:bg-light/50 hs-stepper-success:border-s-3 hs-stepper-success:border-success hs-stepper-success:bg-success/10 hs-stepper-success:text-success w-full rounded-md">
                          <button
                            type="button"
                            className="active block w-full rounded px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
                            id={`shopStep${step.title.slice(0, 1)}`}
                            aria-selected="true"
                            data-hs-tab={`#shopStep-${step.title.slice(0, 1)}`}
                            aria-controls={`shopStep-${step.title.slice(0, 1)}`}
                            role="tab"
                          >
                            <span className="flex items-center">
                              <div className="avatar-md">
                                <span className="btn btn-icon size-9 bg-light rounded hs-stepper-success:bg-success/10">
                                  <Icon icon={step.icon} className="text-2xl" />
                                </span>
                              </div>
                              <span className="ms-2.5">
                                <span className="block text-start font-semibold mb-0.5">{step.title}</span>
                                <span className="text-default-400 hs-stepper-success:text-success block text-start text-xs font-semibold">{step.subtitle}</span>
                              </span>
                            </span>
                          </button>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <div className="md:p-7.5 p-4.5 border border-default-300 border-dashed">
                  <div data-hs-stepper-content-item='{"index": 1}'>
                    <div className="col-span-1 mb-5 grid lg:grid-cols-2 gap-base">
                      <div>
                        <label className="form-label">Shop Name</label>
                        <input type="text" className="form-input" placeholder="e.g., Vona Store" required />
                      </div>
                      <div>
                        <label className="form-label">Support Email</label>
                        <input type="email" className="form-input" placeholder="support@vona.com" required />
                      </div>
                      <div>
                        <label className="form-label">Phone</label>
                        <input type="tel" className="form-input" placeholder="+1 234 567 8901" />
                      </div>
                      <div>
                        <label className="form-label">Business Hours</label>
                        <input type="text" className="form-input" placeholder="Mon-Fri, 9 AM - 6 PM" />
                      </div>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 2}' style={{ display: 'none' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base mb-base">
                      <div>
                        <label className="mb-2 block">Business Name</label>
                        <input type="text" className="form-input" placeholder="e.g., Acme Retail LLC" />
                      </div>
                      <div>
                        <label className="mb-2 block">Registration Number</label>
                        <input type="text" className="form-input" placeholder="e.g., 123456789" />
                      </div>
                      <div className="col-span-1 lg:col-span-2">
                        <label className="mb-2 block">Business Address</label>
                        <textarea className="form-textarea" rows={2} placeholder="123 Main Street, City, Country" defaultValue={''} />
                      </div>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 3}' style={{ display: 'none' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base mb-base">
                      <div>
                        <label className="form-label">Logo Upload</label>
                        <input type="file" name="file-input" className="form-input" />
                      </div>
                      <div>
                        <label className="form-label">Favicon</label>
                        <input type="file" name="file-input" className="form-input" />
                      </div>
                      <div>
                        <label className="form-label">Primary Color</label>
                        <input type="color" className="form-input" defaultValue="#4f46e5" />
                      </div>
                      <div>
                        <label className="form-label">Accent Color</label>
                        <input type="color" className="form-input" defaultValue="#22c55e" />
                      </div>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 4}' style={{ display: 'none' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base mb-base">
                      <div className="col-span-1">
                        <label className="form-label">Default Currency</label>
                        <select className="form-select">
                          <option>USD</option>
                          <option>EUR</option>
                          <option>GBP</option>
                          <option>INR</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="form-label">Tax Rate (%)</label>
                        <input type="number" className="form-input" placeholder="e.g., 7.5" />
                      </div>
                      <div className="col-span-1 lg:col-span-2">
                        <div className="flex items-center gap-1.5">
                          <input className="form-switch" type="checkbox" defaultChecked />
                          <label className="form-check-label">Enable Auto Tax Calculation</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 5}' style={{ display: 'none' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base mb-base">
                      <div className="col-span-1">
                        <label className="form-label">Default Origin</label>
                        <input type="text" className="form-input" placeholder="California, USA" />
                      </div>
                      <div className="col-span-1">
                        <label className="form-label">Free Shipping Threshold</label>
                        <input type="number" className="form-input" placeholder="e.g., 100" />
                      </div>
                      <div className="col-span-1 lg:col-span-2">
                        <label className="form-label">Available Methods</label>
                        <select className="form-input h-auto!" multiple>
                          <option>Standard Delivery</option>
                          <option>Express</option>
                          <option>Pickup</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 6}' style={{ display: 'none' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-base mb-base">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <input className="form-switch" type="checkbox" defaultChecked />
                          <label className="form-check-label">Enable Stripe</label>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <input className="form-switch" type="checkbox" />
                          <label className="form-check-label">Enable PayPal</label>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block">Stripe Key</label>
                        <input type="text" className="form-input" placeholder="pk_live_..." />
                      </div>
                      <div>
                        <label className="mb-2 block">PayPal Client ID</label>
                        <input type="text" className="form-input" placeholder="e.g., Abcd1234" />
                      </div>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 7}' style={{ display: 'none' }}>
                    <div className="mb-5 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" defaultChecked />
                      <label className="form-check-label">Enable Order Emails</label>
                    </div>
                    <div className="mb-5 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" />
                      <label className="form-check-label">Enable Low Stock Alerts</label>
                    </div>
                    <div className="mb-5 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" />
                      <label className="form-check-label">Enable SMS Notifications</label>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 8}' style={{ display: 'none' }}>
                    <div className="mb-5">
                      <label className="mb-2 block">Invoice Prefix</label>
                      <input type="text" className="form-input" placeholder="INV-" />
                    </div>
                    <div className="mb-5 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" defaultChecked />
                      <label className="form-check-label">Include Tax Breakdown</label>
                    </div>
                    <div className="mb-5 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" />
                      <label className="form-check-label">Enable PDF Download</label>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 9}' style={{ display: 'none' }}>
                    <div className="mb-5">
                      <label className="form-label">Meta Title</label>
                      <input type="text" className="form-input" placeholder="Your Shop Title" />
                    </div>
                    <div className="mb-5">
                      <label className="form-label">Meta Description</label>
                      <textarea className="form-textarea" rows={2} placeholder="Brief description for SEO" defaultValue={''} />
                    </div>
                    <div className="mb-5">
                      <label className="form-label">Privacy Policy URL</label>
                      <input type="url" className="form-input" placeholder="https://example.com/privacy" />
                    </div>
                    <div className="mb-5">
                      <label className="form-label">Terms &amp; Conditions URL</label>
                      <input type="url" className="form-input" placeholder="https://example.com/terms" />
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 10}' style={{ display: 'none' }}>
                    <div className="mb-5">
                      <label className="form-label">Google Analytics ID</label>
                      <input type="text" className="form-input" placeholder="UA-XXXXX-Y" />
                    </div>
                    <div className="mb-5">
                      <label className="form-label">Facebook Pixel ID</label>
                      <input type="text" className="form-input" placeholder="1234567890" />
                    </div>
                    <div className="mb-5">
                      <label className="form-label">Mailchimp API Key</label>
                      <input type="text" className="form-input" placeholder="key-xxxxx" />
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 11}' style={{ display: 'none' }}>
                    <div className="mb-3">
                      <button className="btn border-primary text-primary w-full">Create Manual Backup</button>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Restore from File</label>
                      <input type="file" name="file-input" className="form-input" />
                    </div>
                    <div className="mb-3 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" />
                      <label className="form-check-label">Enable Auto Backups (Weekly)</label>
                    </div>
                  </div>
                  <div data-hs-stepper-content-item='{"index": 12}' style={{ display: 'none' }}>
                    <div className="mb-5 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" id="enable-maintenance-mode" />
                      <label className="form-check-label" htmlFor="enable-maintenance-mode">
                        Enable Maintenance Mode
                      </label>
                    </div>
                    <div className="mb-5 flex items-center gap-1.5">
                      <input className="form-switch" type="checkbox" />
                      <label className="form-check-label">Debug Mode</label>
                    </div>
                    <div>
                      <label className="form-label">Custom Script (Footer)</label>
                      <textarea className="form-textarea" rows={3} placeholder="Paste custom JavaScript here" />
                    </div>
                  </div>
                  <div className="mt-10 flex flex-wrap items-center justify-between">
                    <button type="button" className="btn bg-secondary text-white hover:bg-secondary-hover" data-hs-stepper-back-btn>
                      <Icon icon="arrow-left"></Icon>
                      Back
                    </button>
                    <button type="button" className="btn bg-primary text-white hover:bg-primary-hover" data-hs-stepper-next-btn>
                      Next
                      <Icon icon="arrow-right"></Icon>
                    </button>
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
