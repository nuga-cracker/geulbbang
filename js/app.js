/**
 * app.js — 메인 애플리케이션 로직
 * 첨삭 엔진, 게임 시스템, 저장소를 연결하여 UI를 제어합니다.
 */

import { analyzeText, analyzeWritingFingerprint } from './checker.js';
import { addExp, calcExpGain, checkBadges, getBreadGrade, expForNextLevel, getDailyPrompt, BADGE_DEFS } from './game.js';
import { loadState, saveState, resetState, todayString } from './storage.js';
import { AUTHORS, getAuthorById } from './authors.js';

const CUSTOM_SIGNATURE_ID = 'custom_signature';
const MAX_HISTORY_COUNT = 50;
const SLIDER_LOW_THRESHOLD = 40;
const SLIDER_HIGH_THRESHOLD = 60;
const SLIDER_RANGE_FIRST_THIRD_MAX = 32;
const SLIDER_RANGE_SECOND_THIRD_MAX = 66;
const MAX_TOP_SUGGESTIONS = 3;
const NO_ANALYSIS_TEXT_MESSAGE = '아직 분석할 글이 없어요. 먼저 글을 굽고 다시 눌러봐요! ✍️';
const ANALYSIS_IDLE_MESSAGE = '아직 분석 전이에요. 글을 굽고 나서 눌러보세요! 🍞';

const ONBOARDING_STEPS = [
  {
    title: '🌾 글빵에 오신 걸 환영해요!',
    message: '여기는 글을 빵처럼 굽는 제빵소예요. 투박한 글도 여러 번 고치면 맛있는 빵이 돼요!',
  },
  {
    title: '✍️ 먼저 가볍게 써봐요',
    message: '일기, 짧은 이야기, 오늘 기분 아무거나 좋아요. 3~5문장으로 시작해도 충분해요!',
  },
  {
    title: '🔥 빵 굽기를 누르면',
    message: '칭찬 + 고치면 좋은 점을 같이 알려줘요. 첨삭을 보고 고쳐쓰면 점점 글이 탄탄해져요.',
  },
  {
    title: '🔁 흐름은 이렇게 흘러가요',
    message: '쓰기 → 빵 굽기(첨삭) → 고쳐쓰기 → 다시 굽기! 이 과정을 반복하면 경험치와 문장력이 함께 올라가요.',
  },
  {
    title: '🎨 나만의 문체도 만들 수 있어요',
    message: '설문 + 내 글 분석 + 슬라이더로 나만의 시그니처 빵을 완성해봐요. 자, 첫 빵을 구워볼까요? 🚀',
  },
];

// ─────────────────────────────────────────────
// 상태 초기화
// ─────────────────────────────────────────────
let state = loadState();
// 최근에 실행한 문체 지문 분석 결과(반영 전 임시 보관)
let latestFingerprint = null;
let onboardingStep = 0;

// 현재 편집 중인 글의 재작성 횟수 (페이지 내 세션)
let currentRevisionCount = 0;
let currentText = '';
let isFirstAnalysis = true;

// ─────────────────────────────────────────────
// DOM 요소
// ─────────────────────────────────────────────
const textArea = document.getElementById('writing-area');
const bakeBtn = document.getElementById('bake-btn');
const charCounter = document.getElementById('char-count');
const feedbackSection = document.getElementById('feedback-section');
const feedbackContent = document.getElementById('feedback-content');
const levelDisplay = document.getElementById('level-display');
const expBar = document.getElementById('exp-bar');
const expText = document.getElementById('exp-text');
const gradeDisplay = document.getElementById('grade-display');
const badgeList = document.getElementById('badge-list');
const portfolioList = document.getElementById('portfolio-list');
const dailyPromptEl = document.getElementById('daily-prompt');
const resetBtn = document.getElementById('reset-btn');
const toastContainer = document.getElementById('toast-container');
const dailyUseBreadBtn = document.getElementById('daily-use-btn');
const recipeCardsEl = document.getElementById('recipe-cards');
const recipeToggleBtn = document.getElementById('recipe-toggle-btn');
const recipeSelectorContent = document.getElementById('recipe-selector-content');
const recipeSelectedLabel = document.getElementById('recipe-selected-label');
const helpBtn = document.getElementById('help-btn');

// 나만의 문체 DOM
const customMoodSelect = document.getElementById('custom-mood');
const customSentenceSelect = document.getElementById('custom-sentence-style');
const customToneSelect = document.getElementById('custom-tone');
const customKeywordsInput = document.getElementById('custom-keywords');
const customSurveyApplyBtn = document.getElementById('custom-survey-apply-btn');
const customAnalyzeBtn = document.getElementById('custom-analyze-btn');
const customAnalysisApplyBtn = document.getElementById('custom-analysis-apply-btn');
const styleAnalysisResultEl = document.getElementById('style-analysis-result');
const sliderLength = document.getElementById('slider-length');
const sliderRichness = document.getElementById('slider-richness');
const sliderEnergy = document.getElementById('slider-energy');
const sliderHumor = document.getElementById('slider-humor');
const sliderPreview = document.getElementById('slider-preview');
const sliderApplyBtn = document.getElementById('slider-apply-btn');

