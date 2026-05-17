import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { useCopyToClipboard } from 'usehooks-ts'
const Clipboard = () => {
  const [copiedText, copy] = useCopyToClipboard()
  const [lastCopied, setLastCopied] = useState(null)
  const handleCopy = async (text, id) => {
    const success = await copy(text)
    if (success) {
      setLastCopied(id)
      setTimeout(() => setLastCopied(null), 2000)
    }
    return success
  }
  const cutToClipboard = async (ref) => {
    if (ref.current) {
      const success = await handleCopy(ref.current.value, ref.current.id)
      if (success) {
        ref.current.value = ''
      }
    }
  }
  const copyFromElement = (id) => {
    const element = document.getElementById(id)
    if (element) {
      handleCopy(element.textContent || '', id)
    }
  }
  return (
    <Card title="Examples">
      <CardHeader>
        <CardTitle as="h4">Examples</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="table-responsive-sm">
          <table className="table mb-0">
            <tbody>
              <tr>
                <td>
                  <h5 className="mb-1">Copy from Element</h5>
                  <p className="text-muted mb-0">
                    Use
                    <code>data-clipboard-target</code>
                    to copy text from a specific element.
                  </p>
                </td>
                <td>
                  <p className="text-primary font-bold" id="copytext">
                    Click the button to copy this promotional text.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => copyFromElement('copyText1')} disabled={lastCopied === 'copyText1'}>
                    <Icon icon={lastCopied === 'copyText1' ? 'check' : 'copy'} className="me-1" />
                    {lastCopied === 'copyText1' ? 'Copied!' : 'Copy Text'}
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Cut from Textarea</h5>
                  <p className="text-muted mb-0">
                    Use
                    <code>data-clipboard-action</code>
                    with
                    <code>cut</code>
                    to remove and copy content.
                  </p>
                </td>
                <td>
                  <textarea className="form-control" id="cuttext" defaultValue={'This content will be cut and removed from this textarea.'} />
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      cutToClipboard({
                        current: document.querySelector('#cutTextarea'),
                      })
                    }
                  >
                    <Icon icon="cut" className="me-1" />
                    Cut Content
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Copy Email Address</h5>
                  <p className="text-muted mb-0">Click the button to copy this contact email:</p>
                </td>
                <td>
                  <span id="emailToCopy" className="d-block text-primary fw-bold">
                    support@example.com
                  </span>
                  <Button variant="primary" size="sm" className="mt-2" onClick={() => copyFromElement('emailToCopy')} disabled={lastCopied === 'emailToCopy'}>
                    <Icon icon={lastCopied === 'emailToCopy' ? 'check' : 'copy'} className="me-1" />
                    {lastCopied === 'emailToCopy' ? 'Copied!' : 'Copy Email'}
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Cut Input Value</h5>
                  <p className="text-muted mb-0">This cuts the value from a single-line input field.</p>
                </td>
                <td>
                  <input type="text" id="cutInput" className="form-control" defaultValue="Temporary token: 8GDF-393K-L99Z" />
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      cutToClipboard({
                        current: document.querySelector('#tokenInput'),
                      })
                    }
                  >
                    <Icon icon="cut" className="me-1" />
                    Cut Token
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Copy Code Snippet</h5>
                  <p className="text-muted mb-0">Copy this snippet by clicking the button:</p>
                </td>
                <td>
                  <pre>
                    <code id="codeSnippet">npm install clipboard --save</code>
                  </pre>
                  <Button variant="success" size="sm" className="mt-2" onClick={() => copyFromElement('codeSnippet')} disabled={lastCopied === 'codeSnippet'}>
                    <Icon icon={lastCopied === 'codeSnippet' ? 'check' : 'copy'} className="me-1" />
                    {lastCopied === 'codeSnippet' ? 'Copied!' : 'Copy Command'}
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Copy from Input Group</h5>
                  <p className="text-muted mb-0">Click the copy icon to copy the link here:</p>
                </td>
                <td>
                  <div className="input-group">
                    <input type="text" className="form-control" id="copyLink" defaultValue="https://example.com/invite?ref=12345" readOnly />
                    <Button variant="secondary" onClick={() => handleCopy('https://example.com/invite?ref=12345', 'copyLink')} disabled={lastCopied === 'copyLink'}>
                      <Icon icon={lastCopied === 'copyLink' ? 'check' : 'copy'} />
                    </Button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Copy Username</h5>
                  <p className="text-muted mb-0">Copy a predefined username from a span element.</p>
                </td>
                <td>
                  <span id="copyUsername" className="d-block text-primary fw-bold">
                    john_doe_92
                  </span>
                  <Button variant="primary" size="sm" className="mt-2" onClick={() => copyFromElement('copyUsername')} disabled={lastCopied === 'copyUsername'}>
                    <Icon icon={lastCopied === 'copyUsername' ? 'check' : 'copy'} className="me-1" />
                    {lastCopied === 'copyUsername' ? 'Copied!' : 'Copy Username'}
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Copy Discount Code</h5>
                  <p className="text-muted mb-0">Copy a promotional discount code for checkout.</p>
                </td>
                <td>
                  <div className="input-group">
                    <input type="text" id="discountCode" className="form-control" defaultValue="SAVE20NOW" readOnly />
                    <Button variant="warning" onClick={() => handleCopy('SAVE20NOW', 'discountCode')} disabled={lastCopied === 'discountCode'}>
                      <Icon icon={lastCopied === 'discountCode' ? 'check' : 'copy'} />
                    </Button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1">Copy HTML Template</h5>
                  <p className="text-muted mb-0">Copy a block of HTML code from a &lt;pre&gt; tag.</p>
                </td>
                <td>
                  <code id="htmlTemplate">&lt;button class="btn btn-primary"&gt;Click Me&lt;/button&gt;</code> <br />
                  <Button variant="info" size="sm" className="mt-2" onClick={() => copyFromElement('htmlTemplate')} disabled={lastCopied === 'htmlTemplate'}>
                    <Icon icon={lastCopied === 'htmlTemplate' ? 'check' : 'copy'} className="me-1" />
                    {lastCopied === 'htmlTemplate' ? 'Copied!' : 'Copy HTML'}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* end table-resp.*/}
      </CardBody>
    </Card>
  )
}
export default Clipboard
