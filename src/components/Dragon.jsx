export default function Dragon({ dragon, reaction }) {
  const { current, max } = dragon
  const reactClass = reaction?.type === 'overflow' ? 'react-burst' : reaction?.type === 'reset' ? 'react-pop' : ''
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const danger = max > 0 && current >= max - 2
  const full = current >= max && max > 0

  // Mood emoji only (the dragon itself always stays 🐲).
  // Numbers (current / max) are shown, but we never spell out how much is left.
  let mood = '😴'
  if (full) mood = '🤤'
  else if (danger) mood = '🥵'
  else if (pct > 60) mood = '😋'
  else if (current > 0) mood = '🙂'

  return (
    <div className={`dragon-box ${danger ? 'is-danger' : ''}`}>
      <div className={`dragon-bubble ${danger ? 'bubble-danger' : ''}`}>
        <span className="bubble-emoji">{mood}</span>
      </div>
      <div className={`dragon-face ${reactClass}`}>
        🐲
        {reaction?.type === 'overflow' && <span className="burst">💥</span>}
        {reaction?.type === 'reset' && <span className="burst sparkle">✨</span>}
      </div>
      <div className="dragon-meter">
        <div className="meter-label">
          포만감 <b>{current}</b> / {max}
        </div>
        <div className="meter-track">
          <div className={`meter-fill ${danger ? 'hot' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
