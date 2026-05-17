import { getColor } from '@/utils/helpers'
import { diffWords } from 'diff'
import { CSSProperties, JSX, startTransition, useEffect, useState } from 'react'

type PropsType = {
  originalText: string
  modifiedText: string
}

const TextDifferentView = ({ originalText, modifiedText }: PropsType) => {
  const [diffOutput, setDiffOutput] = useState<JSX.Element[]>([])

  useEffect(() => {
    const diff = diffWords(originalText, modifiedText)

    const jsx = diff.map((part, index) => {
      let style: CSSProperties = {}

      if (part.added) {
        style = { backgroundColor: getColor('success-rgb', 0.1), color: getColor('success') }
      } else if (part.removed) {
        style = {
          backgroundColor: getColor('danger-rgb', 0.1),
          color: getColor('danger'),
          textDecoration: 'line-through',
        }
      }

      return (
        <span key={index} style={style}>
          {part.value}
        </span>
      )
    })

    startTransition(() => {
      setDiffOutput(jsx)
    })
  }, [originalText, modifiedText])

  return (
    <div className="bg-light/15 border-default-300 rounded border border-dashed p-6 leading-7">
      <div className="diff-output diff">{diffOutput}</div>
    </div>
  )
}

export default TextDifferentView