// 온보딩 DOM
const onboardingModal = document.getElementById('onboarding-modal');
const onboardingStepIndicator = document.getElementById('onboarding-step-indicator');
const onboardingTitle = document.getElementById('onboarding-title');
const onboardingMessage = document.getElementById('onboarding-message');
const onboardingPrevBtn = document.getElementById('onboarding-prev-btn');
const onboardingNextBtn = document.getElementById('onboarding-next-btn');
const onboardingSkipBtn = document.getElementById('onboarding-skip-btn');

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function parseKeywords(raw) {
  return String(raw || '')
    .split(',')
    .map(word => word.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function trimHistoryToMaxSize(list, maxSize) {
  if (!Array.isArray(list)) return [];
  if (list.length <= maxSize) return list;
  return list.slice(list.length - maxSize);
}

function createDefaultCustomStyle() {
  return {
    id: CUSTOM_SIGNATURE_ID,
    name: '🏆 나만의 시그니처 빵',
    baseAuthor: '나의 글습관 기반',
    copyrightStatus: 'original',
    mood: '🌟 아직 반죽 중이에요. 설문부터 시작해볼까요?',
    styleFeatures: {
      viewpoint: '내 이야기를 솔직하게 쓰는 시점',
      tone: '다정하고 또렷한 어조',
      sentence: '짧지도 길지도 않은 균형형 문장',
      emotion: '따뜻함과 진심이 느껴지는 감정',
      vocabulary: '내가 자주 쓰는 친근한 단어 중심',
    },
    editingGuidelines: [
      '오늘 느낀 마음을 한 문장으로 먼저 써봐요.',
      '내가 자주 쓰는 표현을 한두 개 넣어 개성을 살려봐요.',
      '문장이 너무 길어지면 끊어 읽기 좋게 나눠봐요.',
    ],
    encouragements: [
      '좋아요! 내 문체를 찾는 연습이 잘 되고 있어요! 🌟',
      '한 줄 한 줄이 너만의 시그니처가 되고 있어요! 🏆',
      '지금처럼 쓰면 내 문체가 점점 선명해져요! ✨',
    ],
    exampleSentences: ['오늘의 마음을 담아, 나만의 온도로 한 줄을 구웠다.'],
    survey: {
      mood: 'bright',
      sentenceStyle: 'short',
      tone: 'formal',
      keywords: [],
    },
    sliders: {
      length: 50,
      richness: 50,
      energy: 50,
      humor: 50,
    },
    fingerprint: null,
    sliderAppliedCount: 0,
    ready: false,
    updatedAt: todayString(),
  };
}

function ensureStateShape() {
  if (!Array.isArray(state.badges)) state.badges = [];
  if (!Array.isArray(state.portfolio)) state.portfolio = [];
  if (!Array.isArray(state.writingHistory)) state.writingHistory = [];
  if (!state.recipeUsage || typeof state.recipeUsage !== 'object' || Array.isArray(state.recipeUsage)) state.recipeUsage = {};

  const base = createDefaultCustomStyle();
  if (!state.customStyle || typeof state.customStyle !== 'object') {
    state.customStyle = base;
    return;
  }

  state.customStyle = {
    ...base,
    ...state.customStyle,
    survey: { ...base.survey, ...(state.customStyle.survey || {}) },
    sliders: { ...base.sliders, ...(state.customStyle.sliders || {}) },
    styleFeatures: { ...base.styleFeatures, ...(state.customStyle.styleFeatures || {}) },
    editingGuidelines: Array.isArray(state.customStyle.editingGuidelines) && state.customStyle.editingGuidelines.length
      ? state.customStyle.editingGuidelines
      : base.editingGuidelines,
    encouragements: Array.isArray(state.customStyle.encouragements) && state.customStyle.encouragements.length
      ? state.customStyle.encouragements
      : base.encouragements,
    exampleSentences: Array.isArray(state.customStyle.exampleSentences) && state.customStyle.exampleSentences.length
      ? state.customStyle.exampleSentences
      : base.exampleSentences,
  };
}

function getRecipeProfile(recipeId) {
  if (recipeId === CUSTOM_SIGNATURE_ID) {
    return state.customStyle || createDefaultCustomStyle();
  }
  return getAuthorById(recipeId);
}

function recordWritingHistory(text) {
  const normalized = String(text || '').trim();
  if (!normalized) return;
  const history = state.writingHistory || [];
  const last = history[history.length - 1];
  if (last && last.text === normalized) return;
  history.push({ text: normalized, date: todayString() });
  state.writingHistory = trimHistoryToMaxSize(history, MAX_HISTORY_COUNT);
}

function collectUserTextsForFingerprint() {
  const historyTexts = (state.writingHistory || []).map(item => item.text).filter(Boolean);
  const portfolioTexts = (state.portfolio || []).map(item => item.text).filter(Boolean);
  return [...new Set([...historyTexts, ...portfolioTexts])];
}

function showNewBadges(newBadges = []) {
  newBadges.forEach(badge => {
    showToast(`🏅 새 배지 획득: ${badge.name}`, 'badge');
  });
}

function updateBadgesWithToast(extra = {}) {
  const newBadges = checkBadges(state, extra);
  if (newBadges.length > 0) {
    updateBadgeList();
    saveState(state);
    showNewBadges(newBadges);
  }
}

// ─────────────────────────────────────────────
// UI 갱신 함수들
// ─────────────────────────────────────────────
function updateStatusBar() {
  const grade = getBreadGrade(state.level);
  const needed = expForNextLevel(state.level);
  const progress = needed > 0 ? Math.min((state.exp / needed) * 100, 100) : 100;

  levelDisplay.textContent = `레벨 ${state.level}`;
  gradeDisplay.textContent = `${grade.emoji} ${grade.name}`;
  expBar.style.width = `${progress}%`;
  expText.textContent = `${state.exp} / ${needed} EXP`;
}

function updateBadgeList() {
  badgeList.innerHTML = '';
  if (state.badges.length === 0) {
    badgeList.innerHTML = '<p class="empty-msg">아직 배지가 없어요. 글을 써봐요! 🌾</p>';
    return;
  }
  state.badges.forEach(id => {
    const def = BADGE_DEFS.find(b => b.id === id);
    if (!def) return;
    const el = document.createElement('div');
    el.className = 'badge-item';
    el.innerHTML = `<span class="badge-name">${def.name}</span><span class="badge-desc">${def.description}</span>`;
    badgeList.appendChild(el);
  });
}

function updatePortfolio() {
  portfolioList.innerHTML = '';
  if (state.portfolio.length === 0) {
    portfolioList.innerHTML = '<p class="empty-msg">아직 완성한 빵이 없어요. 글을 쓰고 진열장에 추가해봐요! 🍞</p>';
    return;
  }
  const sorted = [...state.portfolio].reverse();
  sorted.forEach(portfolioItem => {
    const el = document.createElement('div');
    el.className = 'portfolio-item';
    const recipeLabel = portfolioItem.recipeName ? `<span class="portfolio-recipe">${escapeHtml(portfolioItem.recipeName)}</span>` : '';
    el.innerHTML = `
      <div class="portfolio-header">
        <span class="portfolio-grade">${portfolioItem.gradeEmoji} ${portfolioItem.gradeName}</span>
        <span class="portfolio-score">맛있음 ${portfolioItem.score}점</span>
        ${recipeLabel}
        <span class="portfolio-date">${portfolioItem.date}</span>
      </div>
      <p class="portfolio-text">${escapeHtml(portfolioItem.text.slice(0, 100))}${portfolioItem.text.length > 100 ? '...' : ''}</p>
      <div class="portfolio-meta">수정 횟수: ${portfolioItem.revisionCount}회 | 글자 수: ${portfolioItem.charCount}자</div>
    `;
    portfolioList.appendChild(el);
  });
}

function updateDailyPrompt() {
  const prompt = getDailyPrompt();
  dailyPromptEl.textContent = `📝 오늘의 글감: ${prompt}`;
}

// ─────────────────────────────────────────────
// 레시피 카드 렌더링
// ─────────────────────────────────────────────
function renderRecipeCards() {
  if (!recipeCardsEl) return;
  recipeCardsEl.innerHTML = '';

  const freeCard = createRecipeCard({
    id: 'free',
    name: '✨ 자유롭게',
    mood: '나만의 스타일로 자유롭게!',
  }, state.selectedRecipe === 'free');
  recipeCardsEl.appendChild(freeCard);

  const customRecipe = getRecipeProfile(CUSTOM_SIGNATURE_ID);
  const customMood = customRecipe.ready
    ? customRecipe.mood
    : '🌱 설문·분석·슬라이더로 내 문체를 완성해요';
  const customCard = createRecipeCard(
    { id: CUSTOM_SIGNATURE_ID, name: '🏆 나만의 시그니처 빵', mood: customMood },
    state.selectedRecipe === CUSTOM_SIGNATURE_ID,
  );
  recipeCardsEl.appendChild(customCard);

  AUTHORS.forEach(author => {
    const card = createRecipeCard(author, state.selectedRecipe === author.id);
    recipeCardsEl.appendChild(card);
  });
  updateRecipeSelectorSummary();
}

function createRecipeCard(author, isSelected) {
  const card = document.createElement('div');
  card.className = `recipe-card${isSelected ? ' selected' : ''}`;
  card.setAttribute('role', 'option');
  card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  card.dataset.id = author.id;

  card.innerHTML = `
    <span class="recipe-card-name">${escapeHtml(author.name || author.id)}</span>
    <span class="recipe-card-mood">${escapeHtml(author.mood || '')}</span>
  `;
  card.addEventListener('click', () => handleRecipeSelect(author.id));
  return card;
}

function handleRecipeSelect(recipeId) {
  state.selectedRecipe = recipeId;
  saveState(state);
  renderRecipeCards();
  const profile = getRecipeProfile(recipeId);
  if (profile) {
    showToast(`🍽️ "${profile.name}" 레시피를 선택했어요!`, 'info');
  } else {
    showToast('✨ 자유롭게 쓰는 모드예요!', 'info');
  }
}

function updateRecipeSelectorSummary() {
  if (!recipeSelectedLabel) return;
  const selectedProfile = getRecipeProfile(state.selectedRecipe || 'free');
  recipeSelectedLabel.textContent = selectedProfile?.name || '✨ 자유롭게';
}

function initRecipeSelectorToggle() {
  if (!recipeToggleBtn || !recipeSelectorContent) return;
  const setExpanded = (expanded) => {
    recipeSelectorContent.classList.toggle('hidden', !expanded);
    recipeToggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    recipeToggleBtn.textContent = expanded ? '문체 레시피 선택하기 ▲' : '문체 레시피 선택하기 ▼';
  };
  setExpanded(false);
  recipeToggleBtn.addEventListener('click', () => {
    const expanded = recipeToggleBtn.getAttribute('aria-expanded') === 'true';
    setExpanded(!expanded);
  });
}

// ─────────────────────────────────────────────
// 연속 출석 체크
// ─────────────────────────────────────────────
function checkStreak() {
  const today = todayString();
  if (state.lastVisitDate === today) return;

  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const y = yDate.getFullYear();
  const m = String(yDate.getMonth() + 1).padStart(2, '0');
  const d = String(yDate.getDate()).padStart(2, '0');
  const yStr = `${y}-${m}-${d}`;

  if (state.lastVisitDate === yStr) {
    state.streakDays += 1;
  } else if (state.lastVisitDate !== null && state.lastVisitDate !== today) {
    state.streakDays = 1;
  } else if (state.lastVisitDate === null) {
    state.streakDays = 1;
  }
  state.lastVisitDate = today;
  saveState(state);
}

// ─────────────────────────────────────────────
// 피드백 렌더링
// ─────────────────────────────────────────────
function renderFeedback(result) {
  const { issues, grammarSuggestions = [], stats, score, praise } = result;
  const selectedProfile = getRecipeProfile(state.selectedRecipe);
  const scoreColor = score >= 80 ? '#27ae60' : score >= 60 ? '#f39c12' : '#e74c3c';
  const issueSummaries = issues.map(issue => issue.message);
  const grammarSummaries = grammarSuggestions.map(item => item.suggestion);
  const topSuggestions = [];
  if (issueSummaries.length > 0) topSuggestions.push(issueSummaries.shift());
  if (grammarSummaries.length > 0) topSuggestions.push(grammarSummaries.shift());
  while (topSuggestions.length < MAX_TOP_SUGGESTIONS && (issueSummaries.length > 0 || grammarSummaries.length > 0)) {
    if (issueSummaries.length > 0) topSuggestions.push(issueSummaries.shift());
    if (topSuggestions.length < MAX_TOP_SUGGESTIONS && grammarSummaries.length > 0) topSuggestions.push(grammarSummaries.shift());
  }
  const topSuggestionsHtml = topSuggestions.length > 0
    ? `
      <ul class="feedback-top-list">
        ${topSuggestions.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    `
    : '<p class="feedback-top-empty">✨ 지금 글의 흐름이 아주 좋아요! 이 분위기를 유지해봐요.</p>';

  let html = `
    <div class="feedback-summary">
      <div class="feedback-praise">
        <span class="feedback-baker-icon">👨‍🍳</span>
        <p>${escapeHtml(praise)}</p>
      </div>
      <div class="feedback-score" style="color:${scoreColor}">
        오늘의 맛있음 점수: <strong>${score}점</strong>
      </div>
      <div class="feedback-top">
        <p class="feedback-top-title">가장 먼저 보면 좋은 제안 ${topSuggestions.length}개</p>
        ${topSuggestionsHtml}
      </div>
    </div>
    <details class="feedback-details">
      <summary class="feedback-details-summary">자세한 첨삭 보기 ▼</summary>
      <div class="feedback-details-content">
        <div class="feedback-stats">
          📊 글자 수: <strong>${stats.charCount}</strong>자 &nbsp;|&nbsp;
          단어 수: <strong>${stats.wordCount}</strong>개 &nbsp;|&nbsp;
          문장 수: <strong>${stats.sentenceCount}</strong>개
        </div>
  `;

  if (issues.length === 0) {
    html += '<div class="feedback-no-issues">✨ 지적할 사항이 없어요! 완벽한 빵이에요!</div>';
  } else {
    html += `<div class="feedback-issues-title">🔍 선생님의 첨삭 의견 (${issues.length}가지)</div><ul class="feedback-issues">`;
    issues.forEach(issue => {
      const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵';
      html += `
        <li class="feedback-issue severity-${issue.severity}">
          <span class="issue-icon">${icon}</span>
          <div class="issue-body">
            <p class="issue-message">${escapeHtml(issue.message)}</p>
            <p class="issue-why">💡 왜 고치면 좋냐면: ${escapeHtml(issue.why)}</p>
          </div>
        </li>
      `;
    });
    html += '</ul><p class="feedback-encourage">✏️ 고쳐쓰기를 해보세요! 고칠수록 경험치가 더 많이 올라요! 🎮</p>';
  }

  if (grammarSuggestions.length > 0) {
    html += `
      <div class="feedback-grammar-section">
        <div class="feedback-grammar-title">🧁 비문 다듬기 (${grammarSuggestions.length}가지 제안)</div>
        <ul class="feedback-grammar-list">
    `;
    grammarSuggestions.forEach(item => {
      const applyBtnHtml = item.replacement
        ? `<button class="apply-suggestion-btn"
                  data-from="${escapeHtml(item.replacement.from)}"
                  data-to="${escapeHtml(item.replacement.to)}">이 제안 적용하기</button>`
        : '';
      html += `
        <li class="feedback-grammar-item">
          <p class="feedback-grammar-source">원문: ${escapeHtml(item.excerpt)}</p>
          <p class="feedback-grammar-message">${escapeHtml(item.message)}</p>
          <p class="feedback-grammar-suggestion">→ ${escapeHtml(item.suggestion)}</p>
          ${applyBtnHtml}
        </li>
      `;
    });
    html += `
        </ul>
      </div>
    `;
  }

  if (selectedProfile) {
    const encouragements = selectedProfile.encouragements || ['좋은 흐름이에요! 내 문체를 살려 더 다듬어봐요!'];
    const guidelines = selectedProfile.editingGuidelines || ['핵심 한 줄을 먼저 또렷하게 써봐요.'];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    const guideline = guidelines[Math.floor(Math.random() * guidelines.length)];
    html += `
      <div class="recipe-feedback-section">
        <div class="recipe-feedback-title">🍽️ ${escapeHtml(selectedProfile.name)} 관점에서 보면…</div>
        <p class="recipe-feedback-encouragement">${escapeHtml(encouragement)}</p>
        <p class="recipe-feedback-guideline">💡 이렇게 다듬어봐요: ${escapeHtml(guideline)}</p>
        <p class="recipe-feedback-mood">${escapeHtml(selectedProfile.mood || '')}</p>
      </div>
    `;
  }

  html += `
      <div class="feedback-growth">🌾 성장 현황: 레벨 ${state.level}, 현재 ${state.exp} EXP</div>
      </div>
    </details>
  `;

  html += `
    <div class="feedback-actions">
      <button id="save-to-portfolio-btn" class="btn btn-secondary">🗂️ 진열장에 추가</button>
    </div>
  `;

  feedbackContent.innerHTML = html;
  feedbackSection.classList.remove('hidden');
  document.getElementById('save-to-portfolio-btn').addEventListener('click', () => {
    saveToPortfolio(result);
  });
  feedbackContent.querySelectorAll('.apply-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const from = btn.dataset.from;
      const to = btn.dataset.to;
      const current = textArea.value;
      if (current.includes(from)) {
        textArea.value = current.replaceAll(from, to);
        btn.textContent = '✅ 적용 완료';
        btn.disabled = true;
        btn.classList.add('apply-suggestion-done');
        showToast('제안을 반영했어요. 다시 빵 굽기를 눌러 확인해보세요! 🍞', 'success');
      } else {
        showToast('이미 반영됐거나 원문이 바뀌었어요.', 'warning');
      }
    });
  });
}

