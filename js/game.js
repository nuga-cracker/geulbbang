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
  { level: 15, name: '바게트',     emoji: '🥖', description: '바삭한 바게트! 자신만의 글빵 레시피가 생겼어요!' },
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
    name: '다섯 번 도전 🏆',
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
  // ── 문체 레시피 배지 ──────────────────────────────
  {
    id: 'recipe_first',
    name: '첫 레시피 도전 🎨',
    description: '처음으로 글빵 레시피를 선택해 빵을 구웠어요!',
    check: (state, extra) => extra && extra.selectedRecipe && extra.selectedRecipe !== 'free',
  },
  {
    id: 'recipe_variety_3',
    name: '다채로운 제빵사 🎭',
    description: '3가지 이상의 글빵 레시피를 체험했어요!',
    check: (state) => Object.keys(state.recipeUsage || {}).filter(k => k !== 'free').length >= 3,
  },
  {
    id: 'recipe_all',
    name: '글빵 레시피 마스터 🏆',
    description: '6가지 글빵 레시피를 모두 체험했어요!',
    check: (state) => Object.keys(state.recipeUsage || {}).filter(k => k !== 'free').length >= 6,
  },
  {
    id: 'recipe_confession_3',
    name: '고백빵 달인 🌫️',
    description: '부끄러운 고백빵으로 3번 글을 구웠어요!',
    check: (state) => ((state.recipeUsage || {})['confession'] || 0) >= 3,
  },
  {
    id: 'recipe_diary_5',
    name: '다정 일기 마스터 🌸',
    description: '매일 다정 일기빵으로 5번 글을 구웠어요!',
    check: (state) => ((state.recipeUsage || {})['diary'] || 0) >= 5,
  },
  {
    id: 'custom_style_complete',
    name: '나만의 글빵 레시피 완성! 🏆',
    description: '나만의 시그니처 빵을 완성했어요!',
    check: (state) => Boolean(state.customStyle && state.customStyle.ready),
  },
  {
    id: 'style_fingerprint_first',
    name: '글빵 레시피 지문 첫 분석 🔎',
    description: '내 글 분석 결과를 시그니처 빵에 반영했어요!',
    check: (state) => Boolean(state.customStyle && state.customStyle.fingerprint && state.customStyle.fingerprint.applied),
  },
  {
    id: 'slider_artisan',
    name: '슬라이더 장인 🎚️',
    description: '슬라이더로 글빵 레시피를 3번 이상 미세 조정했어요!',
    check: (state) => ((state.customStyle && state.customStyle.sliderAppliedCount) || 0) >= 3,
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
// 8. 글감 데이터베이스 (200개 이상)
// ─────────────────────────────────────────────

/**
 * @typedef {Object} PromptItem
 * @property {string} id
 * @property {string} category
 * @property {string} difficulty  '쉬움' | '보통' | '어려움'
 * @property {string} prompt
 * @property {string} goal
 * @property {string} starter
 */

/** @type {PromptItem[]} */
export const WRITING_PROMPTS = [
  // ── 일기 ───────────────────────────────────────
  {
    id: 'diary-001', category: '일기', difficulty: '쉬움',
    prompt: '오늘 하루 중 가장 기억에 남는 순간을 한 장면처럼 써보세요.',
    goal: '3문장 이상, 감각 표현 1개 넣기',
    starter: '오늘 가장 기억에 남는 순간은...',
  },
  {
    id: 'diary-002', category: '일기', difficulty: '쉬움',
    prompt: '오늘 먹은 음식 중 하나를 골라 그 맛과 기분을 써보세요.',
    goal: '맛·향·색 중 하나를 구체적으로 표현하기',
    starter: '오늘 먹은 것 중에서 가장 인상 깊었던 건...',
  },
  {
    id: 'diary-003', category: '일기', difficulty: '쉬움',
    prompt: '아침에 눈을 떴을 때 제일 먼저 든 생각을 써보세요.',
    goal: '짧고 솔직하게, 꾸밈 없이 쓰기',
    starter: '오늘 아침 눈을 떴을 때 제일 먼저 든 생각은...',
  },
  {
    id: 'diary-004', category: '일기', difficulty: '보통',
    prompt: '오늘 하루를 날씨에 비유한다면 어떤 날씨인지 써보세요.',
    goal: '날씨 비유를 구체적으로 설명하기',
    starter: '오늘 하루를 날씨로 표현하면...',
  },
  {
    id: 'diary-005', category: '일기', difficulty: '쉬움',
    prompt: '오늘 나를 가장 기쁘게 한 작은 일을 써보세요.',
    goal: '사소해도 좋으니 구체적으로 묘사하기',
    starter: '오늘 나를 기쁘게 한 작은 일은...',
  },
  {
    id: 'diary-006', category: '일기', difficulty: '보통',
    prompt: '오늘 가장 힘들었던 순간과 그 이유를 솔직하게 써보세요.',
    goal: '감정을 구체적인 상황과 함께 표현하기',
    starter: '오늘 가장 힘들었던 순간은...',
  },
  {
    id: 'diary-007', category: '일기', difficulty: '쉬움',
    prompt: '오늘 대화 중 가장 인상 깊었던 말 한마디를 써보세요.',
    goal: '그 말이 왜 기억에 남는지 이유 쓰기',
    starter: '오늘 들은 말 중에 계속 생각나는 건...',
  },
  {
    id: 'diary-008', category: '일기', difficulty: '보통',
    prompt: '오늘 하루를 한 곡의 노래 제목으로 붙인다면 무엇인지 써보세요.',
    goal: '제목을 고른 이유와 함께 쓰기',
    starter: '오늘 하루의 제목은 아마...',
  },
  {
    id: 'diary-009', category: '일기', difficulty: '쉬움',
    prompt: '오늘 내 몸이 가장 편안했던 순간을 써보세요.',
    goal: '신체 감각(따뜻함, 편안함 등) 표현 넣기',
    starter: '오늘 가장 몸이 편안했던 때는...',
  },
  {
    id: 'diary-010', category: '일기', difficulty: '보통',
    prompt: '오늘 나도 모르게 미소 지었던 순간을 써보세요.',
    goal: '그 순간의 상황을 생생하게 묘사하기',
    starter: '오늘 나도 모르게 웃었던 순간은...',
  },
  {
    id: 'diary-011', category: '일기', difficulty: '어려움',
    prompt: '오늘 하루를 낯선 사람에게 편지로 전하듯이 써보세요.',
    goal: '서술자(나)를 3인칭처럼 객관적으로 묘사하기',
    starter: '오늘 저는 이런 하루를 보냈어요...',
  },
  {
    id: 'diary-012', category: '일기', difficulty: '어려움',
    prompt: '오늘 하루를 영화의 한 장면처럼 카메라 앵글을 상상하며 써보세요.',
    goal: '장면 묘사, 대사, 배경을 포함하여 영화적으로 쓰기',
    starter: '화면이 서서히 밝아지면...',
  },

  // ── 감정 ───────────────────────────────────────
  {
    id: 'emotion-001', category: '감정', difficulty: '쉬움',
    prompt: '요즘 자주 느끼는 감정을 색깔로 표현해보세요.',
    goal: '색깔을 선택한 이유를 구체적으로 쓰기',
    starter: '요즘 내 마음은 마치... 색이다.',
  },
  {
    id: 'emotion-002', category: '감정', difficulty: '보통',
    prompt: '가장 최근에 느꼈던 설렘의 순간을 떠올려 써보세요.',
    goal: '몸의 반응(심장 박동, 얼굴 붉어짐 등) 함께 쓰기',
    starter: '그 순간 심장이 약간...',
  },
  {
    id: 'emotion-003', category: '감정', difficulty: '보통',
    prompt: '화가 났던 경험을 쓰되, 그 안에 있는 다른 감정도 찾아보세요.',
    goal: '분노 안에 숨어있는 감정(서운함, 두려움 등) 탐색하기',
    starter: '그때 화가 났던 건 사실이지만, 사실은...',
  },
  {
    id: 'emotion-004', category: '감정', difficulty: '쉬움',
    prompt: '기분이 좋을 때 하고 싶은 일들의 목록을 써보세요.',
    goal: '이유와 함께, 구체적인 행동으로 쓰기',
    starter: '기분이 좋을 때 제일 하고 싶은 건...',
  },
  {
    id: 'emotion-005', category: '감정', difficulty: '어려움',
    prompt: '말로 설명하기 어려운 감정을 느꼈던 순간을 써보세요.',
    goal: '비유나 이미지를 사용해 표현하기',
    starter: '그건 딱히 뭐라고 부르기 어려운 감정이었는데...',
  },
  {
    id: 'emotion-006', category: '감정', difficulty: '쉬움',
    prompt: '지금 이 순간 내 마음 상태를 날씨로 표현해보세요.',
    goal: '날씨 표현을 마음의 상태와 연결하기',
    starter: '지금 내 마음은 꼭...',
  },
  {
    id: 'emotion-007', category: '감정', difficulty: '보통',
    prompt: '오래된 두려움 하나를 떠올리고, 지금 그것과 어떻게 지내는지 써보세요.',
    goal: '두려움을 솔직하게 인정하고 변화를 쓰기',
    starter: '오래전부터 두려워했던 건...',
  },
  {
    id: 'emotion-008', category: '감정', difficulty: '보통',
    prompt: '가장 최근에 눈물이 날 뻔했던 순간을 써보세요.',
    goal: '눈물의 이유를 구체적인 장면과 함께 쓰기',
    starter: '그때 눈물이 날 것 같았던 건...',
  },
  {
    id: 'emotion-009', category: '감정', difficulty: '어려움',
    prompt: '동시에 두 가지 상반된 감정을 느꼈던 경험을 써보세요.',
    goal: '모순된 감정이 공존하는 순간을 정직하게 표현하기',
    starter: '그 순간 나는 기쁘면서도...',
  },
  {
    id: 'emotion-010', category: '감정', difficulty: '쉬움',
    prompt: '나를 가장 편안하게 만드는 것이 무엇인지 써보세요.',
    goal: '그 이유와 어떤 느낌인지 구체적으로 쓰기',
    starter: '나를 가장 편안하게 만드는 건...',
  },
  {
    id: 'emotion-011', category: '감정', difficulty: '보통',
    prompt: '자랑스러웠던 나의 순간을 떠올려 써보세요.',
    goal: '내가 왜 자랑스러웠는지, 그때 기분을 생생하게 쓰기',
    starter: '그때만큼 나 자신이 자랑스러웠던 적이...',
  },
  {
    id: 'emotion-012', category: '감정', difficulty: '어려움',
    prompt: '후회 없이 했던 선택 하나를 떠올려 그 선택의 순간을 써보세요.',
    goal: '선택의 이유와 그 결과를 감정적으로 서술하기',
    starter: '그 선택을 하던 순간...',
  },

  // ── 상상 ───────────────────────────────────────
  {
    id: 'imagine-001', category: '상상', difficulty: '쉬움',
    prompt: '하루 동안 어떤 동물로 변신할 수 있다면 어떤 하루를 보낼지 써보세요.',
    goal: '그 동물의 특성을 활용한 구체적인 하루 묘사',
    starter: '만약 내가 하루 동안 ... 이 된다면...',
  },
  {
    id: 'imagine-002', category: '상상', difficulty: '쉬움',
    prompt: '마법 지팡이가 생겼을 때 가장 먼저 바꾸고 싶은 것을 써보세요.',
    goal: '이유와 바뀐 이후의 모습까지 써보기',
    starter: '마법 지팡이가 생긴다면 제일 먼저...',
  },
  {
    id: 'imagine-003', category: '상상', difficulty: '보통',
    prompt: '100년 후의 도시는 어떤 모습일지 상상해 써보세요.',
    goal: '교통, 건물, 사람들의 삶 중 하나를 구체적으로 쓰기',
    starter: '100년 후 이 도시에서는...',
  },
  {
    id: 'imagine-004', category: '상상', difficulty: '쉬움',
    prompt: '슈퍼파워가 생긴다면 무엇을 선택하고 그것으로 무엇을 할지 써보세요.',
    goal: '슈퍼파워의 구체적인 사용 장면 묘사',
    starter: '나에게 슈퍼파워가 생긴다면...',
  },
  {
    id: 'imagine-005', category: '상상', difficulty: '보통',
    prompt: '내가 직접 책 한 권을 쓴다면 어떤 이야기를 담을지 써보세요.',
    goal: '주인공, 배경, 핵심 메시지 간단히 설명하기',
    starter: '내가 책을 쓴다면 주인공은...',
  },
  {
    id: 'imagine-006', category: '상상', difficulty: '어려움',
    prompt: '기억을 지울 수 있는 기계가 존재한다면 어떤 일이 생길지 써보세요.',
    goal: '장단점을 다각도로 생각하며 짧은 이야기 쓰기',
    starter: '기억을 지울 수 있다면...',
  },
  {
    id: 'imagine-007', category: '상상', difficulty: '보통',
    prompt: '5년 후의 나에게 편지를 쓴다면 무슨 말을 할지 써보세요.',
    goal: '구체적인 소망과 응원의 말 담기',
    starter: '5년 후의 나에게...',
  },
  {
    id: 'imagine-008', category: '상상', difficulty: '쉬움',
    prompt: '하루 24시간을 혼자 마음대로 쓸 수 있다면 어떻게 보낼지 써보세요.',
    goal: '시간대별로 구체적인 활동 쓰기',
    starter: '아무것도 안 해도 되는 하루라면...',
  },
  {
    id: 'imagine-009', category: '상상', difficulty: '어려움',
    prompt: '세상 모든 화면이 사라진 하루를 상상해 써보세요.',
    goal: '달라진 하루의 모습을 구체적으로 묘사하기',
    starter: '스마트폰, TV, 컴퓨터가 사라진 하루는...',
  },
  {
    id: 'imagine-010', category: '상상', difficulty: '보통',
    prompt: '나만의 나라를 만들 수 있다면 어떤 나라를 만들지 써보세요.',
    goal: '규칙, 자연환경, 사람들의 삶 중 하나를 구체적으로 쓰기',
    starter: '내가 만든 나라에는...',
  },
  {
    id: 'imagine-011', category: '상상', difficulty: '보통',
    prompt: '내가 좋아하는 책이나 영화 속 세계로 들어간다면 어떻게 될지 써보세요.',
    goal: '그 세계의 특성을 활용한 내 모습 상상하기',
    starter: '그 세계로 들어간다면 제일 먼저...',
  },
  {
    id: 'imagine-012', category: '상상', difficulty: '어려움',
    prompt: '시간 여행을 할 수 있다면 어디로 가고 그곳에서 무엇을 할지 써보세요.',
    goal: '과거 또는 미래를 선택한 이유와 구체적인 계획 쓰기',
    starter: '시간 여행을 할 수 있다면 나는...',
  },

  // ── 학교/일상 ───────────────────────────────────────
  {
    id: 'daily-001', category: '학교/일상', difficulty: '쉬움',
    prompt: '오늘 학교나 직장에서 가장 인상 깊었던 일을 써보세요.',
    goal: '그 일이 왜 기억에 남는지 이유까지 쓰기',
    starter: '오늘 학교/직장에서 가장 기억에 남은 건...',
  },
  {
    id: 'daily-002', category: '학교/일상', difficulty: '쉬움',
    prompt: '아침 루틴을 처음 들은 사람에게 설명하듯이 써보세요.',
    goal: '순서대로, 구체적인 행동 묘사',
    starter: '나의 아침은 보통 이렇게 시작해요...',
  },
  {
    id: 'daily-003', category: '학교/일상', difficulty: '보통',
    prompt: '한 번도 해보지 않은 일을 해보고 싶다는 생각이 든 순간을 써보세요.',
    goal: '왜 그 생각이 들었는지 계기를 구체적으로 쓰기',
    starter: '처음으로 그걸 해보고 싶다는 생각이 들었을 때...',
  },
  {
    id: 'daily-004', category: '학교/일상', difficulty: '쉬움',
    prompt: '내 방(공간)을 처음 보는 사람에게 소개하듯이 써보세요.',
    goal: '색, 배치, 좋아하는 물건 하나 구체적으로 묘사',
    starter: '내 방에 들어서면 제일 먼저 보이는 건...',
  },
  {
    id: 'daily-005', category: '학교/일상', difficulty: '쉬움',
    prompt: '요즘 즐겨 하는 취미 활동을 소개해보세요.',
    goal: '언제, 어떻게, 왜 좋은지 구체적으로 쓰기',
    starter: '요즘 제가 빠져있는 건...',
  },
  {
    id: 'daily-006', category: '학교/일상', difficulty: '보통',
    prompt: '오늘 지하철/버스/길에서 스친 낯선 사람의 이야기를 상상해보세요.',
    goal: '그 사람의 표정이나 행동을 관찰하고 이야기 만들기',
    starter: '오늘 잠깐 스친 그 사람은...',
  },
  {
    id: 'daily-007', category: '학교/일상', difficulty: '쉬움',
    prompt: '내가 배우고 싶은 것들의 목록을 써보세요.',
    goal: '각 항목마다 이유를 한 문장씩 덧붙이기',
    starter: '언젠가 꼭 배워보고 싶은 것들이 있어요...',
  },
  {
    id: 'daily-008', category: '학교/일상', difficulty: '보통',
    prompt: '나를 오랫동안 알아온 물건 하나를 골라 그것의 이야기를 써보세요.',
    goal: '그 물건과의 기억을 시간순으로 써보기',
    starter: '이 물건은 나와...',
  },
  {
    id: 'daily-009', category: '학교/일상', difficulty: '보통',
    prompt: '가장 최근에 새로 배운 것이 무엇인지, 어떻게 배웠는지 써보세요.',
    goal: '배우는 과정의 어려움이나 보람 함께 쓰기',
    starter: '최근에 새롭게 알게 된 건...',
  },
  {
    id: 'daily-010', category: '학교/일상', difficulty: '어려움',
    prompt: '오늘 하루를 반성문처럼, 하지만 스스로에게 따뜻하게 써보세요.',
    goal: '비판 없이 관찰하듯 하루 돌아보기',
    starter: '오늘 하루를 돌아보면...',
  },
  {
    id: 'daily-011', category: '학교/일상', difficulty: '쉬움',
    prompt: '좋아하는 게임이나 스포츠를 처음 접한 사람에게 설명해보세요.',
    goal: '전문 용어 없이 쉽게 설명하기',
    starter: '이 게임/스포츠를 처음 접한다면...',
  },
  {
    id: 'daily-012', category: '학교/일상', difficulty: '어려움',
    prompt: '내 하루 중 가장 의미 없어 보이는 행동을 자세히 관찰해 써보세요.',
    goal: '사소한 습관의 의미를 찾아 글로 표현하기',
    starter: '아무 생각 없이 하는 행동이지만...',
  },

  // ── 음식 ───────────────────────────────────────
  {
    id: 'food-001', category: '음식', difficulty: '쉬움',
    prompt: '내가 가장 좋아하는 음식과 그것을 처음 먹었던 기억을 써보세요.',
    goal: '처음 맛을 봤을 때의 감각 표현 넣기',
    starter: '내가 제일 좋아하는 음식은...',
  },
  {
    id: 'food-002', category: '음식', difficulty: '쉬움',
    prompt: '직접 만들어보고 싶은 음식 레시피를 상상해 써보세요.',
    goal: '재료와 만드는 과정을 구체적으로 쓰기',
    starter: '언젠가 직접 만들어보고 싶은 음식은...',
  },
  {
    id: 'food-003', category: '음식', difficulty: '보통',
    prompt: '음식 하나를 골라 그것을 먹을 때의 모든 감각을 묘사해보세요.',
    goal: '맛, 향, 식감, 소리, 시각을 모두 활용하기',
    starter: '그 음식을 한 입 먹으면...',
  },
  {
    id: 'food-004', category: '음식', difficulty: '쉬움',
    prompt: '특별한 날 먹은 음식의 기억을 써보세요.',
    goal: '음식과 함께한 사람, 장소, 감정을 함께 쓰기',
    starter: '그날 먹은 음식이 유독 맛있었던 건...',
  },
  {
    id: 'food-005', category: '음식', difficulty: '보통',
    prompt: '음식을 먹다가 어린 시절이 떠오른 경험을 써보세요.',
    goal: '음식과 연결된 기억을 생생하게 묘사하기',
    starter: '그 맛이 입에 퍼지는 순간...',
  },
  {
    id: 'food-006', category: '음식', difficulty: '보통',
    prompt: '내가 직접 만든 요리가 실패했던 경험을 써보세요.',
    goal: '실패 과정을 유머 있게 묘사하기',
    starter: '자신 있게 만들었는데...',
  },
  {
    id: 'food-007', category: '음식', difficulty: '쉬움',
    prompt: '좋아하는 음식을 먹으면 생기는 기분을 써보세요.',
    goal: '음식이 주는 위로나 행복을 감정 중심으로 쓰기',
    starter: '그걸 먹을 때는 왠지...',
  },
  {
    id: 'food-008', category: '음식', difficulty: '어려움',
    prompt: '낯선 음식을 처음 먹어본 경험을 써보세요.',
    goal: '첫인상, 냄새, 맛의 변화를 단계적으로 묘사하기',
    starter: '처음 그 음식을 봤을 때...',
  },
  {
    id: 'food-009', category: '음식', difficulty: '보통',
    prompt: '음식 하나를 선물로 줄 수 있다면 누구에게 어떤 음식을 줄지 써보세요.',
    goal: '그 사람을 생각하며 음식을 선택한 이유 쓰기',
    starter: '내가 음식 하나를 선물한다면...',
  },
  {
    id: 'food-010', category: '음식', difficulty: '어려움',
    prompt: '음식에 담긴 문화나 역사에 대해 아는 것을 써보세요.',
    goal: '음식의 이야기를 흥미롭게 전달하기',
    starter: '이 음식에는 사실 이런 이야기가 있어요...',
  },

  // ── 관계 ───────────────────────────────────────
  {
    id: 'relation-001', category: '관계', difficulty: '쉬움',
    prompt: '친구에게 감사한 일을 떠올려 편지 형식으로 써보세요.',
    goal: '구체적인 에피소드를 넣어 감사 표현하기',
    starter: '친구에게 고마웠던 건...',
  },
  {
    id: 'relation-002', category: '관계', difficulty: '보통',
    prompt: '가족 중 한 명을 낯선 사람에게 소개하듯이 써보세요.',
    goal: '외모 묘사 없이 성격과 습관으로 표현하기',
    starter: '우리 가족 중에는 이런 사람이 있어요...',
  },
  {
    id: 'relation-003', category: '관계', difficulty: '쉬움',
    prompt: '우정이란 무엇이라고 생각하는지 나만의 정의를 써보세요.',
    goal: '추상적인 단어를 구체적인 경험으로 설명하기',
    starter: '내가 생각하는 우정이란...',
  },
  {
    id: 'relation-004', category: '관계', difficulty: '보통',
    prompt: '갑자기 연락이 끊겼던 사람이 생각난 날을 써보세요.',
    goal: '그 사람을 떠올린 계기를 구체적으로 쓰기',
    starter: '오랜만에 그 사람이 생각난 건...',
  },
  {
    id: 'relation-005', category: '관계', difficulty: '쉬움',
    prompt: '누군가에게 칭찬받았을 때 기분이 어땠는지 써보세요.',
    goal: '칭찬의 내용과 그 당시 감정 쓰기',
    starter: '그 말을 들었을 때...',
  },
  {
    id: 'relation-006', category: '관계', difficulty: '어려움',
    prompt: '오해를 받았거나 오해를 해서 힘들었던 경험을 써보세요.',
    goal: '두 사람 모두의 시각으로 상황 써보기',
    starter: '그때 서로 오해가 있었는데...',
  },
  {
    id: 'relation-007', category: '관계', difficulty: '쉬움',
    prompt: '가장 오래된 친구와의 추억 하나를 골라 써보세요.',
    goal: '당시 나이와 장소, 상황 구체적으로 쓰기',
    starter: '우리가 처음 만난 건...',
  },
  {
    id: 'relation-008', category: '관계', difficulty: '보통',
    prompt: '내가 누군가에게 큰 도움을 받았던 순간을 써보세요.',
    goal: '도움이 어떻게 내 삶을 바꿨는지 써보기',
    starter: '그 사람이 없었더라면...',
  },
  {
    id: 'relation-009', category: '관계', difficulty: '어려움',
    prompt: '내가 먼저 사과했거나 사과를 받았던 경험을 써보세요.',
    goal: '사과 전후의 감정 변화를 솔직하게 쓰기',
    starter: '처음 사과를 했을 때(받았을 때)...',
  },
  {
    id: 'relation-010', category: '관계', difficulty: '보통',
    prompt: '나에게 좋은 영향을 준 사람을 떠올려 그 사람의 어떤 점이 나를 변화시켰는지 써보세요.',
    goal: '구체적인 말이나 행동을 예시로 들기',
    starter: '그 사람 덕분에 나는...',
  },
  {
    id: 'relation-011', category: '관계', difficulty: '쉬움',
    prompt: '나를 항상 응원해주는 사람에게 하고 싶은 말을 써보세요.',
    goal: '진심이 담긴 구체적인 말 쓰기',
    starter: '당신이 내 곁에 있어서...',
  },
  {
    id: 'relation-012', category: '관계', difficulty: '어려움',
    prompt: '혼자가 편한 이유와 함께여서 좋은 이유를 동시에 써보세요.',
    goal: '혼자와 함께 사이의 균형을 탐색하기',
    starter: '혼자일 때 좋은 점이 있지만, 함께할 때는...',
  },

  // ── 여행 ───────────────────────────────────────
  {
    id: 'travel-001', category: '여행', difficulty: '쉬움',
    prompt: '가장 기억에 남는 여행의 한 장면을 써보세요.',
    goal: '배경, 날씨, 소리까지 묘사하기',
    starter: '그 여행에서 가장 기억에 남는 장면은...',
  },
  {
    id: 'travel-002', category: '여행', difficulty: '쉬움',
    prompt: '꼭 한 번 가보고 싶은 여행지를 그 이유와 함께 써보세요.',
    goal: '그곳에서 하고 싶은 일 구체적으로 쓰기',
    starter: '꼭 한 번 가보고 싶은 곳은...',
  },
  {
    id: 'travel-003', category: '여행', difficulty: '보통',
    prompt: '여행 중 예상치 못한 일이 생겼던 경험을 써보세요.',
    goal: '당황했던 순간과 어떻게 해결했는지 쓰기',
    starter: '여행 중에 갑자기...',
  },
  {
    id: 'travel-004', category: '여행', difficulty: '보통',
    prompt: '혼자 떠난 여행(또는 상상 속 혼자 여행)을 써보세요.',
    goal: '혼자만의 자유로움을 구체적으로 묘사하기',
    starter: '혼자 떠나는 여행은...',
  },
  {
    id: 'travel-005', category: '여행', difficulty: '쉬움',
    prompt: '내가 사는 동네를 처음 온 여행자에게 소개하듯이 써보세요.',
    goal: '자랑하고 싶은 곳 1~2곳을 구체적으로 쓰기',
    starter: '제가 사는 동네에 오신다면...',
  },
  {
    id: 'travel-006', category: '여행', difficulty: '보통',
    prompt: '여행지에서 먹었던 음식 중 가장 기억에 남는 것을 써보세요.',
    goal: '음식과 그 장소의 풍경을 함께 묘사하기',
    starter: '그 여행에서 먹었던 음식 중...',
  },
  {
    id: 'travel-007', category: '여행', difficulty: '어려움',
    prompt: '여행이 끝나고 집으로 돌아오는 길의 감정을 써보세요.',
    goal: '여행의 여운과 일상으로 돌아오는 감정 담기',
    starter: '집으로 돌아오는 버스/기차/비행기 안에서...',
  },
  {
    id: 'travel-008', category: '여행', difficulty: '쉬움',
    prompt: '하루 짜리 짧은 나들이를 계획해보세요.',
    goal: '시간, 장소, 먹을 것을 구체적으로 쓰기',
    starter: '하루 짜리 나들이를 계획한다면...',
  },
  {
    id: 'travel-009', category: '여행', difficulty: '어려움',
    prompt: '여행 중 현지인과 나눈 짧은 대화를 떠올려 써보세요.',
    goal: '그 대화가 내게 남긴 인상과 생각 쓰기',
    starter: '그 짧은 대화가 기억에 남는 건...',
  },
  {
    id: 'travel-010', category: '여행', difficulty: '보통',
    prompt: '다시 가고 싶은 여행지와 그 이유를 써보세요.',
    goal: '처음과 다르게 보게 된 점이 있다면 함께 쓰기',
    starter: '그곳에 다시 가고 싶은 이유는...',
  },
  {
    id: 'travel-011', category: '여행', difficulty: '보통',
    prompt: '기차나 버스를 타고 이동하는 동안 창밖을 보며 든 생각을 써보세요.',
    goal: '풍경의 변화와 마음의 변화를 연결해 쓰기',
    starter: '창밖을 보면서...',
  },
  {
    id: 'travel-012', category: '여행', difficulty: '어려움',
    prompt: '여행이 내게 어떤 의미인지 한 편의 짧은 에세이로 써보세요.',
    goal: '개인적인 경험을 근거로 자신의 생각 전달하기',
    starter: '나에게 여행이란...',
  },

  // ── 미래 ───────────────────────────────────────
  {
    id: 'future-001', category: '미래', difficulty: '쉬움',
    prompt: '10년 후의 나는 어떤 모습일지 구체적으로 써보세요.',
    goal: '일, 생활, 사람 중 하나를 구체적으로 묘사하기',
    starter: '10년 후의 나는 아마...',
  },
  {
    id: 'future-002', category: '미래', difficulty: '쉬움',
    prompt: '꼭 이루고 싶은 꿈 하나를 써보세요.',
    goal: '꿈과 함께 그 이유를 솔직하게 쓰기',
    starter: '내가 꼭 이루고 싶은 건...',
  },
  {
    id: 'future-003', category: '미래', difficulty: '보통',
    prompt: '어릴 때 꿈과 지금의 꿈은 어떻게 달라졌는지 써보세요.',
    goal: '변화의 계기가 된 사건이나 사람을 포함하기',
    starter: '어릴 때는 꼭 되고 싶었던 게...',
  },
  {
    id: 'future-004', category: '미래', difficulty: '보통',
    prompt: '노후에 살고 싶은 곳과 그곳에서의 하루를 써보세요.',
    goal: '구체적인 장소와 생활 모습 묘사하기',
    starter: '나이 들면 살고 싶은 곳은...',
  },
  {
    id: 'future-005', category: '미래', difficulty: '어려움',
    prompt: 'AI가 모든 일을 할 수 있게 된 세상에서 내가 하고 싶은 일을 써보세요.',
    goal: '인간만이 할 수 있는 것에 대한 생각 담기',
    starter: 'AI가 다 해주는 세상에서도 내가 하고 싶은 건...',
  },
  {
    id: 'future-006', category: '미래', difficulty: '보통',
    prompt: '올해 안에 꼭 해보고 싶은 일 3가지를 써보세요.',
    goal: '각 항목마다 구체적인 계획과 이유 쓰기',
    starter: '올해 안에 꼭 해보고 싶은 건...',
  },
  {
    id: 'future-007', category: '미래', difficulty: '쉬움',
    prompt: '내가 살고 싶은 이상적인 집을 상상해 써보세요.',
    goal: '공간, 분위기, 있으면 좋을 것들을 구체적으로 묘사하기',
    starter: '내가 살고 싶은 집은...',
  },
  {
    id: 'future-008', category: '미래', difficulty: '어려움',
    prompt: '지금 이 순간의 나를 10년 후의 내가 본다면 어떤 말을 할지 써보세요.',
    goal: '미래의 시각으로 현재를 돌아보기',
    starter: '10년 후의 내가 지금 나를 본다면...',
  },
  {
    id: 'future-009', category: '미래', difficulty: '보통',
    prompt: '죽기 전에 꼭 해보고 싶은 일 하나를 선택해 써보세요.',
    goal: '그 이유와 어떻게 이루고 싶은지 구체적으로 쓰기',
    starter: '언젠가 꼭 한번은...',
  },
  {
    id: 'future-010', category: '미래', difficulty: '어려움',
    prompt: '미래 사회의 가장 큰 도전 과제를 하나 골라 내 생각을 써보세요.',
    goal: '문제의 이유와 가능한 해결 방향을 써보기',
    starter: '앞으로 가장 큰 도전은 아마...',
  },
  {
    id: 'future-011', category: '미래', difficulty: '보통',
    prompt: '내가 만들고 싶은 세상의 규칙 하나를 써보세요.',
    goal: '그 규칙이 필요한 이유와 효과를 설명하기',
    starter: '내가 세상에 하나의 규칙을 만들 수 있다면...',
  },
  {
    id: 'future-012', category: '미래', difficulty: '쉬움',
    prompt: '앞으로 배워보고 싶은 기술이나 능력을 써보세요.',
    goal: '배우고 싶은 이유와 어떻게 활용할지 함께 쓰기',
    starter: '언젠가 꼭 배우고 싶은 건...',
  },

  // ── 자기소개 ───────────────────────────────────────
  {
    id: 'intro-001', category: '자기소개', difficulty: '쉬움',
    prompt: '나를 가장 잘 표현하는 단어 3개를 골라 이유와 함께 써보세요.',
    goal: '각 단어마다 에피소드 한 문장씩 붙이기',
    starter: '나를 표현하는 단어를 고른다면...',
  },
  {
    id: 'intro-002', category: '자기소개', difficulty: '쉬움',
    prompt: '나를 가장 잘 표현하는 색깔이 무엇이고 왜인지 써보세요.',
    goal: '색의 특성과 내 성격을 연결해 설명하기',
    starter: '나를 색으로 표현하면...',
  },
  {
    id: 'intro-003', category: '자기소개', difficulty: '보통',
    prompt: '내가 생각하는 내 가장 큰 장점과 단점을 솔직하게 써보세요.',
    goal: '단점도 긍정적인 시각으로 마무리하기',
    starter: '내 장점은... 단점은 솔직히...',
  },
  {
    id: 'intro-004', category: '자기소개', difficulty: '보통',
    prompt: '나를 동물에 비유한다면 어떤 동물인지 이유와 함께 써보세요.',
    goal: '동물의 특성과 내 성격을 구체적으로 연결하기',
    starter: '나를 동물에 비유한다면...',
  },
  {
    id: 'intro-005', category: '자기소개', difficulty: '쉬움',
    prompt: '내가 가장 행복한 순간이 언제인지 써보세요.',
    goal: '추상적이지 않게 구체적인 상황 묘사하기',
    starter: '내가 가장 행복한 순간은...',
  },
  {
    id: 'intro-006', category: '자기소개', difficulty: '어려움',
    prompt: '나를 전혀 모르는 사람에게 나를 소개하는 짧은 글을 써보세요.',
    goal: '한 문단 안에 나의 핵심을 담기',
    starter: '저를 모르시는 분들께...',
  },
  {
    id: 'intro-007', category: '자기소개', difficulty: '보통',
    prompt: '어릴 때의 나와 지금의 나가 어떻게 달라졌는지 써보세요.',
    goal: '달라진 점과 달라지지 않은 점을 함께 쓰기',
    starter: '어릴 때와 지금을 비교하면...',
  },
  {
    id: 'intro-008', category: '자기소개', difficulty: '쉬움',
    prompt: '나만의 독특한 습관이나 버릇 하나를 소개해보세요.',
    goal: '언제부터 그랬는지, 왜 그런지 생각해보기',
    starter: '나만 아는 내 습관 중 하나는...',
  },
  {
    id: 'intro-009', category: '자기소개', difficulty: '보통',
    prompt: '내가 가장 중요하게 생각하는 가치관을 써보세요.',
    goal: '그 가치관이 어떤 경험에서 생겼는지 함께 쓰기',
    starter: '내가 가장 중요하게 생각하는 건...',
  },
  {
    id: 'intro-010', category: '자기소개', difficulty: '어려움',
    prompt: '10년 뒤의 나에게 현재의 나를 소개하는 편지를 써보세요.',
    goal: '현재의 고민, 꿈, 모습을 솔직하게 담기',
    starter: '미래의 나에게, 지금의 나는...',
  },

  // ── 논리/주장 ───────────────────────────────────────
  {
    id: 'argument-001', category: '논리/주장', difficulty: '보통',
    prompt: '내가 세상에서 가장 중요한 발명품이라고 생각하는 것을 설명해보세요.',
    goal: '주장 → 이유 2가지 → 반론 가능성 → 결론 구조로 쓰기',
    starter: '내가 생각하는 가장 중요한 발명품은...',
  },
  {
    id: 'argument-002', category: '논리/주장', difficulty: '보통',
    prompt: '로봇이나 AI가 사람의 일자리를 빼앗는다는 말에 대해 어떻게 생각하는지 써보세요.',
    goal: '찬성 또는 반대 입장을 명확히 하고 근거 2개 이상 쓰기',
    starter: '인공지능이 일자리를 위협한다는 주장에 대해...',
  },
  {
    id: 'argument-003', category: '논리/주장', difficulty: '어려움',
    prompt: '학교에서 배우는 것 중 가장 불필요하다고 생각하는 것을 이유와 함께 써보세요.',
    goal: '개인 경험을 근거로 논리적으로 설명하기',
    starter: '학교에서 배우는 것 중...',
  },
  {
    id: 'argument-004', category: '논리/주장', difficulty: '보통',
    prompt: '규칙이 꼭 필요하다고 생각하는 이유를 써보세요.',
    goal: '예를 하나 들어 논리적으로 설명하기',
    starter: '규칙이 필요한 이유는...',
  },
  {
    id: 'argument-005', category: '논리/주장', difficulty: '어려움',
    prompt: '돈이 행복의 조건이 될 수 있는지에 대해 자신의 생각을 써보세요.',
    goal: '양면을 다루되 자신의 입장을 명확히 하기',
    starter: '돈과 행복의 관계에 대해...',
  },
  {
    id: 'argument-006', category: '논리/주장', difficulty: '보통',
    prompt: '인터넷 게임에 시간 제한이 필요하다는 주장에 동의하는지 써보세요.',
    goal: '자신의 경험을 근거로 찬성 또는 반대 쓰기',
    starter: '게임 시간 제한에 대해...',
  },
  {
    id: 'argument-007', category: '논리/주장', difficulty: '어려움',
    prompt: '환경 보호와 경제 발전 중 더 중요한 것이 무엇인지 써보세요.',
    goal: '양쪽을 모두 이해하면서도 입장 정하기',
    starter: '환경과 경제 중에서...',
  },
  {
    id: 'argument-008', category: '논리/주장', difficulty: '보통',
    prompt: '독서가 중요하다는 말에 동의하는지, 그 이유를 써보세요.',
    goal: '동의 또는 반대 입장을 논리적으로 설명하기',
    starter: '독서가 중요하다는 말에...',
  },
  {
    id: 'argument-009', category: '논리/주장', difficulty: '어려움',
    prompt: 'SNS가 사람들의 관계에 도움이 되는지 해가 되는지 써보세요.',
    goal: '실제 사례를 들어 자신의 주장 펼치기',
    starter: 'SNS는 관계를...',
  },
  {
    id: 'argument-010', category: '논리/주장', difficulty: '보통',
    prompt: '교복 착용 찬반 중 하나를 선택해 논거를 써보세요.',
    goal: '감정이 아닌 이유로 설명하기',
    starter: '교복에 대한 내 생각은...',
  },
  {
    id: 'argument-011', category: '논리/주장', difficulty: '어려움',
    prompt: '스마트폰이 없었던 세상이 지금보다 더 좋았을지 써보세요.',
    goal: '장단점을 비교하며 결론 내리기',
    starter: '스마트폰 이전의 세상을 상상하면...',
  },
  {
    id: 'argument-012', category: '논리/주장', difficulty: '보통',
    prompt: '실패에서 배우는 것이 성공보다 더 값지다는 말에 대한 생각을 써보세요.',
    goal: '개인 경험을 근거로 동의 또는 반론 쓰기',
    starter: '실패에서 배운다는 말에...',
  },

  // ── 창작 ───────────────────────────────────────
  {
    id: 'creative-001', category: '창작', difficulty: '보통',
    prompt: '낡은 우산이 스스로 이야기를 한다면 어떤 이야기를 할지 써보세요.',
    goal: '사물의 시각에서 이야기 전개하기',
    starter: '이 우산은 조용히 중얼거렸다...',
  },
  {
    id: 'creative-002', category: '창작', difficulty: '쉬움',
    prompt: '주인공이 낯선 문 앞에 서 있는 장면에서 이야기를 시작해보세요.',
    goal: '문 너머에 무엇이 있을지 상상하며 쓰기',
    starter: '문 앞에 섰을 때...',
  },
  {
    id: 'creative-003', category: '창작', difficulty: '어려움',
    prompt: '같은 사건을 두 사람의 시각으로 각각 써보세요.',
    goal: '관점에 따라 사건이 다르게 보이는 것을 표현하기',
    starter: 'A의 시각: ... / B의 시각: ...',
  },
  {
    id: 'creative-004', category: '창작', difficulty: '보통',
    prompt: '마지막 문장이 "그래서 나는 웃을 수밖에 없었다."인 이야기를 써보세요.',
    goal: '마지막 문장에 자연스럽게 이어지는 이야기 쓰기',
    starter: '그날은 이상하게 시작됐다...',
  },
  {
    id: 'creative-005', category: '창작', difficulty: '쉬움',
    prompt: '나를 주인공으로 한 짧은 영웅 이야기를 써보세요.',
    goal: '문제 상황, 해결, 결과를 포함하여 쓰기',
    starter: '그날 나는 예상치 못한 영웅이 되었다...',
  },
  {
    id: 'creative-006', category: '창작', difficulty: '어려움',
    prompt: '일상적인 하루를 SF 소설처럼 써보세요.',
    goal: '평범한 일을 낯설고 신기하게 묘사하기',
    starter: '기지에서 일어나 시스템을 가동했다...',
  },
  {
    id: 'creative-007', category: '창작', difficulty: '보통',
    prompt: '빵집 앞에 매일 오는 노인의 이야기를 써보세요.',
    goal: '인물 묘사, 감정, 반전 중 하나 포함하기',
    starter: '그 노인은 매일 같은 시간에 왔다...',
  },
  {
    id: 'creative-008', category: '창작', difficulty: '쉬움',
    prompt: '아이가 부모에게 쓴 편지 형식으로 짧은 이야기를 써보세요.',
    goal: '아이의 시각과 솔직한 감정 담기',
    starter: '엄마(아빠)에게...',
  },
  {
    id: 'creative-009', category: '창작', difficulty: '어려움',
    prompt: '단어 세 개(빛, 실수, 고양이)를 모두 포함한 짧은 이야기를 써보세요.',
    goal: '자연스럽게 세 단어를 엮어 이야기 전개하기',
    starter: '그날 오후...',
  },
  {
    id: 'creative-010', category: '창작', difficulty: '보통',
    prompt: '비가 오는 날 버스 정류장에 두 사람이 만나는 장면을 써보세요.',
    goal: '대화 한 줄 이상 포함하기',
    starter: '빗소리 사이로...',
  },
  {
    id: 'creative-011', category: '창작', difficulty: '쉬움',
    prompt: '내 일상 속 사물 하나가 살아 움직인다면 어떤 일이 생길지 써보세요.',
    goal: '사물과 사람의 관계를 재미있게 표현하기',
    starter: '어느 날 아침...',
  },
  {
    id: 'creative-012', category: '창작', difficulty: '어려움',
    prompt: '결말부터 시작해 역순으로 이야기를 써보세요.',
    goal: '시간이 거꾸로 흐르는 구성 시도하기',
    starter: '모든 것이 끝난 뒤...',
  },

  // ── 관찰 ───────────────────────────────────────
  {
    id: 'observe-001', category: '관찰', difficulty: '쉬움',
    prompt: '창밖 풍경을 지금 이 순간 그대로 묘사해보세요.',
    goal: '시각 외에 소리나 냄새도 상상하며 쓰기',
    starter: '지금 창밖을 보면...',
  },
  {
    id: 'observe-002', category: '관찰', difficulty: '보통',
    prompt: '카페나 식당에서 주변 사람들을 관찰하고 써보세요.',
    goal: '행동, 표정, 대화를 통해 인물 묘사하기',
    starter: '오늘 카페에서 본 사람은...',
  },
  {
    id: 'observe-003', category: '관찰', difficulty: '쉬움',
    prompt: '오늘 걷다가 발견한 작은 것 하나를 자세히 묘사해보세요.',
    goal: '아주 사소한 것도 세밀하게 관찰하기',
    starter: '오늘 길을 걷다가...',
  },
  {
    id: 'observe-004', category: '관찰', difficulty: '어려움',
    prompt: '같은 장소를 아침, 낮, 밤에 각각 어떻게 다른지 비교해 써보세요.',
    goal: '빛, 소리, 분위기의 변화를 포착하기',
    starter: '이 장소는 아침엔...',
  },
  {
    id: 'observe-005', category: '관찰', difficulty: '보통',
    prompt: '일상 속에서 당연하게 지나쳤던 것을 처음 보는 것처럼 써보세요.',
    goal: '낯선 시각으로 익숙한 것 묘사하기',
    starter: '매일 보면서도 오늘 처음 자세히 보니...',
  },
  {
    id: 'observe-006', category: '관찰', difficulty: '쉬움',
    prompt: '내 손을 자세히 관찰하고 묘사해보세요.',
    goal: '선, 색, 모양을 구체적으로 묘사하기',
    starter: '내 손을 자세히 들여다보면...',
  },
  {
    id: 'observe-007', category: '관찰', difficulty: '보통',
    prompt: '나무 한 그루를 관찰하고 그것이 들려주는 이야기를 써보세요.',
    goal: '나무의 생김새에서 이야기 상상하기',
    starter: '저 나무는 오래된 것처럼 보였는데...',
  },
  {
    id: 'observe-008', category: '관찰', difficulty: '어려움',
    prompt: '소리만으로 지금 있는 공간을 묘사해보세요.',
    goal: '시각 정보 없이 소리만으로 장면 전달하기',
    starter: '눈을 감으면 들리는 건...',
  },
  {
    id: 'observe-009', category: '관찰', difficulty: '보통',
    prompt: '오늘 하늘을 본 순간을 묘사해보세요.',
    goal: '구름, 색, 빛의 변화를 생생하게 표현하기',
    starter: '오늘 하늘을 올려다보니...',
  },
  {
    id: 'observe-010', category: '관찰', difficulty: '쉬움',
    prompt: '가장 좋아하는 물건을 처음 보는 사람에게 설명하듯이 써보세요.',
    goal: '모양, 질감, 색, 냄새 등을 세밀하게 묘사하기',
    starter: '이 물건은 처음 보면...',
  },

  // ── 계절/날씨 ───────────────────────────────────────
  {
    id: 'season-001', category: '계절/날씨', difficulty: '쉬움',
    prompt: '내가 가장 좋아하는 계절과 그 이유를 써보세요.',
    goal: '그 계절에만 있는 감각 표현 넣기',
    starter: '내가 가장 좋아하는 계절은...',
  },
  {
    id: 'season-002', category: '계절/날씨', difficulty: '쉬움',
    prompt: '비가 오는 날의 기분과 하고 싶은 일을 써보세요.',
    goal: '비 오는 날의 소리, 냄새, 분위기 표현하기',
    starter: '비 오는 날은 왠지...',
  },
  {
    id: 'season-003', category: '계절/날씨', difficulty: '보통',
    prompt: '첫눈이 왔던 날의 기억을 구체적으로 써보세요.',
    goal: '그날의 감각과 감정을 함께 묘사하기',
    starter: '첫눈을 봤을 때...',
  },
  {
    id: 'season-004', category: '계절/날씨', difficulty: '쉬움',
    prompt: '여름의 뜨거운 날을 배경으로 짧은 글을 써보세요.',
    goal: '더위를 느끼게 하는 감각 표현 2개 이상 넣기',
    starter: '그 여름 오후는...',
  },
  {
    id: 'season-005', category: '계절/날씨', difficulty: '보통',
    prompt: '가을에 떨어지는 낙엽을 보며 든 생각을 써보세요.',
    goal: '낙엽을 통한 사색과 감정 연결하기',
    starter: '낙엽을 보면서...',
  },
  {
    id: 'season-006', category: '계절/날씨', difficulty: '쉬움',
    prompt: '봄바람이 처음 느껴지는 날의 기분을 써보세요.',
    goal: '봄의 감각을 최대한 생생하게 묘사하기',
    starter: '처음으로 봄 냄새가 났을 때...',
  },
  {
    id: 'season-007', category: '계절/날씨', difficulty: '보통',
    prompt: '갑자기 날씨가 변했을 때의 당황스러움을 써보세요.',
    goal: '날씨 변화와 내 마음의 변화를 연결하기',
    starter: '갑자기 날씨가 바뀌었을 때...',
  },
  {
    id: 'season-008', category: '계절/날씨', difficulty: '어려움',
    prompt: '한 계절을 사람으로 표현한다면 어떤 사람인지 써보세요.',
    goal: '계절의 특징을 인물로 구체화하기',
    starter: '만약 겨울이 사람이라면...',
  },
  {
    id: 'season-009', category: '계절/날씨', difficulty: '보통',
    prompt: '눈이 오는 날 밖에서 느낀 감각을 써보세요.',
    goal: '발 밑의 느낌, 공기의 냄새, 소리 묘사하기',
    starter: '눈 위를 걸으면...',
  },
  {
    id: 'season-010', category: '계절/날씨', difficulty: '쉬움',
    prompt: '날씨가 내 기분에 미치는 영향을 써보세요.',
    goal: '날씨 종류별로 내 감정 패턴 설명하기',
    starter: '날씨가 좋으면 나는...',
  },

  // ── 감사 ───────────────────────────────────────
  {
    id: 'gratitude-001', category: '감사', difficulty: '쉬움',
    prompt: '오늘 하루 감사한 일 세 가지를 써보세요.',
    goal: '사소한 것도 구체적으로 쓰기',
    starter: '오늘 감사한 일은...',
  },
  {
    id: 'gratitude-002', category: '감사', difficulty: '보통',
    prompt: '내 삶에서 당연하게 여겼지만 사실은 감사한 것을 써보세요.',
    goal: '그것이 없었을 때를 상상하며 쓰기',
    starter: '당연하다고 생각했지만 사실은...',
  },
  {
    id: 'gratitude-003', category: '감사', difficulty: '쉬움',
    prompt: '나를 위해 고생하는 사람에게 감사 편지를 써보세요.',
    goal: '구체적인 에피소드 하나 포함하기',
    starter: '오랫동안 감사하다고 말 못 했는데...',
  },
  {
    id: 'gratitude-004', category: '감사', difficulty: '보통',
    prompt: '힘든 시간을 버티게 해준 것이 무엇인지 써보세요.',
    goal: '그것이 어떻게 도움이 됐는지 구체적으로 쓰기',
    starter: '힘들었던 그 시간에 나를 버티게 한 건...',
  },
  {
    id: 'gratitude-005', category: '감사', difficulty: '쉬움',
    prompt: '오늘 내 몸이 해준 것들 중 감사한 것을 써보세요.',
    goal: '신체 기능을 당연하게 여기지 않고 감사하기',
    starter: '내 몸이 오늘 해준 것 중...',
  },
  {
    id: 'gratitude-006', category: '감사', difficulty: '보통',
    prompt: '낯선 사람에게서 받은 친절을 떠올려 써보세요.',
    goal: '그 순간의 감동을 구체적으로 묘사하기',
    starter: '모르는 사람이 베풀어준 친절...',
  },
  {
    id: 'gratitude-007', category: '감사', difficulty: '어려움',
    prompt: '처음에는 싫었지만 나중에 감사하게 된 경험을 써보세요.',
    goal: '시간이 지나 바뀐 시각을 솔직하게 쓰기',
    starter: '처음에는 정말 싫었지만...',
  },
  {
    id: 'gratitude-008', category: '감사', difficulty: '쉬움',
    prompt: '자연에서 감사함을 느꼈던 순간을 써보세요.',
    goal: '자연의 어떤 모습이 감사함을 불러일으켰는지 쓰기',
    starter: '자연 앞에서 감사함을 느낀 건...',
  },
  {
    id: 'gratitude-009', category: '감사', difficulty: '보통',
    prompt: '나 자신에 대해 감사한 점을 써보세요.',
    goal: '자기 비판 없이 자신의 장점이나 노력에 감사하기',
    starter: '스스로에게 감사한 건...',
  },
  {
    id: 'gratitude-010', category: '감사', difficulty: '어려움',
    prompt: '실패나 어려움이 결국 내게 좋은 것을 가져다준 경험을 써보세요.',
    goal: '그 경험을 통해 무엇을 얻었는지 솔직하게 쓰기',
    starter: '그 실패 덕분에...',
  },

  // ── 회고 ───────────────────────────────────────
  {
    id: 'retrospect-001', category: '회고', difficulty: '보통',
    prompt: '올해 가장 잘했다고 생각하는 일을 써보세요.',
    goal: '그 일을 잘했던 이유와 어떤 결과가 있었는지 쓰기',
    starter: '올해 내가 가장 잘한 건...',
  },
  {
    id: 'retrospect-002', category: '회고', difficulty: '보통',
    prompt: '지난 한 달 동안 나에게 어떤 변화가 있었는지 써보세요.',
    goal: '작은 변화라도 구체적으로 쓰기',
    starter: '지난 한 달을 돌아보면...',
  },
  {
    id: 'retrospect-003', category: '회고', difficulty: '쉬움',
    prompt: '1년 전의 나에게 한마디를 한다면 무슨 말을 할지 써보세요.',
    goal: '과거의 나에게 필요한 말 쓰기',
    starter: '1년 전의 나에게 말하고 싶은 건...',
  },
  {
    id: 'retrospect-004', category: '회고', difficulty: '어려움',
    prompt: '내 인생의 전환점이 된 사건 하나를 골라 써보세요.',
    goal: '그 사건 전후 나의 변화를 구체적으로 쓰기',
    starter: '내 인생에서 가장 큰 전환점은...',
  },
  {
    id: 'retrospect-005', category: '회고', difficulty: '보통',
    prompt: '처음 무언가에 도전했을 때의 기억을 써보세요.',
    goal: '두려움과 설렘을 함께 표현하기',
    starter: '처음 그걸 해보기로 했을 때...',
  },
  {
    id: 'retrospect-006', category: '회고', difficulty: '쉬움',
    prompt: '가장 열심히 했던 경험을 떠올려 써보세요.',
    goal: '그 노력이 어떤 결과를 가져왔는지 쓰기',
    starter: '그때만큼 열심히 한 적이 없었는데...',
  },
  {
    id: 'retrospect-007', category: '회고', difficulty: '어려움',
    prompt: '과거에 내린 결정 중 다시 생각해보게 되는 것을 써보세요.',
    goal: '후회가 아니라 배움으로 정리하기',
    starter: '그때 그 결정을 지금 다시 생각하면...',
  },
  {
    id: 'retrospect-008', category: '회고', difficulty: '보통',
    prompt: '아무것도 이루지 못한 것 같은 날에도 사실은 뭔가를 했다는 것을 써보세요.',
    goal: '작은 것에서 의미 찾기',
    starter: '아무것도 못 한 것 같아도...',
  },
  {
    id: 'retrospect-009', category: '회고', difficulty: '쉬움',
    prompt: '요즘 나를 성장시키고 있는 것이 무엇인지 써보세요.',
    goal: '작은 변화도 알아채 구체적으로 쓰기',
    starter: '요즘 나를 성장시키는 건...',
  },
  {
    id: 'retrospect-010', category: '회고', difficulty: '어려움',
    prompt: '내가 반복하는 패턴 하나를 알아채고 써보세요.',
    goal: '패턴의 원인과 앞으로의 방향을 솔직하게 쓰기',
    starter: '나는 자주 이런 패턴을 반복하는데...',
  },

  // ── 취향 ───────────────────────────────────────
  {
    id: 'preference-001', category: '취향', difficulty: '쉬움',
    prompt: '좋아하는 책이나 영화 하나를 골라 소개해보세요.',
    goal: '줄거리가 아니라 왜 좋아하는지 쓰기',
    starter: '내가 가장 좋아하는 책/영화는...',
  },
  {
    id: 'preference-002', category: '취향', difficulty: '쉬움',
    prompt: '내가 좋아하는 노래를 소개하고 그 노래를 들을 때의 기분을 써보세요.',
    goal: '노래와 연결된 기억이나 감정 쓰기',
    starter: '이 노래를 처음 들었을 때...',
  },
  {
    id: 'preference-003', category: '취향', difficulty: '보통',
    prompt: '나만의 특별한 취미나 관심사를 소개해보세요.',
    goal: '그것이 내 삶에서 어떤 의미인지 쓰기',
    starter: '다른 사람들은 모를 수도 있지만 나는...',
  },
  {
    id: 'preference-004', category: '취향', difficulty: '쉬움',
    prompt: '좋아하는 공간(카페, 공원, 방 등)을 묘사해보세요.',
    goal: '그 공간에 있을 때의 감각과 감정 표현하기',
    starter: '내가 제일 좋아하는 공간은...',
  },
  {
    id: 'preference-005', category: '취향', difficulty: '보통',
    prompt: '내가 좋아하는 것들의 공통점을 찾아 써보세요.',
    goal: '좋아하는 것들을 나열하고 패턴 찾기',
    starter: '내가 좋아하는 것들을 나열해보면...',
  },
  {
    id: 'preference-006', category: '취향', difficulty: '쉬움',
    prompt: '가장 좋아하는 계절과 그 계절에 꼭 하는 것을 써보세요.',
    goal: '계절의 감각과 행동을 연결해 쓰기',
    starter: '내가 가장 좋아하는 계절은...',
  },
  {
    id: 'preference-007', category: '취향', difficulty: '어려움',
    prompt: '나의 취향이 시간이 지나면서 어떻게 바뀌었는지 써보세요.',
    goal: '과거와 현재의 취향 비교 + 그 이유 쓰기',
    starter: '예전에는 좋아했는데 지금은...',
  },
  {
    id: 'preference-008', category: '취향', difficulty: '보통',
    prompt: '내가 좋아하는 향기나 냄새를 묘사해보세요.',
    goal: '그 냄새가 연상시키는 기억이나 장면과 연결하기',
    starter: '내가 가장 좋아하는 냄새는...',
  },
  {
    id: 'preference-009', category: '취향', difficulty: '쉬움',
    prompt: '인생에서 꼭 다시 보고 싶은 영화나 읽고 싶은 책을 써보세요.',
    goal: '처음 접했을 때와 다시 볼 때의 기대 차이 쓰기',
    starter: '다시 보고(읽고) 싶은 건...',
  },
  {
    id: 'preference-010', category: '취향', difficulty: '어려움',
    prompt: '아무도 이해 못 하는 나만의 취향 하나를 설득력 있게 소개해보세요.',
    goal: '왜 그것이 좋은지 논리적이면서 감성적으로 설명하기',
    starter: '이건 나만 좋아하는 것 같은데...',
  },

  // ── 사회/기술 ───────────────────────────────────────
  {
    id: 'society-001', category: '사회/기술', difficulty: '보통',
    prompt: 'AI 기술이 일상을 어떻게 바꾸고 있는지 내 경험을 바탕으로 써보세요.',
    goal: '구체적인 사례 하나로 변화 설명하기',
    starter: 'AI가 내 일상에 들어온 것을 느끼는 순간은...',
  },
  {
    id: 'society-002', category: '사회/기술', difficulty: '어려움',
    prompt: 'SNS가 나의 자아상에 미치는 영향을 솔직하게 써보세요.',
    goal: '긍정적, 부정적 영향을 모두 다루기',
    starter: 'SNS를 보면서 나 자신을...',
  },
  {
    id: 'society-003', category: '사회/기술', difficulty: '보통',
    prompt: '기술이 발전하면서 사라진 것 중 아쉬운 것이 있는지 써보세요.',
    goal: '무엇이 사라졌고 왜 아쉬운지 구체적으로 쓰기',
    starter: '기술이 발전하면서 사라진 것 중...',
  },
  {
    id: 'society-004', category: '사회/기술', difficulty: '어려움',
    prompt: '스마트폰 없이 하루를 보낸다면 어떨지 상상해서 써보세요.',
    goal: '불편함과 의외의 자유로움을 균형 있게 쓰기',
    starter: '스마트폰 없이 하루를 보낸다면...',
  },
  {
    id: 'society-005', category: '사회/기술', difficulty: '보통',
    prompt: '지금 사회에서 가장 필요한 변화가 무엇이라고 생각하는지 써보세요.',
    goal: '구체적인 문제와 원하는 변화를 함께 쓰기',
    starter: '지금 우리 사회에서 가장 필요한 건...',
  },
  {
    id: 'society-006', category: '사회/기술', difficulty: '어려움',
    prompt: '개인 정보 보호와 편리한 서비스 사이에서 어떤 선택을 하는지 써보세요.',
    goal: '실제 경험을 바탕으로 자신의 기준 쓰기',
    starter: '개인 정보와 편리함 사이에서...',
  },
  {
    id: 'society-007', category: '사회/기술', difficulty: '보통',
    prompt: '환경 문제를 해결하기 위해 내가 실천하는 것들을 써보세요.',
    goal: '작은 실천도 구체적으로 쓰기',
    starter: '환경을 위해 내가 하는 일은...',
  },
  {
    id: 'society-008', category: '사회/기술', difficulty: '보통',
    prompt: '디지털 기기 사용 시간과 오프라인 생활의 균형에 대해 써보세요.',
    goal: '자신의 현재 습관과 이상적인 균형 비교하기',
    starter: '디지털과 오프라인 사이에서...',
  },
  {
    id: 'society-009', category: '사회/기술', difficulty: '어려움',
    prompt: '미래 세대에게 남겨주고 싶은 세상의 모습을 써보세요.',
    goal: '구체적인 사회 모습을 그려보기',
    starter: '미래 세대에게 남기고 싶은 세상은...',
  },
  {
    id: 'society-010', category: '사회/기술', difficulty: '보통',
    prompt: '온라인과 오프라인 만남의 차이를 써보세요.',
    goal: '각각의 장단점과 자신의 선호를 쓰기',
    starter: '온라인과 오프라인 만남은...',
  },

  // ── 짧은 에세이 ───────────────────────────────────────
  {
    id: 'essay-001', category: '짧은 에세이', difficulty: '보통',
    prompt: '"작은 것이 더 아름답다"는 말에 대해 짧게 써보세요.',
    goal: '자신의 경험을 근거로 주장 펼치기',
    starter: '작은 것이 더 아름답다고 생각하는 이유는...',
  },
  {
    id: 'essay-002', category: '짧은 에세이', difficulty: '보통',
    prompt: '어른이 된다는 것이 무엇인지 나만의 정의로 써보세요.',
    goal: '추상적인 개념을 구체적인 경험으로 설명하기',
    starter: '어른이 된다는 것은...',
  },
  {
    id: 'essay-003', category: '짧은 에세이', difficulty: '어려움',
    prompt: '"행복"을 자신만의 말로 정의하고 그것을 향해 어떻게 가고 있는지 써보세요.',
    goal: '추상적인 개념의 개인적인 정의 + 실천 방향 쓰기',
    starter: '내가 생각하는 행복이란...',
  },
  {
    id: 'essay-004', category: '짧은 에세이', difficulty: '보통',
    prompt: '나에게 힘이 되는 한 마디를 소개하고 그 이유를 써보세요.',
    goal: '그 말이 어떤 순간에 힘이 됐는지 구체적으로 쓰기',
    starter: '나에게 가장 힘이 되는 말은...',
  },
  {
    id: 'essay-005', category: '짧은 에세이', difficulty: '어려움',
    prompt: '"지금 이 순간"의 가치에 대해 써보세요.',
    goal: '현재에 집중하는 것의 의미를 자신의 언어로 쓰기',
    starter: '지금 이 순간이 소중한 이유는...',
  },
  {
    id: 'essay-006', category: '짧은 에세이', difficulty: '보통',
    prompt: '습관이 삶을 바꾼다는 말에 동의하는지 써보세요.',
    goal: '자신의 습관 경험을 사례로 들기',
    starter: '작은 습관이 삶을 바꾼다고 생각하는 건...',
  },
  {
    id: 'essay-007', category: '짧은 에세이', difficulty: '쉬움',
    prompt: '내가 인생에서 배운 가장 중요한 교훈 하나를 써보세요.',
    goal: '어떤 경험을 통해 배웠는지 이야기처럼 쓰기',
    starter: '살면서 배운 가장 중요한 것은...',
  },
  {
    id: 'essay-008', category: '짧은 에세이', difficulty: '어려움',
    prompt: '"글을 쓴다는 것"이 내게 어떤 의미인지 써보세요.',
    goal: '글쓰기를 통해 무엇을 얻는지 정직하게 쓰기',
    starter: '나에게 글을 쓴다는 건...',
  },
  {
    id: 'essay-009', category: '짧은 에세이', difficulty: '보통',
    prompt: '침묵이 때로는 말보다 나을 때가 있는지 써보세요.',
    goal: '침묵이 가진 힘을 경험으로 설명하기',
    starter: '말보다 침묵이 더 많은 걸 전했던 순간은...',
  },
  {
    id: 'essay-010', category: '짧은 에세이', difficulty: '어려움',
    prompt: '내가 두려워하는 것을 직면했을 때 어떤 일이 생기는지 써보세요.',
    goal: '두려움을 넘는 과정을 솔직하게 쓰기',
    starter: '두려움 앞에서 나는...',
  },
  {
    id: 'essay-011', category: '짧은 에세이', difficulty: '보통',
    prompt: '완벽하지 않아도 괜찮다는 것을 배운 순간을 써보세요.',
    goal: '그 순간이 나에게 준 깨달음을 한 문단으로 쓰기',
    starter: '완벽하지 않아도 된다는 걸 처음 느꼈을 때...',
  },
  {
    id: 'essay-012', category: '짧은 에세이', difficulty: '쉬움',
    prompt: '나에게 힘을 주는 작은 의식(루틴)이 있다면 소개해보세요.',
    goal: '그 루틴이 어떤 효과를 주는지 구체적으로 쓰기',
    starter: '내가 매일 하는 작은 의식 하나는...',
  },
];

// ─────────────────────────────────────────────
// 9. 하위 호환 래퍼
// ─────────────────────────────────────────────

/** @type {string[]} — 하위 호환용: WRITING_PROMPTS의 prompt 문자열 배열 */
export const DAILY_PROMPTS = WRITING_PROMPTS.map(p => p.prompt);

/**
 * 날짜를 기반으로 오늘의 글감 문자열을 반환합니다. (하위 호환)
 * @returns {string}
 */
export function getDailyPrompt() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

/**
 * 날짜를 기반으로 오늘의 글감 객체를 반환합니다.
 * @returns {PromptItem}
 */
export function getDailyPromptItem() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  return WRITING_PROMPTS[dayOfYear % WRITING_PROMPTS.length];
}

/**
 * 랜덤 글감 객체를 반환합니다. 직전 글감 id와 같은 글감이 나오지 않게 합니다.
 * @param {string} [lastId] - 직전에 표시했던 글감의 id
 * @returns {PromptItem}
 */
export function getRandomPromptItem(lastId) {
  const pool = lastId ? WRITING_PROMPTS.filter(p => p.id !== lastId) : WRITING_PROMPTS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * 화면 표시용 텍스트 (한 줄 요약)
 * @param {PromptItem} item
 * @returns {string}
 */
export function formatPromptForDisplay(item) {
  return item.prompt;
}

/**
 * textarea 삽입용 텍스트 (주제 + 첫 문장 힌트)
 * @param {PromptItem} item
 * @returns {string}
 */
export function formatPromptForWriting(item) {
  return `[${item.category}] ${item.prompt}\n\n${item.starter} `;
}

/**
 * 3문장 틀 삽입용 텍스트
 * @param {PromptItem} item
 * @returns {string}
 */
export function get3SentenceTemplate(item) {
  return `[주제] ${item.prompt}\n\n1. ${item.starter} \n2. 그때 느낀 마음은 \n3. 그래서 나는 `;
}
