/**
 * checker.js — 규칙 기반 한국어 글쓰기 첨삭 엔진
 * 외부 API 없이 브라우저에서만 동작합니다.
 * 규칙은 배열/객체로 정의되어 있어 쉽게 추가·수정할 수 있습니다.
 *
 * AI 연동 확장 포인트: analyzeText() 함수를 교체하거나 래핑하면
 * 나중에 OpenAI 등 AI API와 연결할 수 있습니다.
 */

// ─────────────────────────────────────────────
// 1. 군더더기 표현 사전
//    { pattern: RegExp, message: string, why: string }
// ─────────────────────────────────────────────
const FILLER_WORDS = [
  {
    pattern: /그리고/g,
    word: '그리고',
    message: '"그리고"가 여러 번 보여요. 문장을 이어쓸 때 "그리고" 대신 쉼표(,)나 다른 접속어로 바꿔 보면 더 매끄러워져요!',
    why: '같은 접속어를 반복하면 글이 단조로워 보여요.',
  },
  {
    pattern: /그래서/g,
    word: '그래서',
    message: '"그래서"가 많이 쓰였어요. "따라서", "그러니", "결국" 등으로 바꿔 써보면 더 맛있는 글이 돼요! 🍞',
    why: '다양한 접속어를 쓰면 글이 풍성해져요.',
  },
  {
    pattern: /정말\s*/g,
    word: '정말',
    message: '"정말"이 많이 나왔어요. 꼭 필요한 곳에만 쓰면 더 강조되는 느낌이 나요. 없애도 되는 자리가 있는지 살펴봐요!',
    why: '"정말"을 너무 자주 쓰면 오히려 강조 효과가 줄어들어요.',
  },
  {
    pattern: /너무\s*/g,
    word: '너무',
    message: '"너무"가 여러 번 보여요. "매우", "아주", "몹시", "굉장히" 등 다양한 표현으로 바꿔 보는 건 어떨까요?',
    why: '같은 강조 부사를 반복하면 표현이 식상해져요.',
  },
  {
    pattern: /매우\s*/g,
    word: '매우',
    message: '"매우"가 반복되고 있어요. 꼭 필요한 곳에만 써주거나 더 구체적인 표현으로 바꿔 보면 어때요?',
    why: '강조어를 아끼면 쓸 때 더 힘이 실려요.',
  },
  {
    pattern: /진짜\s*/g,
    word: '진짜',
    message: '"진짜"가 자주 보여요. 구어체 느낌이 강해지니, 좀 더 다듬어진 표현을 써보면 글이 쫄깃해져요! 🥐',
    why: '글에서는 구어체 강조어를 줄이면 더 세련된 느낌을 줄 수 있어요.',
  },
  {
    pattern: /것\s*같다|것\s*같아요|것\s*같습니다|것\s*같아/g,
    word: '~것 같다',
    message: '"~것 같다/같아요"가 많이 보여요. 확실한 내용은 "~이다", "~했다"처럼 자신 있게 써봐요! 제빵사처럼 당당하게요 🍰',
    why: '"~것 같다"를 남발하면 글쓴이의 자신감이 없어 보일 수 있어요.',
  },
  {
    pattern: /사실\s*/g,
    word: '사실',
    message: '"사실"이라는 표현이 자주 나왔어요. 정말 강조해야 할 때만 쓰면 훨씬 효과적이에요!',
    why: '문장을 시작할 때 "사실"을 반복하면 군더더기가 될 수 있어요.',
  },
  {
    pattern: /뭔가\s*/g,
    word: '뭔가',
    message: '"뭔가"가 보여요. 구체적으로 어떤 것인지 표현해 주면 더 맛있는 글이 돼요! 🥖',
    why: '막연한 표현 대신 구체적인 단어를 쓰면 글의 품질이 올라가요.',
  },
];

// ─────────────────────────────────────────────
// 2. 피동 표현 패턴
// ─────────────────────────────────────────────
const PASSIVE_PATTERNS = [
  { pattern: /되어\s*지|돼\s*지/g, label: '이중 피동(돼지)' },
  { pattern: /아지다|어지다|해지다/g, label: '피동 남용' },
];

// ─────────────────────────────────────────────
// 3. 이중 부정 패턴
// ─────────────────────────────────────────────
const DOUBLE_NEGATIVE_PATTERNS = [
  { pattern: /없지\s*않|아니지\s*않|못하지\s*않/g, label: '이중 부정' },
  { pattern: /안\s*하지\s*않|안\s*되지\s*않/g, label: '이중 부정' },
];

