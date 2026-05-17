import { useState } from 'react'
import TextDifferentView from './TextDifferentView'

const TextDiff = () => {
  const [originalText, setOriginalText] = useState<string>(
    'On a rainy Monday morning in a small town, Emma walked into her favorite café, her umbrella dripping and her hair slightly frizzy from the storm. She always ordered the same thing: black coffee, two sugars, and a blueberry muffin. But today, someone was already sitting at her usual table by the window. It was Jack — a quiet man with a book in hand and headphones around his neck. Their eyes met for a second. He smiled and motioned for her to join him. Hesitant but intrigued, Emma accepted.'
  )

  const [modifiedText, setModifiedText] = useState<string>(
    'On a rainy Monday morning in a small town, Emma stepped into her favorite café, her umbrella dripping and her hair slightly frizzy from the damp weather. She always ordered the same thing: black coffee with two sugars and a blueberry muffin. But today, someone was already seated at her usual window table. It was Jack — a quiet man with a book in one hand and headphones resting around his neck. Their eyes met briefly. He smiled and gestured for her to join him. Hesitant but curious, Emma agreed.'
  )
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">jsdiff</h4>
      </div>
      <div className="card-body">
        <div className="grid xl:grid-cols-2 gap-base">
          <div>
            <h5 className="mb-3 uppercase">Original Text</h5>
            <textarea className="diff-original form-textarea" rows={8} value={originalText} onChange={(e) => setOriginalText(e.target.value)} />
          </div>
          <div>
            <h5 className="mb-3 uppercase">Changed Text</h5>
            <textarea className="diff-changed form-textarea" rows={8} value={modifiedText} onChange={(e) => setModifiedText(e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <h5 className="mb-3 uppercase">Results</h5>
            <TextDifferentView originalText={originalText} modifiedText={modifiedText} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextDiff
