export default function OpponentRow({ players, current, direction }) {
  const opponents = players.filter((p) => !p.isHuman)

  return (
    <div className="opponents">
      {opponents.map((p) => {
        const active = players[current]?.id === p.id
        return (
          <div key={p.id} className={`opp ${active ? 'opp-active' : ''}`}>
            <div className="opp-avatar">{active ? '🧑‍🚀' : '🧑'}</div>
            <div className="opp-name">{p.name}</div>
            <div className="opp-cards">
              <span className="opp-cardstack">🂠</span>
              <b>{p.hand.length}</b>장
            </div>
            {active && <div className="opp-turn-dot" />}
          </div>
        )
      })}
      <div className="dir-indicator" title="진행 방향">
        {direction === 1 ? '진행 →' : '← 진행'}
      </div>
    </div>
  )
}
