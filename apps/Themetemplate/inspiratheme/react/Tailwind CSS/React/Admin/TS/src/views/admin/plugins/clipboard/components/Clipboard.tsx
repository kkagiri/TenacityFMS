import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { useCopyToClipboard } from 'usehooks-ts'

const Clipnoard = () => {
  const [copiedText, copy] = useCopyToClipboard()
  const [lastCopied, setLastCopied] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    const success = await copy(text)
    if (success) {
      setLastCopied(id)
      setTimeout(() => setLastCopied(null), 2000)
    }
    return success
  }

  const cutToClipboard = async (ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    if (ref.current) {
      const success = await handleCopy(ref.current.value, ref.current.id)
      if (success) {
        ref.current.value = ''
      }
    }
  }

  const copyFromElement = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      handleCopy(element.textContent || '', id)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Examples</h4>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table">
            <tbody>
              <tr>
                <td>
                  <h5 className="mb-1.25">Copy from Element</h5>
                  <p className="text-default-400 mb-2.5">
                    Use
                    <code>data-clipboard-target</code>
                    to copy text from a specific element.
                  </p>
                </td>
                <td className="w-1/2">
                  <p className="text-primary mb-4 font-normal" id="copytext">
                    Click the button to copy this promotional text.
                  </p>
                  <button className="btn btn-sm bg-primary hover:bg-primary-hover text-white" onClick={() => copyFromElement('copytext')} disabled={lastCopied === 'copytext'}>
                    {lastCopied === 'copytext' ? (
                      <>
                        <Icon icon="check" className="me-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Icon icon="copy" className="me-1" />
                        Copy Text
                      </>
                    )}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Cut from Textarea</h5>
                  <p className="text-default-400 mb-2.5">
                    Use
                    <code>data-clipboard-action</code>
                    with
                    <code>cut</code>
                    to remove and copy content.
                  </p>
                </td>
                <td className="w-1/2">
                  <textarea className="form-textarea" id="cuttext" defaultValue={'This content will be cut and removed from this textarea.'} />
                  <button className="btn btn-sm bg-primary hover:bg-primary-hover mt-5 text-white" onClick={() => cutToClipboard({ current: document.querySelector('#cuttext') as HTMLTextAreaElement })}>
                    {lastCopied === 'cuttext' ? (
                      <>
                        <Icon icon="check" className="me-1" />
                        Cut!
                      </>
                    ) : (
                      <>
                        <Icon icon="copy" className="me-1" />
                        Cut Content
                      </>
                    )}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Copy Email Address</h5>
                  <p className="text-default-400 mb-2.5">Click the button to copy this contact email:</p>
                </td>
                <td className="w-1/2">
                  <span id="emailToCopy" className="text-primary block font-bold">
                    support@example.com
                  </span>
                  <button className="btn btn-sm bg-primary hover:bg-primary-hover mt-2.5 text-white" onClick={() => copyFromElement('emailToCopy')} disabled={lastCopied === 'emailToCopy'}>
                    {lastCopied === 'emailToCopy' ? (
                      <>
                        <Icon icon="check" className="me-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Icon icon="copy" className="me-1" />
                        Copy Email
                      </>
                    )}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Cut Input Value</h5>
                  <p className="text-default-400 mb-2.5">This cuts the value from a single-line input field.</p>
                </td>
                <td className="w-1/2">
                  <input type="text" id="cutInput" className="form-input" defaultValue="Temporary token: 8GDF-393K-L99Z" />
                  <button className="btn btn-sm bg-danger hover:bg-danger-hover mt-2 text-white" onClick={() => cutToClipboard({ current: document.querySelector('#cutInput') as HTMLInputElement })}>
                    {lastCopied === 'cutInput' ? (
                      <>
                        <Icon icon="check" className="me-1" />
                        Cut!
                      </>
                    ) : (
                      <>
                        <Icon icon="copy" className="me-1" />
                        Cut Token
                      </>
                    )}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Copy Code Snippet</h5>
                  <p className="text-default-400 mb-2.5">Copy this snippet by clicking the button:</p>
                </td>
                <td className="w-1/2">
                  <pre>
                    <code id="codeSnippet">npm install clipboard --save</code>
                  </pre>
                  <button className="btn btn-sm bg-success hover:bg-success-hover mt-4 text-white" onClick={() => copyFromElement('codeSnippet')}>
                    {lastCopied === 'codeSnippet' ? (
                      <>
                        <Icon icon="check" className="me-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Icon icon="copy" className="me-1" />
                        Copy Command
                      </>
                    )}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Copy from Input Group</h5>
                  <p className="text-default-400 mb-2.5">Click the copy icon to copy the link here:</p>
                </td>
                <td className="w-1/2">
                  <div className="input-group flex">
                    <input type="text" className="form-input" id="copyLink" defaultValue="https://example.com/invite?ref=12345" readOnly />
                    <button
                      className="btn btn-icon bg-secondary text-white hover:bg-secondary-hover rounded-s-none"
                      type="button"
                      onClick={() => handleCopy('https://example.com/invite?ref=12345', 'copyLink')}
                      disabled={lastCopied === 'copyLink'}
                      data-clipboard-target="#copyLink"
                    >
                      {lastCopied === 'copyLink' ? (
                        <>
                          <Icon icon="check" className="text-lg" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Icon icon="copy" className="text-lg" />
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Copy Username</h5>
                  <p className="text-default-400 mb-2.5">Copy a predefined username from a span element.</p>
                </td>
                <td className="w-1/2">
                  <span id="copyUsername" className="text-primary block font-bold">
                    john_doe_92
                  </span>
                  <button className="btn btn-sm bg-primary hover:bg-primary-hover mt-2 text-white" onClick={() => copyFromElement('copyUsername')} disabled={lastCopied === 'copyUsername'} data-clipboard-target="#copyUsername">
                    {lastCopied === 'copyUsername' ? (
                      <>
                        <Icon icon="check" className="me-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Icon icon="copy" className="me-1" />
                        Copy Username
                      </>
                    )}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Copy Discount Code</h5>
                  <p className="text-default-400 mb-2.5">Copy a promotional discount code for checkout.</p>
                </td>
                <td className="w-1/2">
                  <div className="input-group flex">
                    <input type="text" id="discountCode" className="form-input" defaultValue="SAVE20NOW" readOnly />
                    <button className="btn btn-icon bg-warning text-white" type="button" data-clipboard-target="#discountCode" onClick={() => handleCopy('SAVE20NOW', 'discountCode')} disabled={lastCopied === 'discountCode'}>
                      {lastCopied === 'discountCode' ? (
                        <>
                          <Icon icon="check" className="text-lg" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Icon icon="copy" className="text-lg" />
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <h5 className="mb-1.25">Copy HTML Template</h5>
                  <p className="text-default-400 mb-2.5">Copy a block of HTML code from a &lt;pre&gt; tag.</p>
                </td>
                <td className="w-1/2">
                  <code id="htmlTemplate">&lt;button class="btn bg-info text-white hover:bg-info-hover"&gt;Click Me&lt;/button&gt;</code>
                  <br />
                  <button className="btn btn-sm bg-info hover:bg-info-hover mt-2 text-white" onClick={() => copyFromElement('htmlTemplate')} disabled={lastCopied === 'htmlTemplate'} data-clipboard-target="#htmlTemplate">
                    {lastCopied === 'htmlTemplate' ? (
                      <>
                        <Icon icon="check" className="me-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Icon icon="copy" className="me-1" />
                        Copy HTML
                      </>
                    )}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Clipnoard