// ─────────────────────────────────────────────
// 진열장에 저장
// ─────────────────────────────────────────────
function saveToPortfolio(result) {
  const grade = getBreadGrade(state.level);
  const selectedProfile = getRecipeProfile(state.selectedRecipe);
  const item = {
    id: Date.now(),
    text: currentText,
    score: result.score,
    gradeName: grade.name,
    gradeEmoji: grade.emoji,
    revisionCount: currentRevisionCount,
    charCount: result.stats.charCount,
    date: todayString(),
    recipeId: state.selectedRecipe || 'free',
    recipeName: selectedProfile ? selectedProfile.name : '✨ 자유롭게',
  };
  state.portfolio.push(item);
  saveState(state);
  updatePortfolio();
  showToast('🗂️ 진열장에 추가됐어요!', 'success');
  updateBadgesWithToast({
    score: result.score,
    charCount: result.stats.charCount,
    revisionCount: currentRevisionCount,
    selectedRecipe: state.selectedRecipe,
  });
}

// ─────────────────────────────────────────────
// 메인: 빵 굽기 버튼 클릭
// ─────────────────────────────────────────────
function handleBake() {
  const text = textArea.value.trim();
  if (!text) {
    showToast('글을 먼저 입력해주세요! ✍️', 'warning');
    return;
  }

  if (!isFirstAnalysis && text === currentText) {
    showToast('글을 고쳐서 다시 구워봐요! ✏️', 'info');
    return;
  }
  if (!isFirstAnalysis && text !== currentText) {
    currentRevisionCount += 1;
  }
  currentText = text;
  isFirstAnalysis = false;

  const result = analyzeText(text, currentRevisionCount);
  checkStreak();

  if (state.selectedRecipe && state.selectedRecipe !== 'free') {
    state.recipeUsage[state.selectedRecipe] = (state.recipeUsage[state.selectedRecipe] || 0) + 1;
  }

  recordWritingHistory(text);

  const expGain = calcExpGain({
    score: result.score,
    stats: result.stats,
    revisionCount: currentRevisionCount,
  });
  const levelUps = addExp(state, expGain);

  state.totalWritings += 1;
  if (currentRevisionCount > 0) state.totalRevisions += 1;

  const today = todayString();
  if (state.lastDailyDate !== today) {
    state.lastDailyDate = today;
  }

  const newBadges = checkBadges(state, {
    score: result.score,
    charCount: result.stats.charCount,
    revisionCount: currentRevisionCount,
    selectedRecipe: state.selectedRecipe,
  });

  saveState(state);

  renderFeedback(result);
  updateStatusBar();
  updateBadgeList();
  updateCustomStylePanel();

  showToast(`+${expGain} EXP 획득! 🍞`, 'exp');
  if (levelUps > 0) {
    const grade = getBreadGrade(state.level);
    showToast(`🎉 레벨 업! 레벨 ${state.level} 달성! ${grade.emoji} ${grade.name}`, 'levelup');
  }
  showNewBadges(newBadges);

  bakeBtn.textContent = '🔥 다시 굽기 (고쳐쓰기)';
  feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─────────────────────────────────────────────
// 글자 수 카운터
// ─────────────────────────────────────────────
function updateCharCount() {
  const len = textArea.value.replace(/\s/g, '').length;
  charCounter.textContent = `${len}자`;
}

// ─────────────────────────────────────────────
// 데이터 초기화
// ─────────────────────────────────────────────
function handleReset() {
  if (!confirm('⚠️ 모든 진행 상황(레벨, 경험치, 배지, 진열장)이 초기화됩니다. 정말 초기화하시겠어요?')) return;
  state = resetState();
  ensureStateShape();
  latestFingerprint = null;
  currentRevisionCount = 0;
  currentText = '';
  isFirstAnalysis = true;
  textArea.value = '';
  feedbackSection.classList.add('hidden');
  bakeBtn.textContent = '🔥 빵 굽기 (첨삭받기)';
  updateStatusBar();
  updateBadgeList();
  updatePortfolio();
  updateCharCount();
  renderRecipeCards();
  updateCustomStylePanel();
  showToast('🌾 초기화됐어요. 새 반죽으로 시작해봐요!', 'info');
  openOnboarding();
}

// ─────────────────────────────────────────────
// 오늘의 글감 사용 버튼
// ─────────────────────────────────────────────
function handleUseDailyPrompt() {
  const prompt = getDailyPrompt();
  const currentVal = textArea.value.trim();
  if (currentVal && !confirm('현재 작성 중인 글을 지우고 오늘의 글감을 불러올까요?')) return;
  textArea.value = `[오늘의 글감] ${prompt}\n\n`;
  textArea.focus();
  textArea.setSelectionRange(textArea.value.length, textArea.value.length);
  updateCharCount();
  currentRevisionCount = 0;
  currentText = '';
  isFirstAnalysis = true;
  feedbackSection.classList.add('hidden');
  bakeBtn.textContent = '🔥 빵 굽기 (첨삭받기)';
}

// ─────────────────────────────────────────────
// 탭 전환
// ─────────────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.remove('hidden');
    });
  });
}

