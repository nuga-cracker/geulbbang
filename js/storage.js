/**
 * storage.js — localStorage 저장/불러오기/초기화 유틸리티
 * 게임 진행 상황(레벨, 경험치, 배지, 완성 글 목록 등)을 브라우저에 저장합니다.
 */

import { normalizeCustomStyle } from './authors.js';

// 저장소 키
const STORAGE_KEY = 'geulbbang_data';

function createDefaultState() {
  return {
    level: 1,
    exp: 0,
    totalWritings: 0,           // 총 첨삭받은 횟수
    totalRevisions: 0,          // 총 재작성 횟수
    badges: [],                 // 획득한 배지 ID 목록
    portfolio: [],              // 완성한 글 목록
    lastVisitDate: null,        // 마지막 방문 날짜 (연속 출석 계산)
    streakDays: 0,              // 연속 글쓰기 일수
    dailyDone: false,           // 오늘 글쓰기 완료 여부
    lastDailyDate: null,        // 마지막 오늘의 빵 완료 날짜
    selectedRecipe: 'free',     // 마지막으로 선택한 문체 레시피 ID ('free' = 자유롭게)
    recipeUsage: {},            // 문체 레시피별 사용 횟수 { recipeId: count }
    onboardingDone: false,      // 첫 방문 온보딩 완료 여부
    customStyle: normalizeCustomStyle({}), // 나만의 시그니처 빵 상태
    bakeHistory: [],            // 최근 빵 굽기 텍스트 기록
  };
}

/**
 * 현재 상태를 localStorage에 저장합니다.
 * @param {Object} state - 저장할 상태 객체
 */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('저장 실패:', e);
  }
}

/**
 * localStorage에서 상태를 불러옵니다.
 * 저장된 데이터가 없으면 기본 상태를 반환합니다.
 * @returns {Object} 게임 상태 객체
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const saved = JSON.parse(raw);
    const defaultState = createDefaultState();
    return {
      ...defaultState,
      ...saved,
      recipeUsage: (saved && typeof saved.recipeUsage === 'object' && saved.recipeUsage !== null)
        ? saved.recipeUsage
        : defaultState.recipeUsage,
      badges: Array.isArray(saved?.badges) ? saved.badges : defaultState.badges,
      portfolio: Array.isArray(saved?.portfolio) ? saved.portfolio : defaultState.portfolio,
      bakeHistory: Array.isArray(saved?.bakeHistory) ? saved.bakeHistory.filter(Boolean).slice(-25) : defaultState.bakeHistory,
      customStyle: normalizeCustomStyle(saved?.customStyle || {}),
    };
  } catch (e) {
    console.warn('불러오기 실패:', e);
    return createDefaultState();
  }
}

/**
 * 모든 게임 데이터를 초기화합니다.
 */
export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('초기화 실패:', e);
  }
  return createDefaultState();
}

/**
 * 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환합니다.
 * @returns {string}
 */
export function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
