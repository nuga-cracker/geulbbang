/**
 * game.js — 성장형 게임 시스템
 * 경험치(EXP), 레벨, 빵 등급, 배지/도전과제를 관리합니다.
 */

// ─────────────────────────────────────────────
// 1. 빵 등급 정의 (레벨 기반)
// ─────────────────────────────────────────────
export const BREAD_GRADES = [
  { level: 1,  name: '반죽',       emoji: '🫙', description: '아직 반죽 단계예요. 계속 써봐요!' },
  { level: 3,  name: '식빵',       emoji: '🍞', description: '드디어 식빵이 됐어요! 첫 빵 완성!' },
  { level: 6,  name: '모닝빵',     emoji: '🥐', description: '폭신폭신 모닝빵! 글쓰기 실력이 늘고 있어요!' },
  { level: 10, name: '크루아상',   emoji: '🥐', description: '겹겹이 쌓인 크루아상! 문장이 쫄깃해지고 있어요!' },
  { level: 15, name: '바게트',     emoji: '🥖', description: '바삭한 바게트! 자신만의 문체가 생겼어요!' },
  { level: 20, name: '명품 바게트', emoji: '🥖✨', description: '드디어 명품 바게트! 글쓰기 마스터!' },
];

// ─────────────────────────────────────────────
// 2. 레벨별 필요 EXP 계산
// ─────────────────────────────────────────────
const BASE_EXP = 100; // 1레벨 → 2레벨에 필요한 EXP

/**
 * 주어진 레벨에서 다음 레벨로 올라가는 데 필요한 총 EXP를 반환합니다.
 * @param {number} level
 * @returns {number}
 */
export function expForNextLevel(level) {
  return BASE_EXP * level;
}

// ─────────────────────────────────────────────
// 3. 현재 레벨에 해당하는 빵 등급 반환
// ─────────────────────────────────────────────
export function getBreadGrade(level) {
  let grade = BREAD_GRADES[0];
  for (const g of BREAD_GRADES) {
    if (level >= g.level) grade = g;
    else break;
  }
  return grade;
}

// ─────────────────────────────────────────────
// 4. 배지 정의
// ─────────────────────────────────────────────
export const BADGE_DEFS = [
  {
    id: 'first_bake',
    name: '첫 빵 완성! 🍞',
    description: '처음으로 빵 굽기(첨삭)를 해봤어요!',
    check: (state) => state.totalWritings >= 1,
  },
  {
    id: 'three_revisions',
    name: '치대기 달인 🥊',
    description: '같은 글을 3번 고쳐 썼어요!',
    check: (state, extra) => (extra && extra.revisionCount >= 3),
  },
  {
    id: 'five_revisions',
    name: '오 번 도전 🏆',
    description: '한 글을 5번이나 고쳐 썼어요!',
    check: (state, extra) => (extra && extra.revisionCount >= 5),
  },
  {
    id: 'ten_writings',
    name: '글쓰기 열정 🔥',
    description: '총 10편의 글을 첨삭받았어요!',
    check: (state) => state.totalWritings >= 10,
  },
  {
    id: 'streak_3',
    name: '3일 연속 🗓️',
    description: '3일 연속으로 글을 썼어요!',
    check: (state) => state.streakDays >= 3,
  },
  {
    id: 'streak_7',
    name: '일주일 글쓰기 📅',
    description: '7일 연속으로 글을 썼어요!',
    check: (state) => state.streakDays >= 7,
  },
  {
    id: 'long_text',
    name: '긴 글 마스터 📜',
    description: '300자 이상의 글을 완성했어요!',
    check: (state, extra) => (extra && extra.charCount >= 300),
  },
  {
    id: 'perfect_score',
    name: '완벽한 빵 💯',
    description: '맛있음 점수 90점 이상을 받았어요!',
    check: (state, extra) => (extra && extra.score >= 90),
  },
  {
    id: 'level5',
    name: '레벨 5 달성 ⭐',
    description: '레벨 5에 도달했어요!',
    check: (state) => state.level >= 5,
  },
  {
    id: 'level10',
    name: '레벨 10 달성 🌟',
    description: '레벨 10에 도달했어요!',
    check: (state) => state.level >= 10,
  },
  {
    id: 'portfolio_5',
    name: '진열장 채우기 🗂️',
    description: '진열장에 5개의 빵을 모았어요!',
    check: (state) => state.portfolio.length >= 5,
  },
  {
    id: 'daily_done',
    name: '오늘의 빵 🌅',
    description: '오늘의 글감으로 첫 빵을 구웠어요!',
    check: (state) => state.lastDailyDate !== null,
  },
];

// ─────────────────────────────────────────────
// 5. EXP 획득 계산
// ─────────────────────────────────────────────

/**
 * 첨삭받기 결과를 바탕으로 획득 EXP를 계산합니다.
 * 재작성 횟수가 많을수록 더 많은 EXP를 줍니다(반복 개선 강하게 보상).
 * @param {{ score: number, stats: Object, revisionCount: number }} param
 * @returns {number}
 */