// ─────────────────────────────────────────────
// 나만의 문체
// ─────────────────────────────────────────────
function buildSentenceStyleText(length) {
  if (length <= SLIDER_RANGE_FIRST_THIRD_MAX) return '짧고 톡톡 끊어 읽히는 문장';
  if (length <= SLIDER_RANGE_SECOND_THIRD_MAX) return '길이감이 균형 잡힌 문장';
  return '길고 물 흐르듯 이어지는 문장';
}

function buildToneText(energy, humor) {
  const energyText = energy < 33 ? '차분하고 안정적인' : energy < 67 ? '부드럽고 균형 잡힌' : '활발하고 경쾌한';
  const humorText = humor < 33 ? '진중한' : humor < 67 ? '따뜻한 미소가 있는' : '유머가 자주 살아나는';
  return `${energyText} 흐름에 ${humorText} 말투`;
}

function buildVocabularyText(richness, keywords = []) {
  const richnessText = richness < 33 ? '담백하고 쉬운 어휘 중심' : richness < 67 ? '친숙함과 표현력이 균형 잡힌 어휘' : '비유와 감각어가 풍성한 어휘';
  if (keywords.length === 0) return richnessText;
  return `${richnessText} (시그니처 단어: ${keywords.join(', ')})`;
}

function buildSliderPreviewText(values) {
  const sentenceLead = values.length < SLIDER_LOW_THRESHOLD
    ? '짧게 톡, 또박또박'
    : values.length > SLIDER_HIGH_THRESHOLD
      ? '천천히 길게, 흐르듯'
      : '리듬 있게 고르게';
  const mood = values.energy < SLIDER_LOW_THRESHOLD
    ? '차분한 숨결로'
    : values.energy > SLIDER_HIGH_THRESHOLD
      ? '활기찬 발걸음으로'
      : '편안한 온도로';
  const humor = values.humor < SLIDER_LOW_THRESHOLD
    ? '진지한 마음을 담아'
    : values.humor > SLIDER_HIGH_THRESHOLD
      ? '살짝 웃음기를 섞어'
      : '따뜻한 미소를 얹어';
  const richness = values.richness < SLIDER_LOW_THRESHOLD
    ? '담백한 단어로'
    : values.richness > SLIDER_HIGH_THRESHOLD
      ? '색깔 있는 표현으로'
      : '친근한 말들로';
  return `미리보기: ${sentenceLead}, ${mood} ${humor} ${richness} 오늘의 이야기를 구워봐요.`;
}

