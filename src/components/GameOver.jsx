export default function GameOver({ game, onRestart, onHome }) {
  const winners = Array.isArray(game.winner) ? game.winner : [game.winner]
  const iWon = winners.includes(0)
  const names = winners.map((id) => game.players[id].name).join(', ')

  const standings = [...game.players].sort((a, b) => a.hand.length - b.hand.length)

  return (
    <div className="overlay">
      <div className="overlay-card">
        <div className="overlay-emoji">{iWon ? '🏆' : '🐲'}</div>
        <h2 className="overlay-title">{iWon ? '승리!' : `${names} 승리`}</h2>
        <p className="overlay-sub">
          {iWon ? '드래곤을 잘 다뤘어요!' : '아쉬워요. 다시 도전해볼까요?'}
        </p>

        <div className="standings">
          {standings.map((p, i) => (
            <div key={p.id} className={`standing ${winners.includes(p.id) ? 'is-winner' : ''}`}>
              <span className="standing-rank">{i + 1}</span>
              <span className="standing-name">{p.name}</span>
              <span className="standing-cards">손패 {p.hand.length}장</span>
            </div>
          ))}
        </div>

        <div className="overlay-actions">
          <button className="btn btn-primary" onClick={onRestart}>다시 하기</button>
          <button className="btn btn-ghost" onClick={onHome}>메인으로</button>
        </div>
      </div>
    </div>
  )
}
