import { useEffect, useRef } from 'react'

export default function LogPanel({ log }) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [log])

  // Dragon-state logs keep their color even when old; everything else dims once
  // it's no longer the most recent line.
  const DRAGON_KINDS = ['good', 'bad', 'win']

  return (
    <div className="log-panel">
      {log.slice(-8).map((entry, i, arr) => {
        const isLast = i === arr.length - 1
        const dragon = DRAGON_KINDS.includes(entry.kind)
        const cls = `log-line${isLast ? ' log-recent' : ''}${dragon ? ` log-${entry.kind}` : ''}`
        return (
          <div key={entry.id ?? i} className={cls}>
            {entry.text}
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
