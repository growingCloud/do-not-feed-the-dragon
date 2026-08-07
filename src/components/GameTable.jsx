import Dragon from './Dragon.jsx'

// Player ids 0..3 map to fixed seats: human (0) bottom, AIs top/left/right.
const SEAT_OF = { 0: 'bottom', 1: 'right', 2: 'top', 3: 'left' }

// Arrow each seat shows toward the NEXT seat in the current turn direction.
// Ring order by id: 0(bottom)→1(right)→2(top)→3(left). +1 = ids increase.
const FLOW = {
  1: { 0: '↗', 1: '↖', 2: '↙', 3: '↘' },
  '-1': { 0: '↖', 1: '↙', 2: '↘', 3: '↗' },
}

// Up to 5 card icons in a single row; anything beyond shows as "+N" so the
// pile height stays fixed no matter how many cards a player holds.
function CardPile({ count }) {
  const icons = Math.min(count, 5)
  const extra = count - icons
  return (
    <div className="pile" aria-hidden="true">
      {Array.from({ length: icons }).map((_, i) => (
        <span key={i} className="pile-card" />
      ))}
      {extra > 0 && <span className="pile-extra">+{extra}</span>}
    </div>
  )
}

function Seat({ player, active, isNext, direction }) {
  const isMe = player.isHuman
  const arrow = FLOW[String(direction)]?.[player.id] ?? '→'
  return (
    <div
      data-player={player.id}
      className={`seat seat-${SEAT_OF[player.id]} ${active ? 'seat-active' : ''} ${isNext ? 'seat-next' : ''}`}
    >
      {isNext && <div className="next-badge">다음</div>}
      <div className="seat-head">
        <span className="seat-avatar">{isMe ? '🧑' : active ? '🧑‍🚀' : '🧑'}</span>
        <div className="seat-meta">
          <div className="seat-name">{player.name}</div>
          <div className="seat-count">{player.hand.length}장</div>
        </div>
      </div>
      <CardPile count={player.hand.length} />
      <div className={`flow-arrow ${active ? 'flow-on' : ''}`}>{arrow}</div>
    </div>
  )
}

export default function GameTable({ players, activeId, direction, dragon, reaction }) {
  const n = players.length
  const nextId = activeId >= 0 ? ((activeId + direction) % n + n) % n : -1

  return (
    <div className="table">
      {players.map((p) => (
        <Seat
          key={p.id}
          player={p}
          active={activeId === p.id}
          isNext={nextId === p.id}
          direction={direction}
        />
      ))}
      <div className="table-center">
        <Dragon dragon={dragon} reaction={reaction} direction={direction} />
      </div>
    </div>
  )
}
