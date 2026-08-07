import { useState } from 'react'
import { RULES } from '../game/engine.js'
import Codex from './Codex.jsx'

const DIFFICULTIES = [
  { key: 'easy', label: '쉬움', emoji: '🥚', desc: 'AI가 실수를 자주 해요.' },
  { key: 'normal', label: '보통', emoji: '🐉', desc: '딱 맞추고 방어도 해요.' },
  { key: 'hard', label: '어려움', emoji: '🔥', desc: '전략적으로 플레이 해요.' },
]

export default function TitleScreen({ onStart, difficulty = 'normal', timerOn = false }) {
  const [selected, setSelected] = useState(difficulty)
  const [timer, setTimer] = useState(timerOn)

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

      <div className="start-row">
        <button className="btn btn-primary btn-big" onClick={() => onStart(selected, timer)}>
          게임 시작
        </button>
        <button
          type="button"
          className={`timer-toggle ${timer ? 'is-on' : ''}`}
          onClick={() => setTimer((v) => !v)}
          title="켜면 내 턴에 10초 제한이 걸려요. 시간이 다 되면 자동으로 턴이 종료됩니다."
        >
          <span className="timer-toggle-icon">⏱️</span>
          <span className="timer-toggle-label">턴 10초 제한</span>
          <span className={`switch ${timer ? 'switch-on' : ''}`}><span className="switch-knob" /></span>
        </button>
      </div>

      <div className="rules-card">
        <h2>플레이 규칙</h2>
        <ul>
          <li>나 + AI 3명, <b>총 4명</b>이 함께 대결합니다.</li>
          <li>시작 카드는 <b>{RULES.startHand}장</b>, 내 턴이 시작할 때마다 새로운 카드를 <b>{RULES.drawPerTurn}장</b> 받아요.</li>
          <li>내 턴에는 반드시 <b>먹이 카드 {RULES.baseFoodPerTurn}장</b>을 내야 합니다. 못 내면 추가 패널티 {RULES.noFoodPenalty}장.</li>
          <li>스킬 카드는 한 턴에 <b>최대 {RULES.maxSkillsPerTurn}장</b>까지 낼 수 있어요.</li>
          <li>드래곤이 배가 부를 때까지 먹이를 주세요. <b>딱 맞게 주면</b> 카드를 한 장 버릴 수 있어요.</li>
          <li>만약 포만감 숫자를 <b>초과</b>한다면? 드래곤이 화가 나서 카드를 <b>0~{RULES.overflowPenalty}장 랜덤</b>으로 더 줘요. (운 좋으면 0장!)</li>
          <li>
            <b>{RULES.roundsToEnd}라운드</b>가 끝난 후, 내 핸드의 카드 수가 가장 적은 사람이 승리합니다!
            <ul>
              <li>카드의 수가 같다면, 남은 먹이의 수 합계가 적은 사람이 승리합니다.</li>
              <li>{RULES.roundsToEnd}라운드가 끝나기 전에 핸드의 카드를 모두 사용해도 승리합니다.</li>
            </ul>
          </li>
        </ul>
      </div>

      <Codex />

      <p className="title-foot">GGA · 선생님 예시 게임</p>
    </div>
  )
}
