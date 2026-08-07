import { useState } from 'react'
import { deckBreakdown, SKILLS } from '../game/cards.js'

// Tiny inline card face (kept compact for the codex list).
function MiniCard({ card }) {
  return card.type === 'food' ? (
    <div className="mini card-food">
      <span className="mini-emoji">🍖</span>
      <span className="mini-value">{card.value}</span>
    </div>
  ) : (
    <div className="mini card-skill">
      <span className="mini-emoji">{SKILLS[card.skill].emoji}</span>
    </div>
  )
}

function Row({ entry }) {
  const isFood = entry.card.type === 'food'
  const name = isFood ? `먹이 ${entry.card.value}` : SKILLS[entry.card.skill].name
  return (
    <div className="codex-row">
      <MiniCard card={entry.card} />
      <div className="codex-info">
        <div className="codex-line1">
          <span className="codex-name">{name}</span>
          <span className="codex-count">{entry.count}장</span>
          <span className="codex-pct">{entry.pct.toFixed(1)}%</span>
        </div>
        <div className="codex-effect">{entry.effect}</div>
      </div>
    </div>
  )
}

export default function Codex() {
  const [open, setOpen] = useState(false)
  const { total, foods, skills } = deckBreakdown()

  return (
    <div className="codex">
      <button className="codex-toggle" onClick={() => setOpen((v) => !v)}>
        <span>📖 카드 도감 <span className="codex-total">(플레이 덱 총 {total}장)</span></span>
        <span className="codex-chevron">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="codex-body">
          <div className="codex-section-title">먹이 카드</div>
          {foods.map((e, i) => (
            <Row key={`f${i}`} entry={e} />
          ))}
          <div className="codex-section-title">스킬 카드</div>
          {skills.map((e, i) => (
            <Row key={`s${i}`} entry={e} />
          ))}
          <p className="codex-note">
            확률 = 해당 카드 수 ÷ 플레이 덱 {total}장. (드래곤의 포만감 카드는 별도 덱: 10~20, 11장)
          </p>
        </div>
      )}
    </div>
  )
}