const COMMON_WORDS_TO_IGNORE = new Set([
  '이다', '있다', '하다', '되다', '같다', '않다', '없다', '이고', '이나', '이며',
  '그리고', '그래서', '하지만', '그런데', '그러나', '또한', '또는', '그것', '이것',
  '저것', '우리', '나는', '내가', '저는', '제가', '에서', '에게', '으로', '까지',
  '부터', '이랑', '하고', '오늘', '어제', '그냥', '정말', '너무', '진짜', '조금',
  '많이', '아주', '매우', '같은', '한번', '이번', '요즘', '때문에', '그래도',
  '있어요', '했어요', '합니다', '합니다', '했다', '한다',
]);

const INFORMAL_ENDING_PATTERN = /(?:했다|한다|해|하네|더라|하자|가자|보자|하지|좋아|좋네|이다|갔다|왔다|봤다|먹었다|썼다|있다|없다|좋다|싫다)(?:[.!?\s]|$)/g;

// ─────────────────────────────────────────────
// 유틸: 문장 분리
// ─────────────────────────────────────────────
function splitSentences(text) {
  // 마침표, 느낌표, 물음표, 줄바꿈으로 문장을 나눔
  return text
    .split(/(?<=[.!?])\s+|(?<=\n)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─────────────────────────────────────────────
// 유틸: 단어 토큰화(간단)
// ─────────────────────────────────────────────
function tokenizeWords(text) {
  return text
    .replace(/[.,!?;:'"()\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// ─────────────────────────────────────────────
// 규칙 검사 함수들
// ─────────────────────────────────────────────

/** 긴 문장 감지 (60자 이상) */
function checkLongSentences(sentences) {
  const issues = [];
  const LONG_THRESHOLD = 60;
  sentences.forEach((sent, i) => {
    if (sent.length >= LONG_THRESHOLD) {
      issues.push({
        type: 'long_sentence',
        severity: sent.length >= 100 ? 'high' : 'medium',
        sentence: sent,
        index: i,
        message: `문장 ${i + 1}번이 ${sent.length}자로 꽤 길어요! 쉼표를 추가하거나 두 문장으로 나눠 보면 더 읽기 좋아져요. 긴 빵은 먹기 불편하잖아요? 🥖`,
        why: '문장이 너무 길면 읽는 사람이 한 번에 이해하기 힘들어요.',
      });
    }
  });
  return issues;
}

/** 중복 단어 감지 */
function checkDuplicateWords(text, sentences) {
  const issues = [];
  // 전체 텍스트에서 단어 빈도 계산
  const words = tokenizeWords(text);
  const freq = {};
  words.forEach(w => {
    if (w.length < 2) return; // 1글자 단어 제외
    freq[w] = (freq[w] || 0) + 1;
  });

  // 빈도 높은 단어(3회 이상, 단 조사·접속어 제외)
  Object.entries(freq).forEach(([word, count]) => {
    if (count >= 3 && !COMMON_WORDS_TO_IGNORE.has(word)) {
      issues.push({
        type: 'duplicate_word',
        severity: count >= 5 ? 'high' : 'medium',
        word,
        count,
        message: `"${word}"라는 단어가 ${count}번이나 나왔어요! 다양한 단어로 바꿔 쓰면 글이 훨씬 풍성해져요. 반죽에 재료를 다양하게 넣어봐요! 🌾`,
        why: '같은 단어가 반복되면 글이 단조로워 보여요.',
      });
    }
  });
  return issues;
}

/** 군더더기 표현 감지 */
function checkFillerWords(text) {
  const issues = [];
  FILLER_WORDS.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches && matches.length >= 2) {
      issues.push({
        type: 'filler_word',
        severity: matches.length >= 4 ? 'high' : 'medium',
        word: rule.word,
        count: matches.length,
        message: rule.message,
        why: rule.why,
      });
    }
  });
  return issues;
}

/** 피동 표현 감지 */
function checkPassiveVoice(text) {
  const issues = [];
  PASSIVE_PATTERNS.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches && matches.length >= 2) {
      issues.push({
        type: 'passive_voice',
        severity: 'low',
        label: rule.label,
        count: matches.length,
        message: `${rule.label} 표현이 ${matches.length}번 보여요. 능동적인 표현으로 바꾸면 글이 더 힘차고 신선해져요! 갓 구운 빵처럼요 🔥`,
        why: '피동 표현을 너무 많이 쓰면 글이 힘 없어 보일 수 있어요.',
      });
    }
  });
  return issues;
}

/** 이중 부정 감지 */
function checkDoubleNegative(text) {
  const issues = [];
  DOUBLE_NEGATIVE_PATTERNS.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches) {
      issues.push({
        type: 'double_negative',
        severity: 'medium',
        count: matches.length,
        message: '이중 부정 표현이 있어요. "~하지 않지 않다" 대신 "~한다"처럼 간단하게 바꾸면 더 명확하게 전달돼요! ✨',
        why: '이중 부정은 뜻이 헷갈릴 수 있어요. 긍정문으로 바꾸면 훨씬 깔끔해요.',
      });
    }
  });
  return issues;
}

