// Card definitions & deck construction for "Do not feed the dragon"
//
// Two kinds of things get shuffled:
//  - The MAIN deck: food cards + skill cards (players draw from here).
//  - The SATIETY deck: the dragon's "max fullness" cards, flipped one at a time.

let _id = 0
const nextId = () => `c${_id++}`

// ---- Skill card metadata -------------------------------------------------
export const SKILLS = {
  doubleFeed: { key: 'doubleFeed', name: '두번먹이기', emoji: '🍽️', desc: '이번 턴에 먹이를 2장까지 낼 수 있어요.' },
  times2:     { key: 'times2',     name: '×2',       emoji: '✖️', desc: '이번 턴에 내는 다음 먹이 숫자를 2배로.' },
  minus2:     { key: 'minus2',     name: '-2',       emoji: '🔽', desc: '드래곤의 현재 포만감을 2 줄여요.' },
  flip:       { key: 'flip',       name: '뒤집기',    emoji: '🔄', desc: '턴 진행 방향을 반대로 바꿔요.' },
  digest:     { key: 'digest',     name: '소화',      emoji: '💨', desc: '드래곤의 현재 포만감을 5 줄여요. (최강)' },
}

// ---- Main deck -----------------------------------------------------------
// Base (44 cards) composition from the design doc:
//   먹이 1~5 : 6장씩 (30)
//   두번먹이기 / ×2 / -2 / 뒤집기 : 3장씩 (12)
//   소화(-5) : 2장
export function buildMainDeck() {
  const cards = []

  // Food cards 1..5, 6 copies each
  for (let value = 1; value <= 5; value++) {
    for (let i = 0; i < 6; i++) {
      cards.push({ id: nextId(), type: 'food', value })
    }
  }

  // Skill cards, 3 copies each
  for (const key of ['doubleFeed', 'times2', 'minus2', 'flip']) {
    for (let i = 0; i < 3; i++) {
      cards.push({ id: nextId(), type: 'skill', skill: key })
    }
  }

  // Digest (-5), 2 copies
  for (let i = 0; i < 2; i++) {
    cards.push({ id: nextId(), type: 'skill', skill: 'digest' })
  }

  return cards
}

// ---- Satiety deck --------------------------------------------------------
// Dragon max fullness values 6..10, 3 copies each (15 cards).
export function buildSatietyDeck() {
  const cards = []
  for (let value = 6; value <= 10; value++) {
    for (let i = 0; i < 3; i++) {
      cards.push({ id: nextId(), type: 'satiety', value })
    }
  }
  return cards
}

// Fisher–Yates shuffle. Pass a rng (0..1) so runs are reproducible if needed.
export function shuffle(cards, rng = Math.random) {
  const a = cards.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Human-readable label used on the card face / logs.
export function cardLabel(card) {
  if (card.type === 'food') return String(card.value)
  if (card.type === 'satiety') return String(card.value)
  return SKILLS[card.skill]?.name ?? card.skill
}
