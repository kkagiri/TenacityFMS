import logoSm from '@/assets/images/logo-sm.png'
import stockImg from '@/assets/images/stock/small-2.jpg'
import Swal, { SweetAlertOptions } from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const ReactSwal = withReactContent(Swal)

const showAlert = (options: SweetAlertOptions) => {
  ReactSwal.fire({
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn bg-primary text-white hover:bg-primary-hover mt-2',
      cancelButton: 'btn bg-danger text-white hover:bg-danger-hover mt-2',
    },
    ...options,
  })
}

function basicAlert() {
  showAlert({
    title: 'Simple Alert',
    text: 'This is a basic SweetAlert dialog.',
  })
}
function alertWithTitle() {
  showAlert({
    title: 'Notice',
    text: 'This is a titled alert with additional details.',
    icon: 'question',
    showCloseButton: true,
  })
}
function htmlAlert() {
  showAlert({
    title: '<i>HTML</i> <u>Alert</u>',
    html: 'Use <b>bold</b>, <a href="">links</a>, and other HTML here.',
    icon: 'info',
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText:
      '<svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="me-1 align-middle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" /></svg> Like it!',
    cancelButtonText:
      '<svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 21.008a3 3 0 0 0 2.995 -2.823l.005 -.177v-4h2a3 3 0 0 0 2.98 -2.65l.015 -.173l.005 -.177l-.02 -.196l-1.006 -5.032c-.381 -1.625 -1.502 -2.796 -2.81 -2.78l-.164 .008h-8a1 1 0 0 0 -.993 .884l-.007 .116l.001 9.536a1 1 0 0 0 .5 .866a2.998 2.998 0 0 1 1.492 2.396l.007 .202v1a3 3 0 0 0 3 3z" /><path d="M5 14.008a1 1 0 0 0 .993 -.883l.007 -.117v-9a1 1 0 0 0 -.883 -.993l-.117 -.007h-1a2 2 0 0 0 -1.995 1.852l-.005 .15v7a2 2 0 0 0 1.85 1.994l.15 .005h1z" /></svg>',
    customClass: {
      confirmButton: 'btn bg-success text-white hover:bg-success-hover me-2 flex! items-center',
      cancelButton: 'btn bg-danger text-white hover:bg-danger-hover',
    },
  })
}
function infoAlert() {
  showAlert({
    text: 'This is an informational message to keep you updated.',
    icon: 'info',
    confirmButtonText: 'Understood',
    customClass: { confirmButton: 'btn bg-info text-white hover:bg-info-hover' },
  })
}
function warningAlert() {
  showAlert({
    text: 'Heads up! Something might require your attention.',
    icon: 'warning',
    confirmButtonText: 'Got it',
    customClass: { confirmButton: 'btn bg-warning text-white hover:bg-warning-hover' },
  })
}
function dangerAlert() {
  showAlert({
    text: 'An unexpected error occurred. Please try again.',
    icon: 'error',
    confirmButtonText: 'Dismiss',
    customClass: { confirmButton: 'btn bg-danger text-white hover:bg-danger-hover' },
  })
}
function successAlert() {
  showAlert({
    text: 'Action completed successfully!',
    icon: 'success',
    confirmButtonText: 'Great!',
    customClass: { confirmButton: 'btn bg-success text-white hover:bg-success-hover' },
  })
}
function questionAlert() {
  showAlert({
    text: 'Do you need more information about this feature?',
    icon: 'question',
    confirmButtonText: 'Yes, please',
  })
}
function longContent() {
  showAlert({
    imageUrl: 'https://placehold.co/300x1000/1ab394/white',
    imageHeight: 1000,
    imageAlt: 'Very tall content image',
    showCloseButton: true,
    customClass: { confirmButton: 'btn bg-secondary text-white hover:bg-secondary-hover mt-2' },
  })
}
function confirmButton() {
  if (!Swal) return
  Swal.fire({
    title: 'Confirm Deletion',
    text: 'Are you sure you want to delete this item?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    showCloseButton: true,
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn bg-primary text-white hover:bg-primary-hover me-2 mt-2',
      cancelButton: 'btn bg-danger text-white hover:bg-danger-hover mt-2',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      showAlert({
        title: 'Deleted!',
        text: 'Your item has been successfully removed.',
        icon: 'success',
      })
    }
  })
}
function cancelButton() {
  if (!Swal) return
  Swal.fire({
    title: 'Delete File?',
    text: 'This action cannot be undone!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    showCloseButton: true,
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn bg-primary text-white hover:bg-primary-hover mt-2 me-2',
      cancelButton: 'btn bg-danger text-white hover:bg-danger-hover mt-2',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      showAlert({
        title: 'Deleted!',
        text: 'The file has been deleted.',
        icon: 'success',
      })
    } else if (result.dismiss === Swal?.DismissReason.cancel) {
      showAlert({
        title: 'Action Cancelled',
        text: 'Your file is safe.',
        icon: 'error',
      })
    }
  })
}
function withImageAlert() {
  showAlert({
    title: 'Custom Branding',
    text: 'This alert includes a logo.',
    imageUrl: logoSm,
    imageHeight: 40,
    showCloseButton: true,
  })
}
function autoClose() {
  showAlert({
    title: 'Auto Dismiss',
    html: 'Closing in <b></b> seconds...',
    timer: 2000,
    timerProgressBar: true,
    showCloseButton: true,
  })
}
function positionAlert(position: SweetAlertOptions['position']) {
  showAlert({
    icon: 'success',
    text: 'Saved successfully!',
    showConfirmButton: false,
    timer: 1500,
    position: position,
  })
}
function customAlert() {
  showAlert({
    title: '<h2 class="text-white">Custom Design.</h2>',
    html: '<p class="text-white">This alert has custom size, padding, and background.</p>',
    width: 600,
    padding: '100px',
    color: '#fff',
    background: `url(${stockImg}) no-repeat center`,
  })
}
function ajaxAlert() {
  if (!Swal) return
  Swal.fire({
    title: '<h4>Enter Your Email</h4>',
    input: 'email',
    inputPlaceholder: 'Enter your email address',
    showCancelButton: true,
    confirmButtonText: 'Submit',
    showLoaderOnConfirm: true,
    showCloseButton: true,
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn bg-primary text-white hover:bg-primary-hover me-2',
      cancelButton: 'btn bg-danger text-white hover:bg-danger-hover',
    },
    preConfirm: (email) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (email === 'taken@example.com') {
            reject('This email is already registered.')
          } else {
            resolve(email)
          }
        }, 1500)
      })
    },
    allowOutsideClick: false,
  }).then((result) => {
    if (result.isConfirmed) {
      Swal?.fire({
        icon: 'success',
        title: 'Submitted!',
        html: `Your email: ${result.value}`,
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-primary',
        },
      })
    }
  })
}

