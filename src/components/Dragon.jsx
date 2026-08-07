// The dragon's exact max is hidden — players only see how much it has eaten
// so far (public info) and a fuzzy mood emoji. The bar is scaled to the highest
// possible appetite (20), so it never pinpoints this round's secret limit.
const MAX_POSSIBLE = 20

export default function Dragon({ dragon }) {
  const { current, max } = dragon
  const danger = max > 0 && current >= max - 2
  const full = current >= max && max > 0
  const pct = Math.min(100, (current / MAX_POSSIBLE) * 100)

  // Mood emoji only (the dragon itself always stays 🐲).
  let mood = '😴'
  if (full) mood = '🤤'
  else if (danger) mood = '🥵'
  else if (max > 0 && current / max > 0.6) mood = '😋'
  else if (current > 0) mood = '🙂'

  return (
    <div className={`dragon-box ${danger ? 'is-danger' : ''}`}>
      <div className={`dragon-bubble ${danger ? 'bubble-danger' : ''}`}>
        <span className="bubble-emoji">{mood}</span>
      </div>
      <div className="dragon-face">🐲</div>
      <div className="dragon-meter">
        <div className="meter-label">포만감 <b>{current}</b></div>
        <div className="meter-track">
          <div className={`meter-fill ${danger ? 'hot' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
