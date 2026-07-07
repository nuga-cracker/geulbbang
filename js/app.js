/**
 * app.js — 메인 애플리케이션 로직
 * 첨삭 엔진, 게임 시스템, 저장소를 연결하여 UI를 제어합니다.
 */

import { analyzeText, analyzeStyleFingerprint } from './checker.js';
import { addExp, calcExpGain, checkBadges, getBreadGrade, expForNextLevel, getDailyPrompt, BADGE_DEFS } from './game.js';
import { loadState, saveState, resetState, todayString } from './storage.js';
import { CUSTOM_STYLE_ID, buildCustomStylePreview, getAllAuthors, getAuthorById, normalizeCustomStyle } from './authors.js';

// ─────────────────────────────────────────────
// 상태 초기화
// ─────────────────────────────────────────────
let state = loadState();

// 현재 편집 중인 글의 재작성 횟수 (페이지 내 세션)
let currentRevisionCount = 0;
let currentText = '';
let isFirstAnalysis = true;
let onboardingStepIndex = 0;

const ONBOARDING_STEPS = [
  {
    title: '🌾 글빵에 온 걸 환영해요!',
    text: '여기는 글을 빵처럼 굽는 제빵소예요. 투박한 글도 여러 번 고치면 맛있는 빵이 된답니다!'
  },
  {
    title: '✍️ 먼저 아무 글이나 써봐요',
    text: '일기, 이야기, 편지 뭐든 좋아요. 짧아도 괜찮아요. 반죽은 작아도 빵이 될 수 있어요!'
  },
  {
    title: '🔥 빵 굽기 버튼을 눌러요',
    text: '다 썼다면 “빵 굽기”를 눌러보세요. 다정한 선생님이 칭찬과 함께 고칠 힌트를 알려줘요.'
  },
  {
    title: '🔁 고쳐 쓸수록 더 맛있어져요',
    text: '피드백을 보고 다시 쓰면 경험치가 쑥쑥 올라요! 반죽에서 식빵, 크루아상, 바게트로 자라나요.'
  },
  {
    title: '🎨 나만의 문체도 만들 수 있어요',
    text: '설문, 내 글 분석, 슬라이더를 섞어서 나만의 시그니처 빵을 만들 수 있어요. 자, 첫 빵을 구워볼까요? 🚀'
  },
];

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
const helpBtn = document.getElementById('help-btn');

const signatureMoodSelect = document.getElementById('signature-mood');
const signatureSentenceSelect = document.getElementById('signature-sentence');
const signatureSpeechSelect = document.getElementById('signature-speech');
const signatureKeywordsInput = document.getElementById('signature-keywords');
const signatureSurveySaveBtn = document.getElementById('signature-survey-save-btn');
const signatureAnalyzeBtn = document.getElementById('signature-analyze-btn');
const signatureApplyBtn = document.getElementById('signature-apply-btn');
const signatureSaveBtn = document.getElementById('signature-save-btn');
const signaturePreviewEl = document.getElementById('signature-preview');
const signatureSummaryEl = document.getElementById('signature-summary');
const signatureAnalysisEl = document.getElementById('signature-analysis');

const sliderInputs = {
  sentenceLength: document.getElementById('signature-slider-sentence-length'),
  vividness: document.getElementById('signature-slider-vividness'),
  energy: document.getElementById('signature-slider-energy'),
  humor: document.getElementById('signature-slider-humor'),
};

const sliderValueEls = {
  sentenceLength: document.getElementById('signature-slider-sentence-length-value'),
  vividness: document.getElementById('signature-slider-vividness-value'),
  energy: document.getElementById('signature-slider-energy-value'),
  humor: document.getElementById('signature-slider-humor-value'),
};

const onboardingOverlay = document.getElementById('onboarding-overlay');
const onboardingDialog = document.getElementById('onboarding-dialog');
const onboardingStepEl = document.getElementById('onboarding-step');
const onboardingTitleEl = document.getElementById('onboarding-title');
const onboardingTextEl = document.getElementById('onboarding-text');
const onboardingPrevBtn = document.getElementById('onboarding-prev-btn');
const onboardingNextBtn = document.getElementById('onboarding-next-btn');
const onboardingSkipBtn = document.getElementById('onboarding-skip-btn');

