/**
 * app.js — 메인 애플리케이션 로직
 * 첨삭 엔진, 게임 시스템, 저장소를 연결하여 UI를 제어합니다.
 */

import { analyzeText } from './checker.js';
import { addExp, calcExpGain, checkBadges, getBreadGrade, expForNextLevel, getDailyPrompt, BADGE_DEFS } from './game.js';
import { loadState, saveState, resetState, todayString } from './storage.js';
import { AUTHORS, getAuthorById } from './authors.js';

// ─────────────────────────────────────────────
// 상태 초기화
// ─────────────────────────────────────────────
let state = loadState();

// 현재 편집 중인 글의 재작성 횟수 (페이지 내 세션)
let currentRevisionCount = 0;
let currentText = '';
let isFirstAnalysis = true;

// ─────────────────────────────────────────────
// DOM 요소
// ─────────────────────────────────────────────
const textArea      = document.getElementById('writing-area');
const bakeBtn       = document.getElementById('bake-btn');
const charCounter   = document.getElementById('char-count');
const feedbackSection = document.getElementById('feedback-section');
const feedbackContent = document.getElementById('feedback-content');
const levelDisplay  = document.getElementById('level-display');
const expBar        = document.getElementById('exp-bar');
const expText       = document.getElementById('exp-text');
const gradeDisplay  = document.getElementById('grade-display');
const badgeList     = document.getElementById('badge-list');
const portfolioList = document.getElementById('portfolio-list');
const dailyPromptEl = document.getElementById('daily-prompt');
const resetBtn      = document.getElementById('reset-btn');
const toastContainer = document.getElementById('toast-container');
const dailyUseBreadBtn = document.getElementById('daily-use-btn');
const recipCardsEl  = document.getElementById('recipe-cards');

