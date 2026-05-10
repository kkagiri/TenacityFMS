import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'
import qr from '@/assets/images/qr.png'
import sign from '@/assets/images/sign.png'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Invoice Details" subtitle="Apps" />

      <div className="lg:w-10/12 w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-base">
          <div className="col-span-1 lg:col-span-3">
            <div className="card">
              <div className="card-body px-7.5">
                <div className="border-default-300 mb-5 flex items-center justify-between border-b pb-5">
                  <Link to="/" className="logo-dark">
                    <img src={logoBlack} className="h-6.5 flex dark:hidden print:flex" alt="dark logo" />
                    <img src={logo} className="h-6.5 hidden dark:flex print:hidden" alt="dark logo" />
                  </Link>
                  <div className="text-end">
                    <span className="badge px-3 py-1.5 bg-warning/15 text-warning text-xs mb-2.5">Pending</span>
                    <h4 className="text-dark text-lg font-bold">Invoice #INS-0120001</h4>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                  <div>
                    <h6 className="text-2xs text-default-400 mb-2.5 uppercase">From</h6>
                    <p className="mb-1.25 font-semibold">Alina Thompson</p>
                    <p className="text-default-400 mb-1.25">
                      88 Crescent Ave,
                      <br />
                      Boston, MA - 02125
                    </p>
                    <p className="text-default-400">Phone: 617-452-0099</p>
                    <div className="mt-7.5">
                      <h6 className="text-2xs text-default-400 uppercase mb-2">Invoice Date</h6>
                      <p className="font-medium">20 Apr 2025</p>
                    </div>
                  </div>
                  <div>
                    <h6 className="text-2xs text-default-400 mb-2.5 uppercase">To</h6>
                    <p className="mb-1.25 font-semibold">Daniel Moore</p>
                    <p className="text-default-400 mb-1.25">
                      790 Westwood Blvd,
                      <br />
                      Los Angeles, CA - 90024
                    </p>
                    <p className="text-default-400">Phone: 310-555-1022</p>
                    <div className="mt-7.5">
                      <h6 className="text-2xs text-default-400 uppercase mb-2">Due Date</h6>
                      <p className="font-medium">05 May 2025</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <img src={qr} alt="Barcode" className="size-20" style={{ maxHeight: 80 }} />
                  </div>
                </div>
                <div className="mt-7.5 mb-4 table-wrapper">
                  <table className="table table-bordered text-center align-middle text-sm">
                    <thead className="bg-light/25 thead-sm text-xs text-center uppercase">
                      <tr>
                        <th className="text-center w-12">#</th>
                        <th>Product Details</th>
                        <th className="text-center">Qty</th>
                        <th className="text-center">Unit Price</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>01</td>
                        <td className="text-start">
                          <div className="flex items-center gap-2">
                            <div>
                              <strong className="block font-medium">Figma Design System</strong>
                              <div className="text-default-400 text-2xs">(Desktop &amp; Mobile UI Kit)</div>
                            </div>
                          </div>
                        </td>
                        <td>1</td>
                        <td>$350.00</td>
                        <td className="text-end">$350.00</td>
                      </tr>
                      <tr>
                        <td>02</td>
                        <td className="text-start">
                          <div className="flex items-center gap-2">
                            <div>
                              <strong className="block font-medium">Node.js API Development</strong>
                              <div className="text-default-400 text-2xs">(User auth, dashboard APIs)</div>
                            </div>
                          </div>
                        </td>
                        <td>12</td>
                        <td>$50.00</td>
                        <td className="text-end">$600.00</td>
                      </tr>
                      <tr>
                        <td>03</td>
                        <td className="text-start">
                          <div className="flex items-center gap-2">
                            <div>
                              <strong className="block font-medium">Admin UI Setup</strong>
                              <div className="text-default-400 text-2xs">(Homepage, blog layout)</div>
                            </div>
                          </div>
                        </td>
                        <td>1</td>
                        <td>$220.00</td>
                        <td className="text-end">$220.00</td>
                      </tr>
                      <tr>
                        <td>04</td>
                        <td className="text-start">
                          <div className="flex items-center gap-2">
                            <div>
                              <strong className="block font-medium">Firebase Setup</strong>
                              <div className="text-default-400 text-2xs">(Hosting &amp; config)</div>
                            </div>
                          </div>
                        </td>
                        <td>1</td>
                        <td>$100.00</td>
                        <td className="text-end">$100.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mb-4 flex justify-end">
                  <table className="table table-borderless text-end">
                    <tbody className="text-sm">
                      <tr>
                        <td className="font-medium">Subtotal</td>
                        <td>$1,270.00</td>
                      </tr>
                      <tr>
                        <td className="font-medium">Shipping</td>
                        <td>Free</td>
                      </tr>
                      <tr>
                        <td className="font-medium">Discount (5%)</td>
                        <td className="text-danger px-2.25 py-3">- $63.50</td>
                      </tr>
                      <tr>
                        <td className="font-medium">Tax (7%)</td>
                        <td>$84.42</td>
                      </tr>
                      <tr>
                        <td className="border-t border-default-300">Total</td>
                        <td className="border-t border-default-300">$1,290.92</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-light/50 mt-3 rounded px-6 py-3 lg:mt-7.5">
                  <p className="text-default-400">
                    <strong>Note:</strong> Please make payment within 10 days. For any billing inquiries, contact
                    <a href="mailto:billing@alinadesignco.com" className="text-primary font-medium">
                      &nbsp; billing@alinadesignco.com
                    </a>
                    .
                  </p>
                </div>
                <div className="mt-7.5">
                  <p className="mb-5 font-semibold">Thank you for your business!</p>
                  <img src={sign} alt="sign" className="h-10.5" />
                  <p className="text-default-400 text-2xs mb-4 italic">Authorized Signature</p>
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
                      <Icon icon="pencil" /> Edit
                    </a>
                    <a href="javascript:window.print()" className="btn bg-primary text-white hover:bg-primary-hover">
                      <Icon icon="printer" /> Print
                    </a>
                    <a href="" className="btn bg-info text-white hover:bg-info-hover">
                      <Icon icon="download" /> Download
                    </a>
                    <a href="" className="btn bg-danger btn-lg text-lg text-white hover:bg-danger-hover">
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
