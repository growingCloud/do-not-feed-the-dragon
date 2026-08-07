import { useEffect, useRef, useState } from 'react'
import { createGame, playFood, playSkill, endTurn, discardReward, skipDiscard, canPlayFood, canPlaySkill, RULES } from './game/engine.js'
import { aiStep } from './game/ai.js'
import { SKILLS, SKILL_COUNTS } from './game/cards.js'

const SKILL_ORDER = Object.keys(SKILL_COUNTS)
import TitleScreen from './components/TitleScreen.jsx'
import Card from './components/Card.jsx'
import GameTable from './components/GameTable.jsx'
import LogPanel from './components/LogPanel.jsx'
import GameOver from './components/GameOver.jsx'

const AI_STEP_DELAY = 1000 // ms between individual AI actions (one card at a time)
const TIMER_SECONDS = 10 // per-turn limit when the timer is enabled

// Show the hand tidy: food first (by value), then skills grouped.
function sortHand(hand) {
  const rank = (c) => (c.type === 'food' ? 0 : 1)
  return [...hand].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    if (a.type === 'food') return a.value - b.value
    return SKILL_ORDER.indexOf(a.skill) - SKILL_ORDER.indexOf(b.skill)
  })
}

const DIFF_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' }

export default function App() {
  const [game, setGame] = useState(null)
  const [difficulty, setDifficulty] = useState('normal')
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [infoOpen, setInfoOpen] = useState(false)

  // Undo bookkeeping (kept in refs so restoring state doesn't wipe it).
  const snapshotRef = useRef(null) // { turn, state } captured at the human turn's start
  const undoTurnRef = useRef(null) // the totalTurns value for which undo was already used
  const autoEndRef = useRef(-1) // totalTurns already auto-ended by the timer

  function startGame(diff, timer = false) {
    snapshotRef.current = null
    undoTurnRef.current = null
    autoEndRef.current = -1
    setDifficulty(diff)
    setTimerOn(timer)
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

  // Drive AI turns automatically, ONE action at a time. Each aiStep mutates the
  // game, which re-runs this effect and schedules the next action, until the
  // turn ends (current becomes the human or the next AI).
  useEffect(() => {
    if (!game || game.phase !== 'playing') return
    const p = game.players[game.current]
    if (p.isHuman) return
    const t = setTimeout(() => mutate((s) => aiStep(s, s.difficulty)), AI_STEP_DELAY)
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

  const isMyTurn = !!game && game.phase === 'playing' && game.current === 0

  // Timer: reset the countdown when a fresh human turn begins.
  useEffect(() => {
    if (isMyTurn && timerOn) setTimeLeft(TIMER_SECONDS)
  }, [game?.totalTurns, isMyTurn, timerOn])

  // Timer: tick down once per second during the human's turn (paused while the
  // info modal is open).
  useEffect(() => {
    if (!isMyTurn || !timerOn || timeLeft <= 0 || infoOpen) return
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [isMyTurn, timerOn, timeLeft, infoOpen])

  // Timer: auto-end the turn on timeout (guarded so it fires once per turn).
  useEffect(() => {
    if (isMyTurn && timerOn && timeLeft === 0 && game && autoEndRef.current !== game.totalTurns) {
      autoEndRef.current = game.totalTurns
      mutate((s) => {
        if (s.current === 0 && s.phase === 'playing') {
          if (s.pendingDiscard !== null) skipDiscard(s) // forfeit the reward on timeout
          endTurn(s)
        }
      })
    }
  }, [timeLeft, isMyTurn, timerOn])

  // Animation: a card flies from the player's seat to the dragon on each play.
  const [flyers, setFlyers] = useState([])
  useEffect(() => {
    const lp = game?.lastPlay
    if (!lp?.seq) return
    const fromEl = document.querySelector(`[data-player="${lp.playerId}"]`)
    const toEl = document.querySelector('.dragon-face')
    if (!fromEl || !toEl) return
    const f = fromEl.getBoundingClientRect()
    const t = toEl.getBoundingClientRect()
    const flyer = {
      id: lp.seq,
      play: lp,
      from: { x: f.x + f.width / 2, y: f.y + f.height / 2 },
      to: { x: t.x + t.width / 2, y: t.y + t.height / 2 },
    }
    setFlyers((prev) => (prev.some((x) => x.id === flyer.id) ? prev : [...prev, flyer]))
    const timer = setTimeout(() => setFlyers((prev) => prev.filter((x) => x.id !== flyer.id)), 650)
    return () => clearTimeout(timer)
  }, [game?.lastPlay?.seq])

  // Hold the active-seat highlight on the player who just acted until their
  // flying card has landed, then advance it — so the border doesn't jump ahead
  // of the animation.
  const [displayActive, setDisplayActive] = useState(0)
  useEffect(() => {
    if (game && flyers.length === 0) setDisplayActive(game.current)
  }, [game?.current, flyers.length])

  // Animation: dragon reacts (satisfied bounce / angry burst + screen shake).
  const [reaction, setReaction] = useState(null)
  useEffect(() => {
    const de = game?.dragonEvent
    if (!de?.seq) return
    setReaction(de)
    const t = setTimeout(() => setReaction((r) => (r?.seq === de.seq ? null : r)), 700)
    return () => clearTimeout(t)
  }, [game?.dragonEvent?.seq])

  if (!game) return <TitleScreen difficulty={difficulty} timerOn={timerOn} onStart={startGame} />

  const me = game.players[0]
  const myTurn = game.current === 0 && game.phase === 'playing'
  const foodOk = myTurn && canPlayFood(game)
  const skillOk = myTurn && canPlaySkill(game)
  const ts = game.turnState

  // The human's seat is hidden on mobile, so mirror the current/next turn border
  // onto the hand area. Follows displayActive (the visual turn) like the seats.
  const seatCount = game.players.length
  const displayNext =
    game.phase === 'playing' ? ((displayActive + game.direction) % seatCount + seatCount) % seatCount : -1
  const myAreaTurn =
    game.phase !== 'playing' ? '' : displayActive === 0 ? 'is-my-turn' : displayNext === 0 ? 'is-my-next' : ''

  const discardMode = myTurn && game.pendingDiscard === 0

  const playedThisTurn = ts.foodPlayed > 0 || ts.skillsPlayed > 0
  const snap = snapshotRef.current
  const canUndo =
    myTurn &&
    !discardMode &&
    playedThisTurn &&
    !ts.dragonTriggered &&
    snap?.turn === game.totalTurns &&
    undoTurnRef.current !== game.totalTurns

  return (
    <div className={`app ${reaction?.type === 'overflow' ? 'shake' : ''}`}>
      {flyers.map((fl) => {
        const dx = fl.to.x - fl.from.x
        const dy = fl.to.y - fl.from.y
        const isFood = fl.play.type === 'food'
        return (
          <div
            key={fl.id}
            className={`flyer ${isFood ? 'card-food' : 'card-skill'}`}
            style={{ left: fl.from.x, top: fl.from.y, '--dx': `${dx}px`, '--dy': `${dy}px` }}
          >
            {isFood ? fl.play.value : SKILLS[fl.play.skill].emoji}
          </div>
        )
      })}

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
        activeId={game.phase === 'playing' ? displayActive : -1}
        direction={game.direction}
        dragon={game.dragon}
        reaction={reaction}
      />

      {discardMode && (
        <div className="turn-banner banner-reward">🎯 딱 맞췄어요! 버릴 카드를 한 장 고르세요.</div>
      )}

      <LogPanel log={game.log} />

      <div className={`my-area ${myAreaTurn}`}>
        <div className="my-status">
          <span className="chip">먹이 {ts.foodPlayed}/{ts.foodAllowed}</span>
          <span className="chip">스킬 {ts.skillsPlayed}/{RULES.maxSkillsPerTurn === 0 ? '∞' : RULES.maxSkillsPerTurn}</span>
          {ts.times2Pending && <span className="chip chip-hot">×2 대기중</span>}
          <span className="chip">내 손패 {me.hand.length}장</span>
        </div>

        <div className={`hand ${discardMode ? 'hand-discard' : ''}`}>
          {me.hand.length === 0 && <div className="empty-hand">손패가 비었어요.</div>}
          {sortHand(me.hand).map((card) => {
            const playable = discardMode
              ? true
              : myTurn && (card.type === 'skill' ? skillOk : foodOk)
            return (
              <Card
                key={card.id}
                card={card}
                playable={playable}
                projected={!discardMode && card.type === 'food' ? projectedFood(card, ts) : null}
                onClick={() => {
                  if (!playable) return
                  if (discardMode) mutate((s) => discardReward(s, card.id))
                  else if (card.type === 'food') mutate((s) => playFood(s, card.id))
                  else mutate((s) => playSkill(s, card.id))
                }}
              />
            )
          })}
        </div>

        {timerOn && myTurn && (
          <div className="timer-bar">
            <div
              className={`timer-fill ${timeLeft <= 3 ? 'timer-low' : ''}`}
              style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }}
            />
            <span className="timer-text">⏱️ {timeLeft}s</span>
          </div>
        )}

        {discardMode ? (
          <div className="controls">
            <button className="btn btn-ghost" onClick={() => mutate((s) => skipDiscard(s))}>
              안 버리고 넘어가기
            </button>
          </div>
        ) : (
          <div className="controls">
            <button className="btn btn-primary" disabled={!myTurn} onClick={() => mutate((s) => endTurn(s))}>
              턴 종료 {myTurn && ts.foodPlayed === 0 ? `(패널티 ${RULES.noFoodPenalty}장)` : ''}
            </button>
            <button className="btn btn-undo" disabled={!canUndo} onClick={undo}>
              ↩︎ 실행 취소
            </button>
            <button className="info-dot" onClick={() => setInfoOpen(true)} title="실행 취소 안내">
              i
            </button>
          </div>
        )}
      </div>

      {game.phase === 'gameover' && (
        <GameOver game={game} onRestart={() => startGame(game.difficulty, timerOn)} onHome={() => setGame(null)} />
      )}

      {infoOpen && (
        <div className="overlay" onClick={() => setInfoOpen(false)}>
          <div className="overlay-card info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-emoji">↩︎</div>
            <h2 className="overlay-title">실행 취소</h2>
            <ul className="info-list">
              <li>이번 턴에 낸 카드를 <b>턴당 1회</b> 되돌릴 수 있어요.</li>
              <li>단, 드래곤 포만감이 <b>바뀌면(딱 맞춤 리셋 · 초과)</b> 그 턴에는 더 이상 되돌릴 수 없어요.</li>
              <li>즉 <b>위험한 선택</b>은 무를 수 없고, <b>단순 실수</b>만 되돌릴 수 있어요.</li>
              {timerOn && <li>이 안내를 보는 동안 <b>타이머는 멈춰요.</b></li>}
            </ul>
            <div className="overlay-actions">
              <button className="btn btn-primary" onClick={() => setInfoOpen(false)}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function projectedFood(card, ts) {
  return ts.times2Pending ? card.value * 2 : card.value
}