function getSliderValues() {
  if (!sliderLength || !sliderRichness || !sliderEnergy || !sliderHumor) {
    showToast('슬라이더 초기화 중 문제가 발생했어요. 페이지를 새로고침해 주세요.', 'warning');
    return {
      length: 50,
      richness: 50,
      energy: 50,
      humor: 50,
    };
  }
  return {
    length: Number(sliderLength.value),
    richness: Number(sliderRichness.value),
    energy: Number(sliderEnergy.value),
    humor: Number(sliderHumor.value),
  };
}

function updateSliderPreview() {
  const values = getSliderValues();
  sliderPreview.textContent = buildSliderPreviewText(values);
}

function renderFingerprintSummary(fingerprint) {
  const topWords = fingerprint.topWords.length ? fingerprint.topWords.join(', ') : '아직 뚜렷한 반복 단어는 없어요';
  return [
    `🧪 분석 글 수: ${fingerprint.sampleSize}편`,
    `✂️ 평균 문장 길이: ${fingerprint.avgSentenceLength}자 (${fingerprint.sentenceStyle})`,
    `🗣️ 말투 경향: ${fingerprint.toneTrend} (존댓말 ${fingerprint.formalCount}회 / 반말 ${fingerprint.informalCount}회)`,
    `❓ 물음표 ${fingerprint.questionCount}개 · ❗ 느낌표 ${fingerprint.exclamationCount}개`,
    `🧂 자주 쓰는 단어: ${topWords}`,
  ].join('\n');
}

