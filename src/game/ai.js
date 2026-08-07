// A heuristic AI that plays one full turn, tuned by difficulty.
//
// Base strategy, in priority order:
//  1. If it can hit the dragon's max EXACTLY (safe reset), do it — ideally with ×2.
//  2. Otherwise play the largest food that stays under max (dump big cards safely).
//  3. If no food is safe, use 소화/-2 to make room, then play.
//  4. Never willingly overflow; if nothing is safe, skip food (take the 1-card penalty).
//  5. At end of turn, dump low-risk skill cards to shrink the hand (racing to empty).
//
// Difficulty dials which of those smarts are enabled:
//  - easy  : makes mistakes — random safe pick, no ×2 setup, no room-making,
//            overflows when cornered, never dumps skills to race.
//  - normal: the full base strategy above.
//  - hard  : base strategy + always races to empty its hand.

import { playFood, playSkill, endTurn, discardReward, skipDiscard, currentPlayer, canPlayFood, canPlaySkill, spaceLeft } from './engine.js'

// Resolve a "hit exactly" reward: dump the biggest food (hardest to place later),
// or any card if no food remains.
function aiDiscard(s) {
  const p = currentPlayer(s)
  if (p.hand.length === 0) {
    skipDiscard(s)
    return
  }
  const foods = p.hand.filter((c) => c.type === 'food').sort((a, b) => b.value - a.value)
  const target = foods[0] || p.hand[p.hand.length - 1]
  discardReward(s, target.id)
}

const CONFIG = {
  easy: { useDoubleFeed: false, useTimes2Exact: false, makeRoom: false, foodPick: 'randomSafe', allowOverflow: true, dumpSkills: 'none' },
  normal: { useDoubleFeed: true, useTimes2Exact: true, makeRoom: true, foodPick: 'largestSafe', allowOverflow: false, dumpSkills: 'race' },
  hard: { useDoubleFeed: true, useTimes2Exact: true, makeRoom: true, foodPick: 'largestSafe', allowOverflow: false, dumpSkills: 'always' },
}

export function aiTakeTurn(s, difficulty = 'normal') {
  const cfg = CONFIG[difficulty] || CONFIG.normal
  const p = currentPlayer(s)
  const foods = () => p.hand.filter((c) => c.type === 'food')
  const skill = (key) => p.hand.find((c) => c.type === 'skill' && c.skill === key)

  // Set up a double-feed if there's clearly room to dump two foods.
  if (cfg.useDoubleFeed && canPlaySkill(s) && skill('doubleFeed') && foods().length >= 2 && spaceLeft(s) >= 2) {
    playSkill(s, skill('doubleFeed').id)
  }

  let guard = 0
  while (canPlayFood(s) && guard++ < 20) {
    if (s.phase !== 'playing') return
    const sp = spaceLeft(s)
    const myFoods = foods()
    if (myFoods.length === 0) break

    // 1. Exact hit without help.
    let choice = myFoods.find((c) => c.value === sp)
    let useTimes2 = false

    // 1b. Exact hit using ×2.
    if (!choice && cfg.useTimes2Exact && canPlaySkill(s) && skill('times2')) {
      const cand = myFoods.find((c) => c.value * 2 === sp)
      if (cand) {
        choice = cand
        useTimes2 = true
      }
    }

    // 2. A safe food (<= space): largest, or random on easy.
    if (!choice) {
      const safe = myFoods.filter((c) => c.value <= sp)
      if (safe.length) {
        choice = cfg.foodPick === 'randomSafe'
          ? safe[Math.floor(Math.random() * safe.length)]
          : [...safe].sort((a, b) => b.value - a.value)[0]
      }
    }

    // 3/4. No safe food.
    if (!choice) {
      if (cfg.makeRoom && sp < 5 && canPlaySkill(s)) {
        const reducer = skill('digest') || skill('minus2')
        if (reducer) {
          playSkill(s, reducer.id)
          continue // re-evaluate with more room
        }
      }
      if (cfg.allowOverflow) {
        // easy AI slips up and overflows with its smallest food
        choice = [...myFoods].sort((a, b) => a.value - b.value)[0]
      } else {
        break // take the 1-card penalty instead of overflowing
      }
    }

    if (useTimes2) playSkill(s, skill('times2').id)
    playFood(s, choice.id)
    if (s.pendingDiscard !== null && s.phase === 'playing') aiDiscard(s)
  }

  if (s.phase !== 'playing') return

  // 5. Dump low-risk skills to shrink the hand (respecting the per-turn skill cap).
  if (cfg.dumpSkills !== 'none') {
    for (const c of p.hand.filter((c) => c.type === 'skill' && c.skill === 'flip')) {
      if (!canPlaySkill(s)) break
      playSkill(s, c.id)
      if (s.phase !== 'playing') return
    }
    const race = cfg.dumpSkills === 'always' || (cfg.dumpSkills === 'race' && p.hand.length <= 3)
    if (race) {
      for (const c of p.hand.filter((c) => c.type === 'skill' && (c.skill === 'times2' || c.skill === 'doubleFeed'))) {
        if (!canPlaySkill(s)) break
        playSkill(s, c.id)
        if (s.phase !== 'playing') return
      }
    }
  }

  endTurn(s)
}
