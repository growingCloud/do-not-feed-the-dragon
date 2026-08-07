import { useEffect, useRef } from 'react'

export default function LogPanel({ log }) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [log])

  return (
    <div className="log-panel">
      {log.slice(-8).map((entry, i) => (
        <div key={i} className={`log-line log-${entry.kind}`}>
          {entry.text}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
