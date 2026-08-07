import { useEffect, useRef, useState } from 'react'
import { createGame, playFood, playSkill, endTurn, canPlayFood, canPlaySkill, spaceLeft, RULES } from './game/engine.js'
import { aiTakeTurn } from './game/ai.js'
import { SKILLS } from './game/cards.js'
import TitleScreen from './components/TitleScreen.jsx'
import Card from './components/Card.jsx'
import GameTable from './components/GameTable.jsx'
import LogPanel from './components/LogPanel.jsx'
import GameOver from './components/GameOver.jsx'

const AI_DELAY = 1500 // ms between AI moves — linger so the turn is easy to follow

// Show the hand tidy: food first (by value), then skills grouped.
function sortHand(hand) {
  const rank = (c) => (c.type === 'food' ? 0 : 1)
  return [...hand].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    if (a.type === 'food') return a.value - b.value
    return a.skill.localeCompare(b.skill)
  })
}

const DIFF_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' }

export default function App() {
  const [game, setGame] = useState(null)
  const [difficulty, setDifficulty] = useState('normal')

  // Undo bookkeeping (kept in refs so restoring state doesn't wipe it).
  const snapshotRef = useRef(null) // { turn, state } captured at the human turn's start
  const undoTurnRef = useRef(null) // the totalTurns value for which undo was already used

  function startGame(diff) {
    snapshotRef.current = null
    undoTurnRef.current = null
    setDifficulty(diff)
    setGame(createGame(diff))
  }

  // Apply a mutating engine action while keeping React state immutable.
  function mutate(fn) {
    setGame((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }

  // Drive AI turns automatically, one move at a time.
  useEffect(() => {
    if (!game || game.phase !== 'playing') return
    const p = game.players[game.current]
    if (p.isHuman) return
    const t = setTimeout(() => mutate((s) => aiTakeTurn(s, s.difficulty)), AI_DELAY)
    return () => clearTimeout(t)
  }, [game])

  // Snapshot the state at the very start of each human turn (for undo).
  useEffect(() => {
    if (!game || game.phase !== 'playing') return
    if (game.current !== 0) return
    const ts = game.turnState
    if (ts.foodPlayed === 0 && ts.skillsPlayed === 0 && snapshotRef.current?.turn !== game.totalTurns) {
      snapshotRef.current = { turn: game.totalTurns, state: structuredClone(game) }
    }
  }, [game])

  function undo() {
    const snap = snapshotRef.current
    if (!snap || !game || snap.turn !== game.totalTurns) return
    undoTurnRef.current = game.totalTurns
    setGame(structuredClone(snap.state))
  }

  if (!game) return <TitleScreen difficulty={difficulty} onStart={startGame} />

  const me = game.players[0]
  const myTurn = game.current === 0 && game.phase === 'playing'
  const foodOk = myTurn && canPlayFood(game)
  const skillOk = myTurn && canPlaySkill(game)
  const ts = game.turnState

  const playedThisTurn = ts.foodPlayed > 0 || ts.skillsPlayed > 0
  const snap = snapshotRef.current
  const canUndo =
    myTurn &&
    playedThisTurn &&
    !ts.dragonTriggered &&
    snap?.turn === game.totalTurns &&
    undoTurnRef.current !== game.totalTurns

  return (
    <div className="app">
      <header className="topbar">
        <button className="home-btn" onClick={() => setGame(null)} title="메인 화면으로">
          ← 메인
        </button>
        <div className="pill-group">
          <div className="round-pill round-pill-diff">난이도 {DIFF_LABEL[game.difficulty] ?? game.difficulty}</div>
          <div className="round-pill">라운드 {Math.min(game.round, 5)} / 5</div>
        </div>
      </header>

      <GameTable
        players={game.players}
        activeId={game.phase === 'playing' ? game.current : -1}
        direction={game.direction}
        dragon={game.dragon}
      />

      <div className="turn-banner">
        {game.phase === 'gameover'
          ? '게임 종료'
          : myTurn
            ? '내 턴이에요! 카드를 내보세요.'
            : `${game.players[game.current].name}의 턴...`}
      </div>

      <LogPanel log={game.log} />

      <div className="my-area">
        <div className="my-status">
          <span className="chip">먹이 {ts.foodPlayed}/{ts.foodAllowed}</span>
          <span className="chip">스킬 {ts.skillsPlayed}/{RULES.maxSkillsPerTurn === 0 ? '∞' : RULES.maxSkillsPerTurn}</span>
          {ts.times2Pending && <span className="chip chip-hot">×2 대기중</span>}
          <span className="chip">여유 {Math.max(spaceLeft(game), 0)}</span>
          <span className="chip">내 손패 {me.hand.length}장</span>
        </div>

        <div className="hand">
          {me.hand.length === 0 && <div className="empty-hand">손패가 비었어요.</div>}
          {sortHand(me.hand).map((card) => {
            const playable =
              myTurn && (card.type === 'skill' ? skillOk : foodOk)
            return (
              <Card
                key={card.id}
                card={card}
                playable={playable}
                projected={card.type === 'food' ? projectedFood(card, ts) : null}
                onClick={() => {
                  if (!playable) return
                  if (card.type === 'food') mutate((s) => playFood(s, card.id))
                  else mutate((s) => playSkill(s, card.id))
                }}
              />
            )
          })}
        </div>

        <div className="controls">
          <button className="btn btn-primary" disabled={!myTurn} onClick={() => mutate((s) => endTurn(s))}>
            턴 종료 {myTurn && ts.foodPlayed === 0 ? '(먹이 안 냄 → 패널티 1장)' : ''}
          </button>
          <button className="btn btn-undo" disabled={!canUndo} onClick={undo}>
            ↩︎ 실행 취소
          </button>
          <span
            className="info-dot"
            tabIndex={0}
            title="실행 취소는 턴당 1회 쓸 수 있어요. 드래곤 포만감이 바뀌면(딱 맞춤 리셋 · 초과) 그 턴에는 더 이상 되돌릴 수 없어요."
          >
            i
          </span>
        </div>
      </div>

      {game.phase === 'gameover' && (
        <GameOver game={game} onRestart={() => startGame(game.difficulty)} onHome={() => setGame(null)} />
      )}
    </div>
  )
}

function projectedFood(card, ts) {
  return ts.times2Pending ? card.value * 2 : card.value
}
