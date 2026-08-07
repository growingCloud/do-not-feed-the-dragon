export default function Dragon({ dragon }) {
  const { current, max } = dragon
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const danger = max > 0 && current >= max - 1
  const full = current >= max && max > 0

  // Mood by how full the dragon is.
  let face = '🐲'
  if (full) face = '🤯'
  else if (danger) face = '😰'
  else if (pct > 60) face = '😋'

  return (
    <div className={`dragon-box ${danger ? 'is-danger' : ''}`}>
      <div className="dragon-face">{face}</div>
      <div className="dragon-meter">
        <div className="meter-label">
          포만감 <b>{current}</b> / {max}
        </div>
        <div className="meter-track">
          <div
            className={`meter-fill ${danger ? 'hot' : ''}`}
            style={{ width: `${pct}%` }}
          />
          <div className="meter-max-tick" />
        </div>
        <div className="meter-hint">
          {full ? '가득! 리셋됩니다' : `앞으로 ${Math.max(max - current, 0)} 더 먹으면 딱 맞아요`}
        </div>
      </div>
    </div>
  )
}
