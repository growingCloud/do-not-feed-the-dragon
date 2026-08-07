// Heuristic AI, tuned by difficulty. The AI acts ONE atomic action per aiStep()
// call so the UI can space actions out (one card flies / one log line at a time).
// aiTakeTurn() just loops aiStep() to completion (used by sims/tests).
//
//  - easy  : makes mistakes — random safe pick, no ×2 setup, no room-making,
//            overflows when cornered, never dumps skills to race.
//  - normal: full strategy.
//  - hard  : full strategy + always races to empty its hand.

import { playFood, playSkill, endTurn, discardReward, skipDiscard, currentPlayer, canPlayFood, canPlaySkill, spaceLeft } from './engine.js'

const CONFIG = {
  easy: { useDoubleFeed: false, useTimes2Exact: false, makeRoom: false, foodPick: 'randomSafe', allowOverflow: true, dumpSkills: 'none' },
  normal: { useDoubleFeed: true, useTimes2Exact: true, makeRoom: true, foodPick: 'largestSafe', allowOverflow: true, dumpSkills: 'race' },
  hard: { useDoubleFeed: true, useTimes2Exact: true, makeRoom: true, foodPick: 'largestSafe', allowOverflow: true, dumpSkills: 'always' },
}

// Resolve a "hit exactly" reward: dump the biggest food, or any card.
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

// Perform exactly ONE action for the current AI. Returns true when the turn is
// complete (endTurn ran, or the game ended).
export function aiStep(s, difficulty = 'normal') {
  if (s.phase !== 'playing') return true
  const cfg = CONFIG[difficulty] || CONFIG.normal
  const p = currentPlayer(s)
  const foods = () => p.hand.filter((c) => c.type === 'food')
  const skill = (key) => p.hand.find((c) => c.type === 'skill' && c.skill === key)
  const sp = spaceLeft(s)
  const done = () => s.phase !== 'playing'

  // 0. Resolve an owed "hit exactly" discard.
  if (s.pendingDiscard !== null) {
    aiDiscard(s)
    return done()
  }

  // 1. A ×2 is pending → play the food it was set up for.
  if (s.turnState.times2Pending && canPlayFood(s)) {
    const myFoods = foods()
    const choice =
      myFoods.find((c) => c.value * 2 === sp) ||
      myFoods.filter((c) => c.value <= sp).sort((a, b) => b.value - a.value)[0] ||
      [...myFoods].sort((a, b) => a.value - b.value)[0]
    if (choice) {
      playFood(s, choice.id)
      return done()
    }
  }

  // 2. Set up double-feed once, before any food.
  if (
    cfg.useDoubleFeed &&
    canPlaySkill(s) &&
    s.turnState.foodPlayed === 0 &&
    s.turnState.foodAllowed < 2 &&
    skill('doubleFeed') &&
    foods().length >= 2 &&
    sp >= 2
  ) {
    playSkill(s, skill('doubleFeed').id)
    return false
  }

  // 3. Play food if allowed.
  if (canPlayFood(s) && foods().length > 0) {
    const myFoods = foods()

    // exact hit without help
    let choice = myFoods.find((c) => c.value === sp)
    if (choice) {
      playFood(s, choice.id)
      return done()
    }

    // set up ×2 for an exact hit (rule 1 plays the food on the next step)
    if (cfg.useTimes2Exact && canPlaySkill(s) && skill('times2') && myFoods.some((c) => c.value * 2 === sp)) {
      playSkill(s, skill('times2').id)
      return false
    }

    // largest / random safe food
    const safe = myFoods.filter((c) => c.value <= sp)
    if (safe.length) {
      choice = cfg.foodPick === 'randomSafe' ? safe[Math.floor(Math.random() * safe.length)] : [...safe].sort((a, b) => b.value - a.value)[0]
      playFood(s, choice.id)
      return done()
    }

    // no safe food → make room with a reducer
    if (cfg.makeRoom && sp < 5 && canPlaySkill(s)) {
      const reducer = skill('digest') || skill('minus2')
      if (reducer) {
        playSkill(s, reducer.id)
        return false
      }
    }

    // overflow gamble
    if (cfg.allowOverflow) {
      choice = [...myFoods].sort((a, b) => a.value - b.value)[0]
      playFood(s, choice.id)
      return done()
    }
    // else fall through to dump / end
  }

  // 4. Dump low-risk skills to shrink the hand.
  if (cfg.dumpSkills !== 'none' && canPlaySkill(s)) {
    const flip = skill('flip')
    if (flip) {
      playSkill(s, flip.id)
      return false
    }
    const race = cfg.dumpSkills === 'always' || (cfg.dumpSkills === 'race' && p.hand.length <= 3)
    if (race) {
      const dumpable = skill('times2') || skill('doubleFeed')
      if (dumpable) {
        playSkill(s, dumpable.id)
        return false
      }
    }
  }

  // 5. Nothing left → end the turn.
  endTurn(s)
  return true
}

// Full turn in one go (sims/tests).
export function aiTakeTurn(s, difficulty = 'normal') {
  let guard = 0
  while (!aiStep(s, difficulty) && guard++ < 60) {
    /* keep stepping */
  }
}
