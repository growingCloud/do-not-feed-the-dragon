// Game engine for "Do not feed the dragon".
//
// Design decisions locked with the user:
//  - 드래곤 최대 포만감: 포만감 카드 6~10 중 1장을 공개 → 그게 이번 max.
//  - 누적합 == max  : 세이프. 포만감 리셋(0) + 새 포만감 카드 공개.
//  - 누적합 >  max  : 낸 사람 3장 패널티 + 리셋 + 새 포만감 카드.
//  - 스킬: 두번먹이기(+1 먹이 허용) / ×2(다음 먹이 2배) / -2 / 뒤집기(방향 반전) / 소화(-5).
//  - 턴에 먹이를 1장도 못 내면 패널티 1장.
//  - 승리: 손패 먼저 소진 = 즉시 승리. 아니면 5라운드 후 손패 최소가 승리.
//
// Engine functions MUTATE the passed state. The React layer clones (structuredClone)
// before each call so state transitions stay immutable from React's point of view.

import { buildMainDeck, buildSatietyDeck, shuffle, SKILLS, cardLabel } from './cards.js'

export const ROUNDS_TO_END = 5
export const START_HAND = 7

const AI_NAMES = ['드래곤 훈련사 A', '드래곤 훈련사 B', '드래곤 훈련사 C']

export function createGame() {
  const drawPile = shuffle(buildMainDeck())
  const satietyPile = shuffle(buildSatietyDeck())

  const players = [
    { id: 0, name: '나', isHuman: true, hand: [] },
    ...AI_NAMES.map((name, i) => ({ id: i + 1, name, isHuman: false, hand: [] })),
  ]

  const s = {
    players,
    drawPile,
    discardPile: [],
    satietyPile,
    satietyDiscard: [],
    dragon: { max: 0, current: 0 },
    current: 0,
    direction: 1,
    turnState: freshTurn(),
    totalTurns: 0,
    round: 1,
    phase: 'playing', // 'playing' | 'gameover'
    winner: null, // player index, or array of indices for a tie
    log: [],
  }

  // Deal starting hands.
  for (const p of players) {
    for (let i = 0; i < START_HAND; i++) drawOne(s, p)
  }

  // Flip the first satiety card → the dragon's starting appetite.
  flipSatiety(s)
  pushLog(s, `게임 시작! 드래곤은 최대 ${s.dragon.max}까지 먹을 수 있어요.`, 'system')

  return s
}

function freshTurn() {
  return { foodPlayed: 0, foodAllowed: 1, times2Pending: false }
}

// ---- Logging -------------------------------------------------------------
function pushLog(s, text, kind = 'info') {
  s.log.push({ text, kind, turn: s.totalTurns })
  if (s.log.length > 60) s.log.shift()
}

// ---- Drawing -------------------------------------------------------------
function reshuffleIfNeeded(s) {
  if (s.drawPile.length === 0 && s.discardPile.length > 0) {
    s.drawPile = shuffle(s.discardPile)
    s.discardPile = []
    pushLog(s, '더미가 떨어져서 버린 카드를 섞어 다시 쌓았어요.', 'system')
  }
}

function drawOne(s, player) {
  reshuffleIfNeeded(s)
  if (s.drawPile.length === 0) return null
  const card = s.drawPile.pop()
  player.hand.push(card)
  return card
}

function drawN(s, player, n) {
  let drawn = 0
  for (let i = 0; i < n; i++) {
    if (drawOne(s, player)) drawn++
  }
  return drawn
}

// ---- Satiety -------------------------------------------------------------
function flipSatiety(s) {
  if (s.satietyPile.length === 0 && s.satietyDiscard.length > 0) {
    s.satietyPile = shuffle(s.satietyDiscard)
    s.satietyDiscard = []
  }
  const prev = s.dragon.card
  if (prev) s.satietyDiscard.push(prev)
  const card = s.satietyPile.pop()
  s.dragon.card = card
  s.dragon.max = card.value
  s.dragon.current = 0
}

// ---- Player queries ------------------------------------------------------
export function currentPlayer(s) {
  return s.players[s.current]
}
export function canPlayFood(s) {
  return s.turnState.foodPlayed < s.turnState.foodAllowed
}
export function spaceLeft(s) {
  return s.dragon.max - s.dragon.current
}

// ---- Actions -------------------------------------------------------------
// All actions assume it is `s.current`'s turn.

