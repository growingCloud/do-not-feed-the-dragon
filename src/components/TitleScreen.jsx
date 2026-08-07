import { useState } from 'react'
import { RULES } from '../game/engine.js'

const DIFFICULTIES = [
  { key: 'easy', label: '쉬움', emoji: '🥚', desc: 'AI가 실수를 자주 해요. 편하게 즐기기.' },
  { key: 'normal', label: '보통', emoji: '🐉', desc: '똑똑한 AI. 딱 맞추고 방어도 해요.' },
  { key: 'hard', label: '어려움', emoji: '🔥', desc: 'AI가 손패를 공격적으로 비워요.' },
]

export default function TitleScreen({ onStart, difficulty = 'normal' }) {
  const [selected, setSelected] = useState(difficulty)

  return (
    <div className="title-screen">
      <div className="title-dragon">🐲</div>
      <h1 className="title-main">Do not feed the dragon</h1>
      <p className="title-sub">드래곤을 배터지게 하지 마세요. 먼저 손패를 비우는 사람이 승리!</p>

      <div className="diff-picker">
        <div className="diff-picker-label">난이도 선택</div>
        <div className="diff-options">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`diff-option ${selected === d.key ? 'is-selected' : ''}`}
              onClick={() => setSelected(d.key)}
            >
              <span className="diff-emoji">{d.emoji}</span>
              <span className="diff-name">{d.label}</span>
              <span className="diff-desc">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-big" onClick={() => onStart(selected)}>
        게임 시작
      </button>

      <div className="rules-card">
        <h2>규칙 한눈에</h2>
        <ul>
          <li>나 + AI 3명, 총 4명이 시작할 때 <b>{RULES.startHand}장</b>씩 손패를 받아요.</li>
          <li>내 턴에는 <b>먹이 카드 {RULES.baseFoodPerTurn}장</b>(두번먹이기로 늘 수 있음)과 <b>스킬 카드 {RULES.maxSkillsPerTurn === 0 ? '무제한' : `${RULES.maxSkillsPerTurn}장`}</b>을 낼 수 있어요.</li>
          <li>먹이 숫자가 드래곤에 쌓여요. <b>딱 맞게 채우면</b> 만족하고 리셋! <b>넘기면</b> 패널티 {RULES.overflowPenalty}장!</li>
          <li>턴을 마치면 <b>{RULES.drawPerTurn}장 드로우</b>. 먹이를 한 장도 못 내면 추가 패널티 {RULES.noFoodPenalty}장.</li>
          <li><b>손패를 먼저 비우면 즉시 승리.</b> {RULES.roundsToEnd}라운드가 끝나면 손패가 가장 적은 사람이 승리.</li>
        </ul>
      </div>

      <p className="title-foot">GGA · 선생님 예시 게임</p>
    </div>
  )
}
