// Card definitions & deck construction for "Do not feed the dragon"
//
// Two kinds of things get shuffled:
//  - The MAIN deck: food cards + skill cards (players draw from here).
//  - The SATIETY deck: the dragon's "max fullness" cards, flipped one at a time.

let _id = 0
const nextId = () => `c${_id++}`

// ---- Skill card metadata -------------------------------------------------
// `face` sets how the name is split across lines on the card face.
export const SKILLS = {
  doubleFeed: { key: 'doubleFeed', name: '먹이 한번 더', face: ['먹이', '한번 더'], emoji: '🍽️', desc: '이번 턴에 먹이를 한 번 더 낼 수 있어요.' },
  times2:     { key: 'times2',     name: '먹이 양 ×2', face: ['먹이 양', '×2'],   emoji: '✖️', desc: '다음에 내는 먹이 숫자를 2배로.' },
  minus2:     { key: 'minus2',     name: '-2',        face: ['-2'],              emoji: '🔽', desc: '드래곤의 현재 포만감을 2 줄여요.' },
  flip:       { key: 'flip',       name: '순서 바꾸기', face: ['순서', '바꾸기'],  emoji: '🔄', desc: '턴 진행 방향을 반대로 바꿔요.' },
  digest:     { key: 'digest',     name: '-5',        face: ['-5'],              emoji: '🔽', desc: '드래곤의 현재 포만감을 5 줄여요.' },
}

// ---- Main deck -----------------------------------------------------------
// Food distribution: weight higher values so the dragon overflows more often
// (fewer small "safe" cards to fine-tune with). Tweak these counts to taste.
export const FOOD_COUNTS = { 1: 4, 2: 6, 3: 8, 4: 8, 5: 6 } // total 32 — mid-weighted (3·4 두텁게)
export const SKILL_COUNTS = { doubleFeed: 3, times2: 3, minus2: 3, flip: 3, digest: 2 } // total 14

export function buildMainDeck() {
  const cards = []

  // Food cards 1..5, per FOOD_COUNTS
  for (let value = 1; value <= 5; value++) {
    for (let i = 0; i < (FOOD_COUNTS[value] ?? 0); i++) {
      cards.push({ id: nextId(), type: 'food', value })
    }
  }

  // Skill cards, per SKILL_COUNTS
  for (const [key, n] of Object.entries(SKILL_COUNTS)) {
    for (let i = 0; i < n; i++) {
      cards.push({ id: nextId(), type: 'skill', skill: key })
    }
  }

  return cards
}

// Full deck breakdown (count + probability) for the card codex.
export function deckBreakdown() {
  const total =
    Object.values(FOOD_COUNTS).reduce((a, b) => a + b, 0) +
    Object.values(SKILL_COUNTS).reduce((a, b) => a + b, 0)

  const foods = [1, 2, 3, 4, 5].map((value) => ({
    card: { type: 'food', value },
    count: FOOD_COUNTS[value] ?? 0,
    effect: `드래곤 포만감 +${value}`,
  }))

  const skills = Object.keys(SKILL_COUNTS).map((key) => ({
    card: { type: 'skill', skill: key },
    count: SKILL_COUNTS[key],
    effect: SKILLS[key].desc,
  }))

  const withPct = (e) => ({ ...e, pct: total ? (e.count / total) * 100 : 0 })
  return { total, foods: foods.map(withPct), skills: skills.map(withPct) }
}

// ---- Satiety deck --------------------------------------------------------
// Dragon max fullness values 10..20, one copy each (11 cards).
export function buildSatietyDeck() {
  const cards = []
  for (let value = 10; value <= 20; value++) {
    cards.push({ id: nextId(), type: 'satiety', value })
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
