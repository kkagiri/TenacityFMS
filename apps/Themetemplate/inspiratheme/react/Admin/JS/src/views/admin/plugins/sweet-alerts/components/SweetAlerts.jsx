import logoSm from '@/assets/images/logo-sm.png'
import stockImg from '@/assets/images/stock/small-2.jpg'
import { Button, Card, CardBody, CardHeader, CardTitle, Table } from 'react-bootstrap'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const ReactSwal = withReactContent(Swal)
const showAlert = (options) => {
  ReactSwal.fire({
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn btn-primary mt-2',
    },
    ...options,
  })
}
const SweetAlerts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Examples</CardTitle>
      </CardHeader>

      <CardBody>
        <Table responsive className="mb-0">
          <tbody>
            <tr>
              <td>
                <h5 className="mb-1">Basic</h5>
                <p className="text-muted mb-0">Displays a simple SweetAlert popup.</p>
              </td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    showAlert({
                      title: 'Simple Alert',
                      text: 'This is a basic SweetAlert dialog.',
                    })
                  }
                >
                  Click me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">Title</h5>
                <p className="text-muted mb-0">A popup with a title and supporting text.</p>
              </td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    showAlert({
                      title: 'Notice',
                      text: 'This is a titled alert with additional details.',
                      icon: 'question',
                      showCloseButton: true,
                    })
                  }
                >
                  Click Me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">HTML</h5>
                <p className="text-muted mb-0">Shows a popup with custom HTML content.</p>
              </td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    showAlert({
                      title: '<i>HTML</i> <u>Alert</u>',
                      html: 'Use <b>bold</b>, <Link to="">links</Link>, and other HTML here.',
                      icon: 'info',
                      showCloseButton: true,
                      showCancelButton: true,
                      confirmButtonText:
                        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1 align-middle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" /></svg> Like it!',
                      cancelButtonText:
                        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 21.008a3 3 0 0 0 2.995 -2.823l.005 -.177v-4h2a3 3 0 0 0 2.98 -2.65l.015 -.173l.005 -.177l-.02 -.196l-1.006 -5.032c-.381 -1.625 -1.502 -2.796 -2.81 -2.78l-.164 .008h-8a1 1 0 0 0 -.993 .884l-.007 .116l.001 9.536a1 1 0 0 0 .5 .866a2.998 2.998 0 0 1 1.492 2.396l.007 .202v1a3 3 0 0 0 3 3z" /><path d="M5 14.008a1 1 0 0 0 .993 -.883l.007 -.117v-9a1 1 0 0 0 -.883 -.993l-.117 -.007h-1a2 2 0 0 0 -1.995 1.852l-.005 .15v7a2 2 0 0 0 1.85 1.994l.15 .005h1z" /></svg>',
                      customClass: {
                        confirmButton: 'btn btn-success me-2',
                        cancelButton: 'btn btn-danger',
                      },
                    })
                  }
                >
                  Toggle HTML SweetAlert
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">All States</h5>
                <p className="text-muted mb-0">Examples of SweetAlert in different alert states.</p>
              </td>
              <td>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() =>
                      showAlert({
                        text: 'This is an informational message to keep you updated.',
                        icon: 'info',
                        confirmButtonText: 'Understood',
                        customClass: {
                          confirmButton: 'btn btn-info',
                        },
                      })
                    }
                  >
                    Toggle Info
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() =>
                      showAlert({
                        text: 'Heads up! Something might require your attention.',
                        icon: 'warning',
                        confirmButtonText: 'Got it',
                        customClass: {
                          confirmButton: 'btn btn-warning',
                        },
                      })
                    }
                  >
                    Toggle Warning
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      showAlert({
                        text: 'An unexpected error occurred. Please try again.',
                        icon: 'error',
                        confirmButtonText: 'Dismiss',
                        customClass: {
                          confirmButton: 'btn btn-danger',
                        },
                      })
                    }
                  >
                    Toggle Error
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() =>
                      showAlert({
                        text: 'Action completed successfully!',
                        icon: 'success',
                        confirmButtonText: 'Great!',
                        customClass: {
                          confirmButton: 'btn btn-success',
                        },
                      })
                    }
                  >
                    Toggle Success
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      showAlert({
                        text: 'Do you need more information about this feature?',
                        icon: 'question',
                        confirmButtonText: 'Yes, please',
                      })
                    }
                  >
                    Toggle Question
                  </Button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">Long Content</h5>
                <p className="text-muted mb-0">A popup with extended content for demonstration.</p>
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showAlert({
                      imageUrl: 'https://placehold.co/300x1000/1ab394/white',
                      imageHeight: 1000,
                      imageAlt: 'Very tall content image',
                      showCloseButton: true,
                      customClass: {
                        confirmButton: 'btn btn-secondary mt-2',
                      },
                    })
                  }
                >
                  Click Me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">With Confirm Button</h5>
                <p className="text-muted mb-0">A confirmation dialog with an attached action.</p>
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    ReactSwal.fire({
                      title: 'Confirm Deletion',
                      text: 'Are you sure you want to delete this item?',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Yes, delete it!',
                      showCloseButton: true,
                      buttonsStyling: false,
                      customClass: {
                        confirmButton: 'btn btn-primary me-2 mt-2',
                        cancelButton: 'btn btn-danger mt-2',
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
                >
                  Click Me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">With Cancel Button</h5>
                <p className="text-muted mb-0">Includes cancel and confirm options with different actions.</p>
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    ReactSwal.fire({
                      title: 'Delete File?',
                      text: 'This action cannot be undone!',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Delete',
                      cancelButtonText: 'Cancel',
                      showCloseButton: true,
                      buttonsStyling: false,
                      customClass: {
                        confirmButton: 'btn btn-primary mt-2 me-2',
                        cancelButton: 'btn btn-danger mt-2',
                      },
                    }).then((result) => {
                      if (result.isConfirmed) {
                        showAlert({
                          title: 'Deleted!',
                          text: 'The file has been deleted.',
                          icon: 'success',
                        })
                      } else if (result.dismiss === Swal.DismissReason.cancel) {
                        showAlert({
                          title: 'Action Cancelled',
                          text: 'Your file is safe.',
                          icon: 'error',
                        })
                      }
                    })
                  }
                >
                  Click Me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">With Image Header (Logo)</h5>
                <p className="text-muted mb-0">Custom popup with a logo or image header.</p>
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showAlert({
                      title: 'Custom Branding',
                      text: 'This alert includes a logo.',
                      imageUrl: logoSm,
                      imageHeight: 40,
                      showCloseButton: true,
                    })
                  }
                >
                  Click Me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">Auto Close</h5>
                <p className="text-muted mb-0">Displays a popup that closes automatically after a timeout.</p>
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    showAlert({
                      title: 'Auto Dismiss',
                      html: 'Closing in <b></b> seconds...',
                      timer: 2000,
                      timerProgressBar: true,
                      showCloseButton: true,
                    })
                  }}
                >
                  Click Me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">Position</h5>
                <p className="text-muted mb-0">Shows the alert in different screen positions.</p>
              </td>
              <td>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      showAlert({
                        icon: 'success',
                        text: 'Saved successfully!',
                        showConfirmButton: false,
                        timer: 1500,
                        position: 'top-start',
                      })
                    }}
                  >
                    Top Start
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      showAlert({
                        icon: 'success',
                        text: 'Saved successfully!',
                        showConfirmButton: false,
                        timer: 1500,
                        position: 'top-end',
                      })
                    }}
                  >
                    Top End
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      showAlert({
                        icon: 'success',
                        text: 'Saved successfully!',
                        showConfirmButton: false,
                        timer: 1500,
                        position: 'bottom-start',
                      })
                    }}
                  >
                    Bottom Start
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      showAlert({
                        icon: 'success',
                        text: 'Saved successfully!',
                        showConfirmButton: false,
                        timer: 1500,
                        position: 'bottom-end',
                      })
                    }}
                  >
                    Bottom End
                  </Button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">With Custom Padding, Background</h5>
                <p className="text-muted mb-0">Popup with custom dimensions, padding, and background style.</p>
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    showAlert({
                      title: 'Custom Design',
                      html: '<p class="text-white">This alert has custom size, padding, and background.</p>',
                      width: 600,
                      padding: '100px',
                      color: '#fff',
                      background: `url(${stockImg}) no-repeat center`,
                    })
                  }}
                >
                  Click Me
                </Button>
              </td>
            </tr>
            <tr>
              <td>
                <h5 className="mb-1">Ajax Request</h5>
                <p className="text-muted mb-0">Demonstrates an alert with an Ajax request.</p>
              </td>
              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    ReactSwal.fire({
                      title: '<h4>Enter Your Email</h4>',
                      input: 'email',
                      inputPlaceholder: 'Enter your email address',
                      showCancelButton: true,
                      confirmButtonText: 'Submit',
                      showLoaderOnConfirm: true,
                      showCloseButton: true,
                      buttonsStyling: false,
                      customClass: {
                        confirmButton: 'btn btn-primary me-2',
                        cancelButton: 'btn btn-danger',
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
                        ReactSwal.fire({
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
                  }}
                >
                  Click Me
                </Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </CardBody>
    </Card>
  )
}
export default SweetAlerts