function applySurveyToCustomStyle() {
  const moodMap = {
    bright: { mood: '😄 밝고 재미있는 분위기', tone: '명랑하고 또렷한 어조' },
    warm: { mood: '🌸 따뜻하고 다정한 분위기', tone: '포근하고 공감되는 어조' },
    calm: { mood: '🕯️ 차분하고 진지한 분위기', tone: '조용하고 깊이 있는 어조' },
  };
  const sentenceMap = {
    short: '짧고 툭툭 끊어지는 경쾌한 문장',
    flow: '길고 흐르듯 이어지는 문장',
    rhythm: '리듬감 있게 반복이 살아있는 문장',
  };
  const toneMap = {
    formal: { viewpoint: '읽는 사람을 배려하는 존댓말 시점', tone: '공손하고 또렷한 말투' },
    casual: { viewpoint: '친구에게 말하듯 편안한 시점', tone: '자연스럽고 친근한 말투' },
    diary: { viewpoint: '오늘을 기록하는 일기 시점', tone: '솔직하고 다정한 말투' },
  };

  const moodValue = customMoodSelect.value;
  const sentenceValue = customSentenceSelect.value;
  const toneValue = customToneSelect.value;
  const keywords = parseKeywords(customKeywordsInput.value);
  const moodInfo = moodMap[moodValue];
  const toneInfo = toneMap[toneValue];

  state.customStyle.survey = {
    mood: moodValue,
    sentenceStyle: sentenceValue,
    tone: toneValue,
    keywords,
  };
  state.customStyle.ready = true;
  state.customStyle.mood = `${moodInfo.mood} · ${sentenceMap[sentenceValue]}`;
  state.customStyle.styleFeatures = {
    viewpoint: toneInfo.viewpoint,
    tone: `${moodInfo.tone}, ${toneInfo.tone}`,
    sentence: sentenceMap[sentenceValue],
    emotion: moodInfo.mood,
    vocabulary: buildVocabularyText(state.customStyle.sliders.richness, keywords),
  };
  state.customStyle.editingGuidelines = [
    `${sentenceMap[sentenceValue]}을 유지해 리듬을 살려보세요.`,
    `한 단락에 ${keywords.length > 0 ? `"${keywords[0]}" 같은 시그니처 단어` : '나만의 자주 쓰는 단어'}를 넣어 개성을 살려봐요.`,
    `${toneInfo.tone}를 끝까지 유지하면 글의 결이 더 또렷해져요.`,
  ];
  state.customStyle.encouragements = [
    `좋아요! ${moodInfo.mood} 느낌이 잘 살아나고 있어요!`,
    '한 줄 한 줄이 너만의 시그니처가 되고 있어요!',
    '지금 방향 아주 좋아요. 조금만 다듬으면 더 맛있어요!',
  ];
  state.customStyle.updatedAt = todayString();
}

