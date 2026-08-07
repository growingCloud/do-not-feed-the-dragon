import Dragon from './Dragon.jsx'

// Seats around the table. Player ids 0..3 map to fixed positions so the
// human (0) always sits at the bottom and the 3 AIs sit top/left/right.
const SEAT_OF = { 0: 'bottom', 1: 'right', 2: 'top', 3: 'left' }

function Seat({ player, active }) {
  const isMe = player.isHuman
  const backs = Math.min(player.hand.length, 5)
  return (
    <div className={`seat seat-${SEAT_OF[player.id]} ${active ? 'seat-active' : ''}`}>
      <div className="seat-avatar">{isMe ? '🧑' : active ? '🧑‍🚀' : '🧑'}</div>
      <div className="seat-name">{player.name}</div>
      {!isMe && (
        <div className="seat-backs">
          {Array.from({ length: backs }).map((_, i) => (
            <span key={i} className="mini-back" style={{ marginLeft: i ? -10 : 0 }}>🂠</span>
          ))}
        </div>
      )}
      <div className="seat-count">{player.hand.length}장</div>
      {active && <div className="seat-turn-dot" />}
    </div>
  )
}

export default function GameTable({ players, activeId, direction, dragon }) {
  return (
    <div className="table">
      {players.map((p) => (
        <Seat key={p.id} player={p} active={activeId === p.id} />
      ))}
      <div className="table-center">
        <Dragon dragon={dragon} />
        <div className="dir-badge" title="진행 방향">
          {direction === 1 ? '↻' : '↺'}
        </div>
      </div>
    </div>
  )
}
