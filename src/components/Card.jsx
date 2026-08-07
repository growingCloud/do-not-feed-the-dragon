import { SKILLS } from '../game/cards.js'

const FOOD_EMOJI = '🍖'

export default function Card({ card, playable, projected, onClick, small = false }) {
  const isFood = card.type === 'food'
  const meta = isFood ? null : SKILLS[card.skill]

  return (
    <button
      type="button"
      className={`card ${isFood ? 'card-food' : `card-skill skill-${card.skill}`} ${playable ? 'is-playable' : 'is-locked'} ${small ? 'card-small' : ''}`}
      onClick={onClick}
      disabled={!playable}
      title={isFood ? `먹이 ${card.value}` : `${meta.name} — ${meta.desc}`}
    >
      {isFood ? (
        <>
          <span className="card-emoji">{FOOD_EMOJI}</span>
          <span className="card-value">{card.value}</span>
          {projected != null && projected !== card.value && (
            <span className="card-projected">→{projected}</span>
          )}
          <span className="card-kind">먹이</span>
        </>
      ) : (
        <>
          <span className="card-emoji">{meta.emoji}</span>
          <span className="card-skill-name">{meta.name}</span>
          <span className="card-kind">스킬</span>
        </>
      )}
    </button>
  )
}