/** 어미 일관성 체크 (존댓말/반말 혼용) */
function checkStyleConsistency(text) {
  const issues = [];
  // 존댓말 어미 (문장 끝 패턴)
  const formalMatches = text.match(/(?:습니다|습니까|어요|아요|네요|겠습니다)[.!?\s]/g) || [];
  // 반말 어미 — 문장 부호 앞에 오는 대표적인 반말 종결어미
  const informalMatches = text.match(/(?:했다|한다|이다|갔다|왔다|봤다|먹었다|썼다|있다|없다|좋다|싫다)[.!?\s]/g) || [];

  // 둘 다 상당수 존재하면 혼용 의심
  if (formalMatches.length >= 3 && informalMatches.length >= 3) {
    issues.push({
      type: 'style_mix',
      severity: 'low',
      message: '존댓말과 반말이 섞여 있는 것 같아요. 글 전체를 한 가지 말투로 통일하면 더 맛있는 빵처럼 깔끔해져요! 🍞',
      why: '말투가 일관되면 읽는 사람이 더 편하게 느껴요.',
    });
  }
  return issues;
}

// ─────────────────────────────────────────────
// 통계 계산
// ─────────────────────────────────────────────
function calcStats(text, sentences) {
  const words = tokenizeWords(text);
  return {
    charCount: text.replace(/\s/g, '').length,   // 공백 제외 글자 수
    wordCount: words.length,
    sentenceCount: sentences.length,
  };
}

// ─────────────────────────────────────────────
// 점수 계산 (0~100 "맛있음 점수")
// ─────────────────────────────────────────────
function calcScore(issues, stats, revisionCount) {
  let score = 100;

  // 지적 사항에 따라 점수 차감
  issues.forEach(issue => {
    if (issue.severity === 'high') score -= 10;
    else if (issue.severity === 'medium') score -= 5;
    else score -= 2;
  });

  // 글이 너무 짧으면 차감
  if (stats.charCount < 50) score -= 20;
  else if (stats.charCount < 100) score -= 10;

  // 재작성 횟수에 따라 보너스
  score += Math.min(revisionCount * 5, 30);

  return Math.max(0, Math.min(100, score));
}

// ─────────────────────────────────────────────
// 칭찬 멘트 생성
// ─────────────────────────────────────────────
function generatePraise(score, stats, issues) {
  const praises = [
    '오, 반죽이 아주 좋아요! 이 기세로 계속 써봐요! 🌾',
    '글에서 빵 냄새가 솔솔 나요! 잘 쓰고 있어요! 🍞',
    '문장들이 잘 어우러지고 있어요. 제빵사 기질이 있는데요? 🥐',
    '오늘 반죽 상태가 정말 좋은걸요! 조금만 더 치대봐요! 🥖',
    '글쓰기에 진심인 게 느껴져요. 대단해요! ✨',
  ];
  const praise = praises[Math.floor(Math.random() * praises.length)];

  if (stats.charCount < 50) {
    return '글이 조금 짧아요! 조금 더 써봐요. 반죽이 많아야 빵도 크게 나온답니다! 🌾';
  }
  if (issues.length === 0) {
    return '와, 완벽해요! 지적할 게 없을 정도예요. 이미 명품 바게트 수준이에요! 🥖✨';
  }
  if (score >= 80) {
    return `${praise} 몇 가지만 고치면 완성이에요!`;
  }
  if (score >= 60) {
    return '좋아요! 조금 더 다듬으면 훨씬 맛있는 빵이 될 것 같아요. 같이 고쳐봐요! 🍞';
  }
  return '반죽 단계예요! 괜찮아요, 처음엔 다 이래요. 하나하나 고쳐나가다 보면 어느새 근사한 빵이 될 거예요! 💪';
}

function describeSentenceFlavor(avgLength) {
  if (avgLength <= 18) return '짧고 경쾌한';
  if (avgLength >= 36) return '길고 흐르는';
  return '고르게 이어지는';
}

function describeSpeechTrend(formalCount, informalCount) {
  if (formalCount >= 2 && formalCount > informalCount * 1.2) {
    return '존댓말을 차근차근 쓰는 편이에요.';
  }
  if (informalCount >= 2 && informalCount > formalCount * 1.2) {
    return '반말로 가깝고 솔직하게 쓰는 편이에요.';
  }
  return '존댓말과 반말이 크게 치우치지 않아요.';
}

function describePunctuationTrend(questionCount, exclamationCount) {
  if (questionCount === 0 && exclamationCount === 0) {
    return '물음표와 느낌표를 아껴 쓰는 차분한 편이에요.';
  }
  if (questionCount > exclamationCount) {
    return '물음표를 더 자주 써서 궁금한 마음을 잘 남겨요.';
  }
  if (exclamationCount > questionCount) {
    return '느낌표를 더 자주 써서 생기 있는 마음이 보여요.';
  }
  return '물음표와 느낌표를 비슷하게 써서 리듬감이 있어요.';
}