// ─────────────────────────────────────────────
// 유틸: 토스트 메시지 표시
// ─────────────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  // 애니메이션 후 제거
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
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
  // 최신 순 정렬
  const sorted = [...state.portfolio].reverse();
  sorted.forEach((item, idx) => {
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
  if (!recipCardsEl) return;
  recipCardsEl.innerHTML = '';

  // '자유롭게' 카드 (선택 안 함)
  const freeCard = createRecipeCard({
    id: 'free',
    name: '✨ 자유롭게',
    mood: '나만의 스타일로 자유롭게!',
  }, state.selectedRecipe === 'free');
  recipCardsEl.appendChild(freeCard);

  // 작가 카드
  AUTHORS.forEach(author => {
    const card = createRecipeCard(author, state.selectedRecipe === author.id);
    recipCardsEl.appendChild(card);
  });
}

function createRecipeCard(author, isSelected) {
  const card = document.createElement('div');
  card.className = `recipe-card${isSelected ? ' selected' : ''}`;
  card.setAttribute('role', 'option');
  card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  card.dataset.id = author.id;

  const nameLine = author.name || author.id;
  const moodLine = author.mood || '';

  card.innerHTML = `
    <span class="recipe-card-name">${escapeHtml(nameLine)}</span>
    <span class="recipe-card-mood">${escapeHtml(moodLine)}</span>
  `;
  card.addEventListener('click', () => handleRecipeSelect(author.id));
  return card;
}

function handleRecipeSelect(recipeId) {
  state.selectedRecipe = recipeId;
  saveState(state);
  renderRecipeCards();
  const author = getAuthorById(recipeId);
  if (author) {
    showToast(`🍽️ "${author.name}" 레시피를 선택했어요!`, 'info');
  } else {
    showToast('✨ 자유롭게 쓰는 모드예요!', 'info');
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
// 연속 출석 체크
// ─────────────────────────────────────────────
function checkStreak() {
  const today = todayString();
  if (state.lastVisitDate === today) return; // 오늘 이미 체크

  // 어제 날짜를 로컬 시간 기준으로 계산 (todayString()과 동일한 방식)
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const y = yDate.getFullYear();
  const m = String(yDate.getMonth() + 1).padStart(2, '0');
  const d = String(yDate.getDate()).padStart(2, '0');
  const yStr = `${y}-${m}-${d}`;

  if (state.lastVisitDate === yStr) {
    state.streakDays += 1;
  } else if (state.lastVisitDate !== null && state.lastVisitDate !== today) {
    state.streakDays = 1; // 연속 끊김
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
  const { issues, stats, score, praise } = result;
  const grade = getBreadGrade(state.level);
  const selectedAuthor = getAuthorById(state.selectedRecipe);

  // 점수 색상
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
    html += `<div class="feedback-no-issues">✨ 지적할 사항이 없어요! 완벽한 빵이에요!</div>`;
  } else {
    html += `<div class="feedback-issues-title">🔍 선생님의 첨삭 의견 (${issues.length}가지)</div>`;
    html += `<ul class="feedback-issues">`;
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
    html += `</ul>`;
    html += `<p class="feedback-encourage">✏️ 고쳐쓰기를 해보세요! 고칠수록 경험치가 더 많이 올라요! 🎮</p>`;
  }

  // 문체 레시피 방향 코멘트
  if (selectedAuthor) {
    const encouragement = selectedAuthor.encouragements[Math.floor(Math.random() * selectedAuthor.encouragements.length)];
    const guideline = selectedAuthor.editingGuidelines[Math.floor(Math.random() * selectedAuthor.editingGuidelines.length)];
    html += `
      <div class="recipe-feedback-section">
        <div class="recipe-feedback-title">🍽️ ${escapeHtml(selectedAuthor.name)} 관점에서 보면…</div>
        <p class="recipe-feedback-encouragement">${escapeHtml(encouragement)}</p>
        <p class="recipe-feedback-guideline">💡 이렇게 다듬어봐요: ${escapeHtml(guideline)}</p>
        <p class="recipe-feedback-mood">${escapeHtml(selectedAuthor.mood)}</p>
      </div>
    `;
  }

  // 진열장 추가 버튼
  html += `
    <div class="feedback-actions">
      <button id="save-to-portfolio-btn" class="btn btn-secondary">🗂️ 진열장에 추가</button>
    </div>
  `;

  feedbackContent.innerHTML = html;
  feedbackSection.classList.remove('hidden');

  // 진열장 추가 버튼 이벤트
  document.getElementById('save-to-portfolio-btn').addEventListener('click', () => {
    saveToPortfolio(result);
  });
}

// ─────────────────────────────────────────────
// 진열장에 저장
// ─────────────────────────────────────────────
function saveToPortfolio(result) {
  const grade = getBreadGrade(state.level);
  const selectedAuthor = getAuthorById(state.selectedRecipe);
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
  // 배지 재확인
  const newBadges = checkBadges(state, { score: result.score, charCount: result.stats.charCount, revisionCount: currentRevisionCount, selectedRecipe: state.selectedRecipe });
  newBadges.forEach(b => showToast(`🏅 배지 획득: ${b.name}`, 'badge'));
  updateBadgeList();
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

  // 재작성 여부 판단
  if (!isFirstAnalysis && text === currentText) {
    showToast('글을 고쳐서 다시 구워봐요! ✏️', 'info');
    return;
  }
  if (!isFirstAnalysis && text !== currentText) {
    currentRevisionCount += 1;
  }
  currentText = text;
  isFirstAnalysis = false;

  // 첨삭 분석
  const result = analyzeText(text, currentRevisionCount);

  // 연속 출석 체크
  checkStreak();

  // 문체 레시피 사용 횟수 업데이트
  if (state.selectedRecipe && state.selectedRecipe !== 'free') {
    state.recipeUsage = state.recipeUsage || {};
    state.recipeUsage[state.selectedRecipe] = (state.recipeUsage[state.selectedRecipe] || 0) + 1;
  }

  // EXP 계산 및 적용
  const expGain = calcExpGain({
    score: result.score,
    stats: result.stats,
    revisionCount: currentRevisionCount,
  });
  const levelUps = addExp(state, expGain);

  // 통계 업데이트
  state.totalWritings += 1;
  if (currentRevisionCount > 0) state.totalRevisions += 1;

  // 오늘의 빵 완료 체크
  const today = todayString();
  if (state.lastDailyDate !== today) {
    state.lastDailyDate = today;
  }

  // 배지 체크
  const newBadges = checkBadges(state, {
    score: result.score,
    charCount: result.stats.charCount,
    revisionCount: currentRevisionCount,
    selectedRecipe: state.selectedRecipe,
  });

  // 저장
  saveState(state);

  // UI 갱신
  renderFeedback(result);
  updateStatusBar();
  updateBadgeList();

  // 알림
  showToast(`+${expGain} EXP 획득! 🍞`, 'exp');
  if (levelUps > 0) {
    const grade = getBreadGrade(state.level);
    showToast(`🎉 레벨 업! 레벨 ${state.level} 달성! ${grade.emoji} ${grade.name}`, 'levelup');
  }
  newBadges.forEach(b => {
    showToast(`🏅 새 배지 획득: ${b.name}`, 'badge');
  });

  // 빵 굽기 버튼 텍스트 변경
  bakeBtn.textContent = '🔥 다시 굽기 (고쳐쓰기)';

  // 피드백 섹션으로 스크롤
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
  showToast('🌾 초기화됐어요. 새 반죽으로 시작해봐요!', 'info');
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
  // 커서를 맨 끝으로
  textArea.setSelectionRange(textArea.value.length, textArea.value.length);
  updateCharCount();
  // 상태 초기화
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
// 초기화
// ─────────────────────────────────────────────
function init() {
  // 연속 출석 체크
  checkStreak();

  // UI 초기 렌더링
  updateStatusBar();
  updateBadgeList();
  updatePortfolio();
  updateDailyPrompt();
  renderRecipeCards();

  // 이벤트 바인딩
  bakeBtn.addEventListener('click', handleBake);
  textArea.addEventListener('input', updateCharCount);
  resetBtn.addEventListener('click', handleReset);
  if (dailyUseBreadBtn) {
    dailyUseBreadBtn.addEventListener('click', handleUseDailyPrompt);
  }

  // 탭 초기화
  initTabs();

  // 초기 글자 수 표시
  updateCharCount();
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', init);