function handleCustomSurveyApply() {
  applySurveyToCustomStyle();
  saveState(state);
  renderRecipeCards();
  updateCustomStylePanel();
  updateBadgesWithToast({ selectedRecipe: state.selectedRecipe });
  showToast('🏆 설문으로 나만의 시그니처 빵 반죽을 만들었어요!', 'success');
}

function handleCustomAnalyze() {
  const texts = collectUserTextsForFingerprint();
  if (texts.length === 0) {
    latestFingerprint = null;
    styleAnalysisResultEl.textContent = NO_ANALYSIS_TEXT_MESSAGE;
    showToast(NO_ANALYSIS_TEXT_MESSAGE, 'warning');
    return;
  }
  latestFingerprint = analyzeWritingFingerprint(texts);
  styleAnalysisResultEl.textContent = renderFingerprintSummary(latestFingerprint);
  showToast('🔎 내 글 문체 지문 분석이 완료됐어요!', 'info');
}

function handleCustomAnalysisApply() {
  if (!latestFingerprint) {
    showToast('먼저 "내 글 분석하기" 버튼을 눌러주세요!', 'warning');
    return;
  }

  const keywords = state.customStyle.survey.keywords || [];
  state.customStyle.ready = true;
  state.customStyle.fingerprint = {
    ...latestFingerprint,
    applied: true,
    updatedAt: todayString(),
  };
  state.customStyle.styleFeatures.sentence = `평균 ${latestFingerprint.avgSentenceLength}자의 ${latestFingerprint.sentenceStyle} 문장`;
  state.customStyle.styleFeatures.tone = `${latestFingerprint.toneTrend} 말투`;
  const selectedWords = keywords.length > 0 ? keywords : latestFingerprint.topWords.slice(0, 3);
  state.customStyle.styleFeatures.vocabulary = buildVocabularyText(state.customStyle.sliders.richness, selectedWords);
  state.customStyle.editingGuidelines = [
    `현재 평균 문장 길이(${latestFingerprint.avgSentenceLength}자)를 유지하며 한두 문장만 더 짧게 끊어 리듬을 조절해봐요.`,
    `자주 쓰는 단어(${latestFingerprint.topWords.slice(0, 3).join(', ') || '핵심 단어'})를 의도적으로 배치해 문체를 선명하게 해봐요.`,
    `물음표(${latestFingerprint.questionCount})와 느낌표(${latestFingerprint.exclamationCount}) 개수를 조절해 감정 온도를 맞춰봐요.`,
  ];
  state.customStyle.mood = `🧬 내 글 분석 기반 문체 (${latestFingerprint.sentenceStyle}, ${latestFingerprint.toneTrend})`;
  state.customStyle.updatedAt = todayString();

  saveState(state);
  renderRecipeCards();
  updateCustomStylePanel();
  updateBadgesWithToast({ selectedRecipe: state.selectedRecipe });
  showToast('🧬 분석 결과를 시그니처 빵에 반영했어요!', 'success');
}