export function playFood(s, cardId) {
  if (s.phase !== 'playing') return
  const p = currentPlayer(s)
  const idx = p.hand.findIndex((c) => c.id === cardId)
  if (idx === -1) return
  const card = p.hand[idx]
  if (card.type !== 'food') return
  if (!canPlayFood(s)) return

  p.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.turnState.foodPlayed++

  let value = card.value
  if (s.turnState.times2Pending) {
    value *= 2
    s.turnState.times2Pending = false
  }
  s.dragon.current += value
  pushLog(s, `${p.name}: 먹이 ${card.value}${value !== card.value ? ` (×2 → ${value})` : ''} → 드래곤 포만감 ${Math.min(s.dragon.current, s.dragon.max)}${s.dragon.current > s.dragon.max ? `?! (${s.dragon.current})` : ''} / ${s.dragon.max}`, p.isHuman ? 'me' : 'ai')

  resolveDragon(s, p)
  if (s.phase === 'playing') checkEmptyHandWin(s, p)
}

export function playSkill(s, cardId) {
  if (s.phase !== 'playing') return
  const p = currentPlayer(s)
  const idx = p.hand.findIndex((c) => c.id === cardId)
  if (idx === -1) return
  const card = p.hand[idx]
  if (card.type !== 'skill') return

  p.hand.splice(idx, 1)
  s.discardPile.push(card)
  const meta = SKILLS[card.skill]

  switch (card.skill) {
    case 'doubleFeed':
      s.turnState.foodAllowed += 1
      pushLog(s, `${p.name}: ${meta.name} — 이번 턴 먹이 ${s.turnState.foodAllowed}장까지!`, p.isHuman ? 'me' : 'ai')
      break
    case 'times2':
      s.turnState.times2Pending = true
      pushLog(s, `${p.name}: ${meta.name} — 다음 먹이 2배!`, p.isHuman ? 'me' : 'ai')
      break
    case 'minus2':
      s.dragon.current = Math.max(0, s.dragon.current - 2)
      pushLog(s, `${p.name}: ${meta.name} — 포만감 ${s.dragon.current}/${s.dragon.max}`, p.isHuman ? 'me' : 'ai')
      break
    case 'digest':
      s.dragon.current = Math.max(0, s.dragon.current - 5)
      pushLog(s, `${p.name}: ${meta.name} — 포만감 ${s.dragon.current}/${s.dragon.max}`, p.isHuman ? 'me' : 'ai')
      break
    case 'flip':
      s.direction *= -1
      pushLog(s, `${p.name}: ${meta.name} — 진행 방향이 바뀌었어요!`, p.isHuman ? 'me' : 'ai')
      break
    default:
      break
  }

  checkEmptyHandWin(s, p)
}

// Handle the dragon reaching / exceeding its max after a food card.
function resolveDragon(s, p) {
  if (s.dragon.current < s.dragon.max) return

  if (s.dragon.current === s.dragon.max) {
    pushLog(s, `🐲 딱 맞게 배불러서 만족! 포만감이 리셋돼요.`, 'good')
  } else {
    const drew = drawN(s, p, 3)
    pushLog(s, `💥 포만감 초과! ${p.name}가 패널티로 ${drew}장을 뽑아요.`, 'bad')
  }
  flipSatiety(s)
  pushLog(s, `새 포만감 카드: 드래곤 최대 ${s.dragon.max}`, 'system')
}

function checkEmptyHandWin(s, p) {
  if (p.hand.length === 0) {
    s.phase = 'gameover'
    s.winner = p.id
    pushLog(s, `🏆 ${p.name}가 손패를 모두 소진! 승리!`, 'win')
  }
}

// End the current player's turn: apply the "no food = draw 1" penalty,
// then advance to the next player and check round / game end.
export function endTurn(s) {
  if (s.phase !== 'playing') return
  const p = currentPlayer(s)

  if (s.turnState.foodPlayed === 0) {
    const drew = drawN(s, p, 1)
    pushLog(s, `${p.name}: 먹이를 못 내서 패널티 ${drew}장.`, p.isHuman ? 'me' : 'ai')
    // A penalty draw can't make you win, but hand is definitely non-empty now.
  }

  s.totalTurns++
  advance(s)
}

function advance(s) {
  const n = s.players.length
  s.current = ((s.current + s.direction) % n + n) % n
  s.turnState = freshTurn()
  s.round = Math.floor(s.totalTurns / n) + 1

  if (s.totalTurns >= ROUNDS_TO_END * n) {
    endByRounds(s)
  }
}

function endByRounds(s) {
  const min = Math.min(...s.players.map((p) => p.hand.length))
  const winners = s.players.filter((p) => p.hand.length === min).map((p) => p.id)
  s.phase = 'gameover'
  s.winner = winners.length === 1 ? winners[0] : winners
  const names = winners.map((id) => s.players[id].name).join(', ')
  pushLog(s, `⏱️ ${ROUNDS_TO_END}라운드 종료! 손패 최소(${min}장): ${names} 승리!`, 'win')
}

export { cardLabel }
