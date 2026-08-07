export default function TitleScreen({ onStart }) {
  return (
    <div className="title-screen">
      <div className="title-dragon">🐲</div>
      <h1 className="title-main">Do not feed the dragon</h1>
      <p className="title-sub">드래곤을 배터지게 하지 마세요. 먼저 손패를 비우는 사람이 승리!</p>

      <button className="btn btn-primary btn-big" onClick={onStart}>
        게임 시작
      </button>

      <div className="rules-card">
        <h2>규칙 한눈에</h2>
        <ul>
          <li>나 + AI 3명, 총 4명이 시작할 때 <b>7장</b>씩 손패를 받아요.</li>
          <li>내 턴에는 <b>먹이 카드 1장</b>(스킬로 늘 수 있음)과 <b>스킬 카드는 무제한</b>으로 낼 수 있어요.</li>
          <li>먹이 숫자가 드래곤에 쌓여요. <b>딱 맞게 채우면</b> 만족하고 리셋! <b>넘기면</b> 패널티 3장!</li>
          <li>먹이를 한 장도 못 내면 패널티 1장.</li>
          <li><b>손패를 먼저 비우면 즉시 승리.</b> 5라운드가 끝나면 손패가 가장 적은 사람이 승리.</li>
        </ul>
      </div>

      <p className="title-foot">GGA · 선생님 예시 게임</p>
    </div>
  )
}