// ─────────────────────────────────────────────
// 유틸: 토스트 메시지 표시
// ─────────────────────────────────────────────
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

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function announceBadges(newBadges = []) {
  newBadges.forEach(badge => {
    showToast(`🏅 새 배지 획득: ${badge.name}`, 'badge');
  });
}

function updateBadges(extra = {}, shouldAnnounce = true) {
  const newBadges = checkBadges(state, extra);
  if (newBadges.length > 0) {
    updateBadgeList();
    if (shouldAnnounce) announceBadges(newBadges);
  }
  return newBadges;
}

function normalizeSignatureState() {
  state.customStyle = normalizeCustomStyle(state.customStyle);
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
  sorted.forEach(item => {
    const el = document.createElement('div');
    el.className = 'portfolio-item';
    const recipeLabel = item.recipeName ? `<span class="portfolio-recipe">${escapeHtml(item.recipeName)}</span>` : '';
    el.innerHTML = `
      <div class="portfolio-header">
        <span class="portfolio-grade">${item.gradeEmoji} ${item.gradeName}</span>
        <span class="portfolio-score">맛있음 ${item.score}점</span>
        ${recipeLabel}
        <span class="portfolio-date">${item.date}</span>
      </div>
      <p class="portfolio-text">${escapeHtml(item.text.slice(0, 100))}${item.text.length > 100 ? '...' : ''}</p>
      <div class="portfolio-meta">수정 횟수: ${item.revisionCount}회 | 글자 수: ${item.charCount}자</div>
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

  getAllAuthors(state.customStyle).forEach(author => {
    const card = createRecipeCard(author, state.selectedRecipe === author.id);
    recipeCardsEl.appendChild(card);
  });
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
  const author = getAuthorById(recipeId, state.customStyle);
  if (author) {
    showToast(`🍽️ "${author.name}" 레시피를 선택했어요!`, 'info');
  } else {
    showToast('✨ 자유롭게 쓰는 모드예요!', 'info');
  }
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
// 나만의 시그니처 빵
// ─────────────────────────────────────────────
function fillSignatureFormFromState() {
  normalizeSignatureState();
  if (signatureMoodSelect) signatureMoodSelect.value = state.customStyle.survey.mood;
  if (signatureSentenceSelect) signatureSentenceSelect.value = state.customStyle.survey.sentence;
  if (signatureSpeechSelect) signatureSpeechSelect.value = state.customStyle.survey.speech;
  if (signatureKeywordsInput) signatureKeywordsInput.value = state.customStyle.survey.keywords;

  Object.entries(sliderInputs).forEach(([key, input]) => {
    if (!input) return;
    input.value = state.customStyle.sliders[key];
  });
}

function readSignatureSurveyFromForm() {
  return {
    mood: signatureMoodSelect?.value || 'warm',
    sentence: signatureSentenceSelect?.value || 'short',
    speech: signatureSpeechSelect?.value || 'diary',
    keywords: signatureKeywordsInput?.value.trim() || '',
  };
}

function readSignatureSlidersFromForm() {
  return {
    sentenceLength: Number(sliderInputs.sentenceLength?.value || 45),
    vividness: Number(sliderInputs.vividness?.value || 50),
    energy: Number(sliderInputs.energy?.value || 50),
    humor: Number(sliderInputs.humor?.value || 35),
  };
}

function getStyleAnalysisTexts() {
  const texts = [
    ...(Array.isArray(state.bakeHistory) ? state.bakeHistory : []),
    ...state.portfolio.map(item => item.text),
  ];

  const currentDraft = textArea.value.trim();
  if (currentDraft.length >= 20) texts.push(currentDraft);

  return [...new Set(texts.map(text => text.trim()).filter(Boolean))].slice(-25);
}

function renderSignaturePreview() {
  const sliderLabels = {
    sentenceLength: state.customStyle.sliders.sentenceLength < 35 ? '짧게' : state.customStyle.sliders.sentenceLength > 65 ? '길게' : '적당히',
    vividness: state.customStyle.sliders.vividness < 35 ? '담백하게' : state.customStyle.sliders.vividness > 65 ? '화사하게' : '은은하게',
    energy: state.customStyle.sliders.energy < 35 ? '차분하게' : state.customStyle.sliders.energy > 65 ? '활발하게' : '부드럽게',
    humor: state.customStyle.sliders.humor < 35 ? '진지하게' : state.customStyle.sliders.humor > 65 ? '유쾌하게' : '살짝 미소 짓게',
  };

  Object.entries(sliderValueEls).forEach(([key, el]) => {
    if (!el) return;
    el.textContent = sliderLabels[key];
  });

  const preview = buildCustomStylePreview(state.customStyle);
  signaturePreviewEl.innerHTML = `
    <p class="signature-preview-label">미리보기 한입</p>
    <p class="signature-preview-sentence">“${escapeHtml(preview.sentence)}”</p>
    <p class="signature-preview-desc">${escapeHtml(preview.description)}</p>
  `;
}

function renderSignatureAnalysis() {
  const analysis = state.customStyle.analysis;
  if (!analysis || analysis.sampleCount === 0) {
    signatureAnalysisEl.innerHTML = `
      <p class="signature-empty">아직 분석할 글이 없어요. 먼저 글을 한 편 굽거나, 아래 버튼으로 다시 살펴봐요! 🍞</p>
    `;
    if (signatureApplyBtn) {
      signatureApplyBtn.textContent = '🧺 분석 반영하기';
      signatureApplyBtn.disabled = true;
    }
    return;
  }

  const topWords = analysis.frequentWords.length > 0
    ? analysis.frequentWords.map(item => `${escapeHtml(item.word)}(${item.count})`).join(', ')
    : '아직 두드러진 단어는 적어요.';

  signatureAnalysisEl.innerHTML = `
    <p class="signature-analysis-summary">${escapeHtml(analysis.summary)}</p>
    <ul class="signature-analysis-list">
      <li>📏 평균 문장 길이: <strong>${analysis.averageSentenceLength}자</strong> (${escapeHtml(analysis.sentenceFlavor)})</li>
      <li>🧂 자주 쓰는 단어: <strong>${topWords}</strong></li>
      <li>❔ 문장 끝 습관: <strong>${escapeHtml(analysis.punctuationTrend)}</strong></li>
      <li>🗣️ 말투 경향: <strong>${escapeHtml(analysis.speechTrend)}</strong></li>
    </ul>
  `;

  if (signatureApplyBtn) {
    signatureApplyBtn.disabled = false;
    signatureApplyBtn.textContent = state.customStyle.useAnalysis ? '🧺 분석 잠깐 쉬기' : '🧺 분석 반영하기';
  }
}

function renderSignatureSummary() {
  const profile = state.customStyle.profile;
  const keywordList = state.customStyle.survey.keywords
    .split(',')
    .map(word => word.trim())
    .filter(Boolean);
  const selectedLabel = state.selectedRecipe === CUSTOM_STYLE_ID ? '지금 이 레시피로 굽는 중이에요! 🍞' : '저장하면 레시피 카드에서 바로 선택할 수 있어요.';

  signatureSummaryEl.innerHTML = `
    <div class="signature-summary-header">
      <span class="signature-summary-title">🏆 현재 시그니처 빵</span>
      <span class="signature-summary-pill">${state.customStyle.created ? '완성 저장됨' : '아직 다듬는 중'}</span>
    </div>
    <p class="signature-summary-mood">${escapeHtml(profile.mood)}</p>
    <ul class="signature-summary-list">
      <li>👀 시점: <strong>${escapeHtml(profile.styleFeatures.viewpoint)}</strong></li>
      <li>🎙️ 말투: <strong>${escapeHtml(profile.styleFeatures.tone)}</strong></li>
      <li>🧵 문장: <strong>${escapeHtml(profile.styleFeatures.sentence)}</strong></li>
      <li>🧂 단어: <strong>${keywordList.length > 0 ? escapeHtml(keywordList.join(', ')) : '아직 고른 단어가 없어요.'}</strong></li>
      <li>🔎 분석 반영: <strong>${state.customStyle.useAnalysis ? '내 글 지문을 섞고 있어요.' : '설문과 슬라이더를 중심으로 굽는 중이에요.'}</strong></li>
    </ul>
    <p class="signature-summary-example">예시 문장: “${escapeHtml(profile.exampleSentences[0] || '')}”</p>
    <p class="signature-summary-note">${escapeHtml(selectedLabel)}</p>
  `;
}

function renderSignatureSection() {
  normalizeSignatureState();
  renderSignaturePreview();
  renderSignatureAnalysis();
  renderSignatureSummary();
}

function refreshSignatureAnalysis({ announce = false } = {}) {
  const texts = getStyleAnalysisTexts();
  if (texts.length === 0) {
    state.customStyle.analysis = normalizeCustomStyle({}).analysis;
    normalizeSignatureState();
    renderSignatureAnalysis();
    return false;
  }

  state.customStyle.analysis = analyzeStyleFingerprint(texts);
  normalizeSignatureState();
  if (announce) {
    showToast('🔎 지금까지 쓴 글에서 문체 지문을 다시 읽어봤어요!', 'info');
  }
  updateBadges({}, announce);
  renderSignatureAnalysis();
  renderSignatureSummary();
  renderRecipeCards();
  return true;
}

function handleSignatureSurveySave() {
  state.customStyle.survey = readSignatureSurveyFromForm();
  normalizeSignatureState();
  saveState(state);
  renderSignatureSection();
  renderRecipeCards();
  showToast('📋 설문으로 시그니처 빵 반죽을 만들었어요!', 'success');
}

function handleSignatureSliderInput() {
  state.customStyle.sliders = readSignatureSlidersFromForm();
  state.customStyle.sliderMoves = (state.customStyle.sliderMoves || 0) + 1;
  normalizeSignatureState();
  renderSignatureSection();
  renderRecipeCards();
  updateBadges({}, true);
  saveState(state);
}

function handleSignatureAnalyze() {
  const refreshed = refreshSignatureAnalysis({ announce: true });
  if (!refreshed) {
    showToast('먼저 글을 한 편 구우면 문체 지문을 읽어줄 수 있어요! ✍️', 'warning');
    return;
  }
  saveState(state);
}

function handleSignatureApply() {
  if (!state.customStyle.analysis || state.customStyle.analysis.sampleCount === 0) {
    showToast('먼저 내 글 분석을 해볼까요? 🔎', 'warning');
    return;
  }

  state.customStyle.useAnalysis = !state.customStyle.useAnalysis;
  normalizeSignatureState();
  saveState(state);
  renderSignatureSection();
  renderRecipeCards();
  showToast(
    state.customStyle.useAnalysis
      ? '🧺 내 글 지문을 시그니처 빵에 섞었어요!'
      : '🧺 분석 지문은 잠깐 쉬고, 직접 고른 취향만 남겨뒀어요!',
    'info'
  );
}

function handleSignatureSave() {
  state.customStyle.survey = readSignatureSurveyFromForm();
  state.customStyle.sliders = readSignatureSlidersFromForm();
  state.customStyle.created = true;
  state.customStyle.updatedAt = todayString();
  normalizeSignatureState();
  state.selectedRecipe = CUSTOM_STYLE_ID;
  updateBadges({}, true);
  saveState(state);
  renderSignatureSection();
  renderRecipeCards();
  showToast('🏆 나만의 시그니처 빵을 저장하고 바로 선택했어요!', 'success');
}

function recordBakeHistory(text) {
  if (!text) return;
  state.bakeHistory = Array.isArray(state.bakeHistory) ? state.bakeHistory : [];
  if (state.bakeHistory[state.bakeHistory.length - 1] !== text) {
    state.bakeHistory.push(text);
  }
  if (state.bakeHistory.length > 25) {
    state.bakeHistory = state.bakeHistory.slice(-25);
  }
}

// ─────────────────────────────────────────────
// 피드백 렌더링
// ─────────────────────────────────────────────
function renderFeedback(result) {
  const { issues, stats, score, praise } = result;
  const selectedAuthor = getAuthorById(state.selectedRecipe, state.customStyle);
  const scoreColor = score >= 80 ? '#27ae60' : score >= 60 ? '#f39c12' : '#e74c3c';

  let html = `
    <div class="feedback-praise">
      <span class="feedback-baker-icon">👨‍🍳</span>
      <p>${escapeHtml(praise)}</p>
    </div>
    <div class="feedback-score" style="color:${scoreColor}">
      맛있음 점수: <strong>${score}점</strong>
    </div>
    <div class="feedback-stats">
      📊 글자 수: <strong>${stats.charCount}</strong>자 &nbsp;|&nbsp;
      단어 수: <strong>${stats.wordCount}</strong>개 &nbsp;|&nbsp;
      문장 수: <strong>${stats.sentenceCount}</strong>개
    </div>
  `;

  if (issues.length === 0) {
    html += '<div class="feedback-no-issues">✨ 지적할 사항이 없어요! 완벽한 빵이에요!</div>';
  } else {
    html += `<div class="feedback-issues-title">🔍 선생님의 첨삭 의견 (${issues.length}가지)</div>`;
    html += '<ul class="feedback-issues">';
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
    html += '</ul>';
    html += '<p class="feedback-encourage">✏️ 고쳐쓰기를 해보세요! 고칠수록 경험치가 더 많이 올라요! 🎮</p>';
  }

  if (selectedAuthor) {
    const encouragements = selectedAuthor.encouragements || [];
    const guidelines = selectedAuthor.editingGuidelines || [];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)] || '네 글의 결을 살려서 다듬어봐요!';
    const guideline = guidelines[Math.floor(Math.random() * guidelines.length)] || '한 줄씩 호흡을 맞추며 다듬어봐요.';
    html += `
      <div class="recipe-feedback-section">
        <div class="recipe-feedback-title">🍽️ ${escapeHtml(selectedAuthor.name)} 관점에서 보면…</div>
        <p class="recipe-feedback-encouragement">${escapeHtml(encouragement)}</p>
        <p class="recipe-feedback-guideline">💡 이렇게 다듬어봐요: ${escapeHtml(guideline)}</p>
        <p class="recipe-feedback-mood">${escapeHtml(selectedAuthor.mood)}</p>
      </div>
    `;
  }

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
}

// ─────────────────────────────────────────────
// 진열장에 저장
// ─────────────────────────────────────────────
function saveToPortfolio(result) {
  const grade = getBreadGrade(state.level);
  const selectedAuthor = getAuthorById(state.selectedRecipe, state.customStyle);
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
    recipeName: selectedAuthor ? selectedAuthor.name : '✨ 자유롭게',
  };
  state.portfolio.push(item);
  saveState(state);
  updatePortfolio();
  showToast('🗂️ 진열장에 추가됐어요!', 'success');
  updateBadges({
    score: result.score,
    charCount: result.stats.charCount,
    revisionCount: currentRevisionCount,
    selectedRecipe: state.selectedRecipe,
  }, true);
  saveState(state);
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
  recordBakeHistory(text);
  refreshSignatureAnalysis({ announce: false });

  checkStreak();

  if (state.selectedRecipe && state.selectedRecipe !== 'free') {
    state.recipeUsage = state.recipeUsage || {};
    state.recipeUsage[state.selectedRecipe] = (state.recipeUsage[state.selectedRecipe] || 0) + 1;
  }

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

  const newBadges = updateBadges({
    score: result.score,
    charCount: result.stats.charCount,
    revisionCount: currentRevisionCount,
    selectedRecipe: state.selectedRecipe,
  }, false);

  saveState(state);

  renderFeedback(result);
  renderSignatureSection();
  updateStatusBar();
  updateBadgeList();

  showToast(`+${expGain} EXP 획득! 🍞`, 'exp');
  if (levelUps > 0) {
    const grade = getBreadGrade(state.level);
    showToast(`🎉 레벨 업! 레벨 ${state.level} 달성! ${grade.emoji} ${grade.name}`, 'levelup');
  }
  announceBadges(newBadges);

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
  if (!confirm('⚠️ 모든 진행 상황(레벨, 경험치, 배지, 진열장, 나만의 문체, 온보딩 기록)이 초기화됩니다. 정말 초기화하시겠어요?')) return;
  state = resetState();
  currentRevisionCount = 0;
  currentText = '';
  isFirstAnalysis = true;
  textArea.value = '';
  feedbackSection.classList.add('hidden');
  bakeBtn.textContent = '🔥 빵 굽기 (첨삭받기)';
  fillSignatureFormFromState();
  renderSignatureSection();
  updateStatusBar();
  updateBadgeList();
  updatePortfolio();
  updateCharCount();
  renderRecipeCards();
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
// 온보딩
// ─────────────────────────────────────────────
function renderOnboardingStep() {
  const step = ONBOARDING_STEPS[onboardingStepIndex];
  if (!step) return;

  onboardingStepEl.textContent = `${onboardingStepIndex + 1} / ${ONBOARDING_STEPS.length}`;
  onboardingTitleEl.textContent = step.title;
  onboardingTextEl.textContent = step.text;
  onboardingPrevBtn.disabled = onboardingStepIndex === 0;
  onboardingNextBtn.textContent = onboardingStepIndex === ONBOARDING_STEPS.length - 1 ? '시작하기' : '다음';
}

function openOnboarding() {
  onboardingStepIndex = 0;
  renderOnboardingStep();
  onboardingOverlay.classList.remove('hidden');
  onboardingDialog.focus();
}

function closeOnboarding() {
  onboardingOverlay.classList.add('hidden');
  state.onboardingDone = true;
  saveState(state);
}

function handleOnboardingPrev() {
  if (onboardingStepIndex === 0) return;
  onboardingStepIndex -= 1;
  renderOnboardingStep();
}

function handleOnboardingNext() {
  if (onboardingStepIndex >= ONBOARDING_STEPS.length - 1) {
    closeOnboarding();
    return;
  }
  onboardingStepIndex += 1;
  renderOnboardingStep();
}

function handleOnboardingKeydown(event) {
  if (onboardingOverlay.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    closeOnboarding();
  } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
    handleOnboardingNext();
  } else if (event.key === 'ArrowLeft') {
    handleOnboardingPrev();
  }
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

function bindSignatureEvents() {
  signatureSurveySaveBtn?.addEventListener('click', handleSignatureSurveySave);
  signatureAnalyzeBtn?.addEventListener('click', handleSignatureAnalyze);
  signatureApplyBtn?.addEventListener('click', handleSignatureApply);
  signatureSaveBtn?.addEventListener('click', handleSignatureSave);
  Object.values(sliderInputs).forEach(input => {
    input?.addEventListener('input', handleSignatureSliderInput);
  });
}

function bindOnboardingEvents() {
  helpBtn?.addEventListener('click', openOnboarding);
  onboardingPrevBtn?.addEventListener('click', handleOnboardingPrev);
  onboardingNextBtn?.addEventListener('click', handleOnboardingNext);
  onboardingSkipBtn?.addEventListener('click', closeOnboarding);
  onboardingOverlay?.addEventListener('click', event => {
    if (event.target === onboardingOverlay) closeOnboarding();
  });
  document.addEventListener('keydown', handleOnboardingKeydown);
}

// ─────────────────────────────────────────────
// 초기화
// ─────────────────────────────────────────────
function init() {
  normalizeSignatureState();
  checkStreak();
  refreshSignatureAnalysis({ announce: false });

  updateStatusBar();
  updateBadgeList();
  updatePortfolio();
  updateDailyPrompt();
  renderRecipeCards();
  fillSignatureFormFromState();
  renderSignatureSection();

  bakeBtn.addEventListener('click', handleBake);
  textArea.addEventListener('input', updateCharCount);
  resetBtn.addEventListener('click', handleReset);
  if (dailyUseBreadBtn) {
    dailyUseBreadBtn.addEventListener('click', handleUseDailyPrompt);
  }

  bindSignatureEvents();
  bindOnboardingEvents();
  initTabs();
  updateCharCount();

  if (!state.onboardingDone) {
    openOnboarding();
  }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', init);