/**
 * 사용자가 쓴 여러 글에서 문체 지문을 추출합니다.
 * @param {string[]|string} texts
 * @returns {{
 *   sampleCount: number,
 *   averageSentenceLength: number,
 *   sentenceFlavor: string,
 *   frequentWords: Array<{word: string, count: number}>,
 *   questionCount: number,
 *   exclamationCount: number,
 *   punctuationTrend: string,
 *   speechTrend: string,
 *   summary: string,
 * }}
 */
export function analyzeStyleFingerprint(texts) {
  const samples = (Array.isArray(texts) ? texts : [texts])
    .map(text => (typeof text === 'string' ? text.trim() : ''))
    .filter(Boolean);

  if (samples.length === 0) {
    return {
      sampleCount: 0,
      averageSentenceLength: 0,
      sentenceFlavor: '아직 문장 길이를 재는 중이에요.',
      frequentWords: [],
      questionCount: 0,
      exclamationCount: 0,
      punctuationTrend: '아직 내 글 자국을 모으는 중이에요.',
      speechTrend: '아직 말투를 읽는 중이에요.',
      summary: '아직 내 글을 분석하지 않았어요. 먼저 빵을 한 번 구워볼까요? 🍞',
    };
  }

  const allText = samples.join(' ');
  const sentences = samples.flatMap(splitSentences);
  const cleanSentenceLengths = sentences.map(sentence => sentence.replace(/\s/g, '').length).filter(Boolean);
  const averageSentenceLength = cleanSentenceLengths.length > 0
    ? Math.round(cleanSentenceLengths.reduce((sum, len) => sum + len, 0) / cleanSentenceLengths.length)
    : 0;
  const sentenceFlavor = describeSentenceFlavor(averageSentenceLength);

  const words = tokenizeWords(allText.toLowerCase());
  const freq = {};
  words.forEach(word => {
    const cleanWord = word.trim();
    if (cleanWord.length < 2) return;
    if (COMMON_WORDS_TO_IGNORE.has(cleanWord)) return;
    if (/^\d+$/.test(cleanWord)) return;
    freq[cleanWord] = (freq[cleanWord] || 0) + 1;
  });

  const frequentWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  const questionCount = (allText.match(/\?/g) || []).length;
  const exclamationCount = (allText.match(/!/g) || []).length;
  const formalCount = (allText.match(/(?:습니다|습니까|어요|아요|네요|겠습니다)(?:[.!?\s]|$)/g) || []).length;
  const informalCount = (allText.match(INFORMAL_ENDING_PATTERN) || []).length;
  const punctuationTrend = describePunctuationTrend(questionCount, exclamationCount);
  const speechTrend = describeSpeechTrend(formalCount, informalCount);
  const summary = `당신은 평균 ${averageSentenceLength || 0}자 문장을 쓰네요 (${sentenceFlavor} 느낌!). ${punctuationTrend} ${speechTrend}`;

  return {
    sampleCount: samples.length,
    averageSentenceLength,
    sentenceFlavor,
    frequentWords,
    questionCount,
    exclamationCount,
    punctuationTrend,
    speechTrend,
    summary,
  };
}

// ─────────────────────────────────────────────
// 메인 분석 함수 (공개 API)
// ─────────────────────────────────────────────

/**
 * 입력 텍스트를 분석하여 첨삭 결과를 반환합니다.
 *
 * AI 연동 확장 포인트:
 *   이 함수를 async로 바꾸고, 아래 주석 처리된 AI 스텁 부분을 활성화하면
 *   OpenAI 등 외부 AI API와 연결할 수 있습니다.
 *
 * @param {string} text - 분석할 텍스트
 * @param {number} revisionCount - 이 글의 재작성 횟수 (점수 보정에 사용)
 * @returns {{ issues: Array, stats: Object, score: number, praise: string }}
 */
export function analyzeText(text, revisionCount = 0) {
  // ── AI 연동 스텁 (지금은 비활성) ──────────────────────
  // if (window.AI_MODE && window.OPENAI_API_KEY) {
  //   return analyzeWithAI(text, revisionCount);
  // }
  // ─────────────────────────────────────────────────────

  const sentences = splitSentences(text);
  const allIssues = [
    ...checkLongSentences(sentences),
    ...checkDuplicateWords(text, sentences),
    ...checkFillerWords(text),
    ...checkPassiveVoice(text),
    ...checkDoubleNegative(text),
    ...checkStyleConsistency(text),
  ];

  const stats = calcStats(text, sentences);
  const score = calcScore(allIssues, stats, revisionCount);
  const praise = generatePraise(score, stats, allIssues);

  return { issues: allIssues, stats, score, praise };
}
