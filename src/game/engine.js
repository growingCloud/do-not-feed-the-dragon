// Game engine for "Do not feed the dragon".
//
// Design decisions locked with the user:
//  - 드래곤 최대 포만감: 포만감 카드 10~20 중 1장을 공개 → 그게 이번 max.
//  - 누적합 == max  : 세이프. 포만감 리셋(0) + 새 포만감 카드 공개.
//  - 누적합 >  max  : 낸 사람 패널티 + 리셋 + 새 포만감 카드.
//  - 스킬: 두번먹이기(+1 먹이 허용) / ×2(다음 먹이 2배) / -2 / 뒤집기(방향 반전) / 소화(-5).
//  - 턴에 먹이를 1장도 못 내면 패널티. 턴 종료 시 정해진 수만큼 드로우.
//  - 승리: 손패 먼저 소진 = 즉시 승리. 아니면 N라운드 후 손패 최소가 승리.
//
// Engine functions MUTATE the passed state. The React layer clones (structuredClone)
// before each call so state transitions stay immutable from React's point of view.

import { buildMainDeck, buildSatietyDeck, shuffle, SKILLS, cardLabel } from './cards.js'

// ---- Tunable rules -------------------------------------------------------
// 여기 숫자만 바꾸면 게임 밸런스가 통째로 조정됩니다.
export const RULES = {
  startHand: 7,         // 시작 손패
  drawPerTurn: 2,       // 턴 종료 시 자동 드로우 (0이면 없음)
  maxSkillsPerTurn: 2,  // 턴당 스킬 최대 사용 수 (0이면 무제한)
  baseFoodPerTurn: 1,   // 기본 먹이 허용 수 (두번먹이기가 +1)
  roundsToEnd: 5,       // 몇 라운드 후 종료
  noFoodPenalty: 1,     // 먹이 못 냈을 때 패널티 드로우
  overflowPenalty: 3,   // 포만감 초과 시 패널티 드로우
}

export const ROUNDS_TO_END = RULES.roundsToEnd
export const START_HAND = RULES.startHand

const AI_NAMES = ['드래곤 훈련사 A', '드래곤 훈련사 B', '드래곤 훈련사 C']

export function createGame(difficulty = 'normal') {
  const drawPile = shuffle(buildMainDeck())
  const satietyPile = shuffle(buildSatietyDeck())

  const players = [
    { id: 0, name: '나', isHuman: true, hand: [] },
    ...AI_NAMES.map((name, i) => ({ id: i + 1, name, isHuman: false, hand: [] })),
  ]

  const s = {
    players,
    difficulty,
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
    for (let i = 0; i < RULES.startHand; i++) drawOne(s, p)
  }

  // Flip the first satiety card → the dragon's starting appetite.
  flipSatiety(s)
  pushLog(s, `게임 시작! 드래곤은 최대 ${s.dragon.max}까지 먹을 수 있어요.`, 'system')

  return s
}

function freshTurn() {
  // dragonTriggered: 이번 턴에 드래곤이 리셋/초과로 "반응"했는지.
  // 반응한 뒤로는 무작위(드로우·새 포만감)가 공개되므로 실행 취소를 잠급니다.
  return { foodPlayed: 0, foodAllowed: RULES.baseFoodPerTurn, times2Pending: false, skillsPlayed: 0, dragonTriggered: false }
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
export function canPlaySkill(s) {
  return RULES.maxSkillsPerTurn === 0 || s.turnState.skillsPlayed < RULES.maxSkillsPerTurn
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
  if (!canPlaySkill(s)) return

  p.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.turnState.skillsPlayed++
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

  // The dragon "reacted" — lock undo for the rest of this turn.
  s.turnState.dragonTriggered = true

  if (s.dragon.current === s.dragon.max) {
    pushLog(s, `🐲 딱 맞게 배불러서 만족! 포만감이 리셋돼요.`, 'good')
  } else {
    const drew = drawN(s, p, RULES.overflowPenalty)
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

// End the current player's turn: apply the "no food" penalty, then the
// per-turn draw, then advance to the next player and check round / game end.
export function endTurn(s) {
  if (s.phase !== 'playing') return
  const p = currentPlayer(s)

  if (s.turnState.foodPlayed === 0 && RULES.noFoodPenalty > 0) {
    const drew = drawN(s, p, RULES.noFoodPenalty)
    pushLog(s, `${p.name}: 먹이를 못 내서 패널티 ${drew}장.`, p.isHuman ? 'me' : 'ai')
  }

  if (RULES.drawPerTurn > 0) {
    const drew = drawN(s, p, RULES.drawPerTurn)
    if (drew) pushLog(s, `${p.name}: 턴 종료 드로우 ${drew}장.`, p.isHuman ? 'me' : 'ai')
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

// Sum of remaining FOOD card values in a hand — the tiebreaker weight.
export function foodSum(player) {
  return player.hand.reduce((a, c) => a + (c.type === 'food' ? c.value : 0), 0)
}

function endByRounds(s) {
  const minCount = Math.min(...s.players.map((p) => p.hand.length))
  let contenders = s.players.filter((p) => p.hand.length === minCount)

  // Tiebreaker (a): fewest cards → smallest sum of remaining food values wins.
  let tiebroken = false
  if (contenders.length > 1) {
    const minSum = Math.min(...contenders.map(foodSum))
    const narrowed = contenders.filter((p) => foodSum(p) === minSum)
    if (narrowed.length < contenders.length) tiebroken = true
    contenders = narrowed
  }

  const winners = contenders.map((p) => p.id)
  s.phase = 'gameover'
  s.winner = winners.length === 1 ? winners[0] : winners
  const names = winners.map((id) => s.players[id].name).join(', ')
  const tb = tiebroken ? ' (동점 → 먹이 숫자 합 최소로 판정)' : ''
  pushLog(s, `⏱️ ${ROUNDS_TO_END}라운드 종료! 손패 최소(${minCount}장)${tb}: ${names} 승리!`, 'win')
}

export { cardLabel }