const SweetAlerts = () => {
  return (
    <div className="grid xl:grid-cols-1 gap-base">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Examples</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive-sm">
            <table className="table">
              <tbody>
                <tr>
                  <td>
                    <h5 className="mb-1.25">Basic</h5>
                    <p className="text-default-400">Displays a simple SweetAlert popup.</p>
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={basicAlert}>
                      Click me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">Title</h5>
                    <p className="text-default-400">A popup with a title and supporting text.</p>
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={alertWithTitle}>
                      Click Me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">HTML</h5>
                    <p className="text-default-400">Shows a popup with custom HTML content.</p>
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={htmlAlert}>
                      Toggle HTML SweetAlert
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">All States</h5>
                    <p className="text-default-400">Examples of SweetAlert in different alert states.</p>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" id="sweetalert-info" className="btn btn-sm bg-info text-white" onClick={infoAlert}>
                        Toggle Info
                      </button>
                      <button type="button" id="sweetalert-warning" className="btn btn-sm bg-warning text-white" onClick={warningAlert}>
                        Toggle Warning
                      </button>
                      <button type="button" id="sweetalert-error" className="btn btn-sm bg-danger text-white hover:bg-danger-hover" onClick={dangerAlert}>
                        Toggle Error
                      </button>
                      <button type="button" id="sweetalert-success" className="btn btn-sm bg-success text-white" onClick={successAlert}>
                        Toggle Success
                      </button>
                      <button type="button" id="sweetalert-question" className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={questionAlert}>
                        Toggle Question
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">Long Content</h5>
                    <p className="text-default-400">A popup with extended content for demonstration.</p>
                  </td>
                  <td>
                    <button type="button" id="sweetalert-longcontent" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover" onClick={longContent}>
                      Click Me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">With Confirm Button</h5>
                    <p className="text-default-400">A confirmation dialog with an attached action.</p>
                  </td>
                  <td>
                    <button type="button" id="sweetalert-confirm-button" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover" onClick={confirmButton}>
                      Click Me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">With Cancel Button</h5>
                    <p className="text-default-400">Includes cancel and confirm options with different actions.</p>
                  </td>
                  <td>
                    <button type="button" id="sweetalert-params" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover" onClick={cancelButton}>
                      Click Me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">With Image Header (Logo)</h5>
                    <p className="text-default-400">Custom popup with a logo or image header.</p>
                  </td>
                  <td>
                    <button type="button" id="sweetalert-image" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover" onClick={withImageAlert}>
                      Click Me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">Auto Close</h5>
                    <p className="text-default-400">Displays a popup that closes automatically after a timeout.</p>
                  </td>
                  <td>
                    <button type="button" id="sweetalert-close" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover" onClick={autoClose}>
                      Click Me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">Position</h5>
                    <p className="text-default-400">Shows the alert in different screen positions.</p>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-3">
                      <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => positionAlert('top-start')}>
                        Top Start
                      </button>
                      <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => positionAlert('top-end')}>
                        Top End
                      </button>
                      <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => positionAlert('bottom-start')}>
                        Bottom Start
                      </button>
                      <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => positionAlert('bottom-end')}>
                        Bottom End
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">With Custom Padding, Background</h5>
                    <p className="text-default-400">Popup with custom dimensions, padding, and background style.</p>
                  </td>
                  <td>
                    <button type="button" id="custom-padding-width-alert" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover" onClick={customAlert}>
                      Click Me
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h5 className="mb-1.25">Ajax Request</h5>
                    <p className="text-default-400">Demonstrates an alert with an Ajax request.</p>
                  </td>
                  <td>
                    <button type="button" id="ajax-alert" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover" onClick={ajaxAlert}>
                      Click Me
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SweetAlerts
