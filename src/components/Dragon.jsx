export default function Dragon({ dragon }) {
  const { current, max } = dragon
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const danger = max > 0 && current >= max - 2
  const full = current >= max && max > 0
  const space = Math.max(max - current, 0)

  // Dragon face + speech bubble both reflect how full it is.
  let face = '🐲'
  let bubble = { emoji: '😴', text: '배고파' }
  if (full) {
    face = '🤤'
    bubble = { emoji: '🤤', text: '가득!' }
  } else if (danger) {
    face = '😰'
    bubble = { emoji: '🥵', text: '위험!' }
  } else if (pct > 60) {
    face = '😋'
    bubble = { emoji: '😋', text: '냠냠' }
  } else if (current > 0) {
    face = '🙂'
    bubble = { emoji: '🙂', text: '더 줘' }
  }

  return (
    <div className={`dragon-box ${danger ? 'is-danger' : ''}`}>
      <div className={`dragon-bubble ${danger ? 'bubble-danger' : ''}`}>
        <span className="bubble-emoji">{bubble.emoji}</span>
        <span className="bubble-text">{bubble.text}</span>
      </div>
      <div className="dragon-face">{face}</div>
      <div className="dragon-meter">
        <div className="meter-label">
          포만감 <b>{current}</b> / {max}
        </div>
        <div className="meter-track">
          <div className={`meter-fill ${danger ? 'hot' : ''}`} style={{ width: `${pct}%` }} />
          <div className="meter-max-tick" />
        </div>
        <div className="meter-hint">
          {full ? '가득! 리셋됩니다' : `앞으로 ${space} 더 먹으면 딱 맞아요`}
        </div>
      </div>
    </div>
  )
}
