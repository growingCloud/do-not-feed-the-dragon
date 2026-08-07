// A simple heuristic AI that plays one full turn.
//
// Strategy, in priority order:
//  1. If it can hit the dragon's max EXACTLY (safe reset), do it — ideally with ×2.
//  2. Otherwise play the largest food that stays under max (dump big cards safely).
//  3. If no food is safe, use 소화/-2 to make room, then play.
//  4. Never willingly overflow; if nothing is safe, skip food (take the 1-card penalty).
//  5. At end of turn, dump low-risk skill cards to shrink the hand (racing to empty).

import { playFood, playSkill, endTurn, currentPlayer, canPlayFood, spaceLeft } from './engine.js'

export function aiTakeTurn(s) {
  const p = currentPlayer(s)
  const foods = () => p.hand.filter((c) => c.type === 'food')
  const skill = (key) => p.hand.find((c) => c.type === 'skill' && c.skill === key)

  // Set up a double-feed if there's clearly room to dump two foods.
  if (skill('doubleFeed') && foods().length >= 2 && spaceLeft(s) >= 2) {
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
    if (!choice && skill('times2')) {
      const cand = myFoods.find((c) => c.value * 2 === sp)
      if (cand) {
        choice = cand
        useTimes2 = true
      }
    }

    // 2. Largest food that stays safe (<= space).
    if (!choice) {
      const safe = myFoods.filter((c) => c.value <= sp).sort((a, b) => b.value - a.value)
      if (safe.length) choice = safe[0]
    }

    // 3. No safe food → try to make room, then re-evaluate.
    if (!choice) {
      const reducer = skill('digest') || skill('minus2')
      if (reducer && sp < 5) {
        playSkill(s, reducer.id)
        continue
      }
      break // 4. take the 1-card penalty instead of overflowing
    }

    if (useTimes2) playSkill(s, skill('times2').id)
    playFood(s, choice.id)
  }

  if (s.phase !== 'playing') return

  // 5. Dump low-risk skills to shrink the hand.
  for (const c of p.hand.filter((c) => c.type === 'skill' && c.skill === 'flip')) {
    playSkill(s, c.id)
    if (s.phase !== 'playing') return
  }
  // When close to winning, dump the remaining setup skills too.
  if (p.hand.length <= 3) {
    for (const c of p.hand.filter((c) => c.type === 'skill' && (c.skill === 'times2' || c.skill === 'doubleFeed'))) {
      playSkill(s, c.id)
      if (s.phase !== 'playing') return
    }
  }

  endTurn(s)
}