function handleSliderApply() {
  const values = getSliderValues();
  const keywords = state.customStyle.survey.keywords || [];
  state.customStyle.ready = true;
  state.customStyle.sliders = values;
  state.customStyle.sliderAppliedCount = (state.customStyle.sliderAppliedCount || 0) + 1;
  state.customStyle.styleFeatures.sentence = buildSentenceStyleText(values.length);
  state.customStyle.styleFeatures.tone = buildToneText(values.energy, values.humor);
  state.customStyle.styleFeatures.vocabulary = buildVocabularyText(values.richness, keywords);
  state.customStyle.styleFeatures.emotion = values.energy < 50 ? '차분하고 안정된 정서' : '활기차고 생동감 있는 정서';
  state.customStyle.editingGuidelines = [
    `${buildSentenceStyleText(values.length)}을 유지해 문장 호흡을 맞춰봐요.`,
    `${buildToneText(values.energy, values.humor)}를 떠올리며 문장 끝 어미를 통일해봐요.`,
    `${buildVocabularyText(values.richness, keywords)} 흐름으로 단어를 골라보세요.`,
  ];
  state.customStyle.exampleSentences = [buildSliderPreviewText(values).replace('미리보기: ', '')];
  state.customStyle.mood = `🎚️ 슬라이더 조율형 문체 (${state.customStyle.sliderAppliedCount}회 조정)`;
  state.customStyle.updatedAt = todayString();

  saveState(state);
  renderRecipeCards();
  updateCustomStylePanel();
  updateBadgesWithToast({ selectedRecipe: state.selectedRecipe });
  showToast('🎚️ 슬라이더 설정을 문체에 반영했어요!', 'success');
}

function updateCustomStylePanel() {
  const custom = state.customStyle || createDefaultCustomStyle();

  customMoodSelect.value = custom.survey.mood;
  customSentenceSelect.value = custom.survey.sentenceStyle;
  customToneSelect.value = custom.survey.tone;
  customKeywordsInput.value = (custom.survey.keywords || []).join(', ');

  sliderLength.value = custom.sliders.length;
  sliderRichness.value = custom.sliders.richness;
  sliderEnergy.value = custom.sliders.energy;
  sliderHumor.value = custom.sliders.humor;
  updateSliderPreview();

  if (custom.fingerprint && custom.fingerprint.applied) {
    styleAnalysisResultEl.textContent = `${renderFingerprintSummary(custom.fingerprint)}\n✅ 이 분석이 시그니처 빵에 반영돼 있어요.`;
  } else {
    styleAnalysisResultEl.textContent = ANALYSIS_IDLE_MESSAGE;
  }
}

function initCustomStyle() {
  customSurveyApplyBtn.addEventListener('click', handleCustomSurveyApply);
  customAnalyzeBtn.addEventListener('click', handleCustomAnalyze);
  customAnalysisApplyBtn.addEventListener('click', handleCustomAnalysisApply);
  sliderApplyBtn.addEventListener('click', handleSliderApply);
  [sliderLength, sliderRichness, sliderEnergy, sliderHumor].forEach(el => {
    el.addEventListener('input', updateSliderPreview);
  });
  updateCustomStylePanel();
}

// ─────────────────────────────────────────────
// 온보딩 / 도움말
// ─────────────────────────────────────────────
function renderOnboardingStep() {
  const step = ONBOARDING_STEPS[onboardingStep];
  onboardingStepIndicator.textContent = `${onboardingStep + 1} / ${ONBOARDING_STEPS.length}`;
  onboardingTitle.textContent = step.title;
  onboardingMessage.textContent = step.message;
  onboardingPrevBtn.disabled = onboardingStep === 0;
  onboardingNextBtn.textContent = onboardingStep === ONBOARDING_STEPS.length - 1 ? '시작하기! 🚀' : '다음';

  // 온보딩 점 표시 업데이트
  const dotsContainer = document.getElementById('onboarding-dots');
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('.onboarding-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === onboardingStep);
    });
  }
}

function closeOnboarding(markDone = true) {
  onboardingModal.classList.add('hidden');
  if (markDone) {
    state.onboardingDone = true;
    saveState(state);
  }
}

function openOnboarding() {
  onboardingStep = 0;
  renderOnboardingStep();
  onboardingModal.classList.remove('hidden');
}

function handleOnboardingNext() {
  if (onboardingStep >= ONBOARDING_STEPS.length - 1) {
    closeOnboarding(true);
    textArea.focus();
    return;
  }
  onboardingStep += 1;
  renderOnboardingStep();
}

function handleOnboardingPrev() {
  if (onboardingStep === 0) return;
  onboardingStep -= 1;
  renderOnboardingStep();
}

function handleOnboardingKeydown(event) {
  if (onboardingModal.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    closeOnboarding(true);
  } else if (event.key === 'ArrowRight') {
    handleOnboardingNext();
  } else if (event.key === 'ArrowLeft') {
    handleOnboardingPrev();
  }
}

function initOnboarding() {
  onboardingNextBtn.addEventListener('click', handleOnboardingNext);
  onboardingPrevBtn.addEventListener('click', handleOnboardingPrev);
  onboardingSkipBtn.addEventListener('click', () => closeOnboarding(true));
  if (helpBtn) {
    helpBtn.addEventListener('click', () => openOnboarding());
  }
  document.addEventListener('keydown', handleOnboardingKeydown);

  if (!state.onboardingDone) {
    openOnboarding();
  }
}

// ─────────────────────────────────────────────
// 초기화
// ─────────────────────────────────────────────
function init() {
  ensureStateShape();
  checkStreak();

  updateStatusBar();
  updateBadgeList();
  updatePortfolio();
  updateDailyPrompt();
  renderRecipeCards();
  initRecipeSelectorToggle();
  updateCustomStylePanel();

  bakeBtn.addEventListener('click', handleBake);
  textArea.addEventListener('input', updateCharCount);
  resetBtn.addEventListener('click', handleReset);
  if (dailyUseBreadBtn) dailyUseBreadBtn.addEventListener('click', handleUseDailyPrompt);

  initTabs();
  initCustomStyle();
  initOnboarding();
  updateCharCount();
}

document.addEventListener('DOMContentLoaded', init);
