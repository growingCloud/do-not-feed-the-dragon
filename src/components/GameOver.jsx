import { useMemo } from 'react'
import { foodSum } from '../game/engine.js'

const DIFF_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' }
const CONFETTI_COLORS = ['#ffd166', '#ff7a59', '#6ee7a8', '#b8a6ff', '#ff6b81', '#5aa9f0']

function Confetti({ count = 70 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 1.8 + Math.random() * 1.8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        drift: (Math.random() - 0.5) * 160,
        rot: Math.random() * 720 - 360,
        size: 6 + Math.random() * 7,
      })),
    [count],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: `${p.size}px`,
            height: `${p.size * 0.5}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}

export default function GameOver({ game, onRestart, onHome }) {
  const winners = Array.isArray(game.winner) ? game.winner : [game.winner]
  const iWon = winners.includes(0)
  const names = winners.map((id) => game.players[id].name).join(', ')

  // Rank by fewest cards, then by smallest food-value sum (the tiebreaker).
  const standings = [...game.players].sort(
    (a, b) => a.hand.length - b.hand.length || foodSum(a) - foodSum(b),
  )

  return (
    <div className="overlay">
      {iWon && <Confetti />}
      <div className="overlay-card">
        <div className="overlay-emoji">{iWon ? '🏆' : '🐲'}</div>
        <h2 className="overlay-title">{iWon ? '승리!' : `${names} 승리`}</h2>
        <p className="overlay-sub">
          {iWon ? '드래곤을 잘 다뤘어요!' : '아쉬워요. 다시 도전해볼까요?'}
        </p>

        <div className="overlay-diff">난이도 · {DIFF_LABEL[game.difficulty] ?? game.difficulty}</div>

        <div className="standings">
          {standings.map((p, i) => (
            <div key={p.id} className={`standing ${winners.includes(p.id) ? 'is-winner' : ''}`}>
              <span className="standing-rank">{i + 1}</span>
              <span className="standing-name">{p.name}</span>
              <span className="standing-cards">손패 {p.hand.length}장 · 먹이합 {foodSum(p)}</span>
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