export function calcExpGain({ score, stats, revisionCount }) {
  let exp = 10; // 기본 EXP

  // 점수 비례 보너스
  exp += Math.floor(score / 10);

  // 글자 수 보너스 (50자당 5 EXP, 최대 50)
  exp += Math.min(Math.floor(stats.charCount / 50) * 5, 50);

  // 재작성 보너스 (재작성 1회당 15 EXP, 최대 90) — 반복 개선을 강하게 보상
  exp += Math.min(revisionCount * 15, 90);

  return exp;
}

// ─────────────────────────────────────────────
// 6. 레벨업 처리
// ─────────────────────────────────────────────

/**
 * state에 EXP를 추가하고, 레벨업이 필요하면 레벨을 올립니다.
 * 레벨업 횟수를 반환합니다.
 * @param {Object} state - 현재 게임 상태 (변경됨)
 * @param {number} expGain - 획득할 EXP
 * @returns {number} 레벨업 횟수
 */
export function addExp(state, expGain) {
  state.exp += expGain;
  let levelUps = 0;
  while (state.exp >= expForNextLevel(state.level)) {
    state.exp -= expForNextLevel(state.level);
    state.level += 1;
    levelUps += 1;
  }
  return levelUps;
}

// ─────────────────────────────────────────────
// 7. 배지 체크 & 새로 획득한 배지 반환
// ─────────────────────────────────────────────

/**
 * 현재 상태를 기반으로 새로 획득한 배지 목록을 반환하고
 * state.badges를 갱신합니다.
 * @param {Object} state - 현재 게임 상태 (변경됨)
 * @param {Object} [extra] - 추가 체크 데이터 (score, charCount, revisionCount 등)
 * @returns {Array} 새로 획득한 배지 정의 배열
 */
export function checkBadges(state, extra = {}) {
  const newBadges = [];
  for (const def of BADGE_DEFS) {
    if (!state.badges.includes(def.id) && def.check(state, extra)) {
      state.badges.push(def.id);
      newBadges.push(def);
    }
  }
  return newBadges;
}

// ─────────────────────────────────────────────
// 8. 오늘의 글감 목록
// ─────────────────────────────────────────────
export const DAILY_PROMPTS = [
  '내가 가장 좋아하는 음식은 무엇이고, 왜 좋아하나요?',
  '내 인생에서 가장 행복했던 순간을 떠올려 보세요.',
  '만약 하루 동안 어디든 갈 수 있다면 어디로 가고 싶나요?',
  '내가 존경하는 사람은 누구이고, 그 이유는 무엇인가요?',
  '봄, 여름, 가을, 겨울 중 내가 제일 좋아하는 계절과 그 이유는?',
  '나만의 비밀 장소가 있다면 어떤 곳인가요?',
  '10년 후의 나는 어떤 모습일까요?',
  '내가 가장 좋아하는 책이나 영화 이야기를 들려주세요.',
  '처음으로 무언가를 해봤을 때의 기억을 떠올려 보세요.',
  '오늘 나를 가장 기쁘게 한 것은 무엇인가요?',
  '친구에게 감사하고 싶은 일이 있나요?',
  '동물 중 하나로 변신할 수 있다면 어떤 동물이 되고 싶나요?',
  '내가 세상에서 바꾸고 싶은 것은 무엇인가요?',
  '가장 기억에 남는 여행이나 나들이 이야기를 써보세요.',
  '내가 최근에 배운 새로운 것은 무엇인가요?',
  '나를 가장 잘 표현하는 색깔은 무엇이고 왜인가요?',
  '어릴 때 꿈과 지금의 꿈은 같나요? 달라졌다면 어떻게?',
  '비가 오는 날, 내가 하고 싶은 것들을 써봐요.',
  '음식을 직접 만들어 본 경험이 있나요? 어떤 느낌이었나요?',
  '내 가족 중 한 명을 소개해 주세요.',
  '로봇이나 AI가 나를 도와준다면 어떤 일을 시키고 싶나요?',
  '세상에서 가장 중요한 발명품은 무엇이라고 생각하나요?',
  '마법 지팡이가 생긴다면 무엇을 바꾸고 싶나요?',
  '내가 직접 만들고 싶은 음식이 있다면 무엇인가요?',
  '가장 좋아하는 게임이나 스포츠에 대해 써보세요.',
  '내 방(공간)을 소개해 주세요.',
  '우정이란 무엇이라고 생각하나요?',
  '내가 배우고 싶은 것들의 목록을 써보세요.',
  '아침에 눈 떴을 때 제일 먼저 드는 생각은 무엇인가요?',
  '나에게 슈퍼파워가 생긴다면 무엇이 좋을까요?',
];

/**
 * 날짜를 기반으로 오늘의 글감을 반환합니다.
 * @returns {string}
 */
export function getDailyPrompt() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}
