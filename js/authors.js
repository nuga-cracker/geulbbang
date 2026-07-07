/**
 * authors.js — 작가 문체 레시피 데이터
 * 6종의 문체 프로필을 JS 모듈에 내장합니다.
 * (file:// 환경에서 fetch로 로컬 JSON을 못 읽는 경우를 고려해 JS 모듈에 데이터를 내장)
 *
 * 저작권 안전 원칙:
 *  - 저작권 만료(퍼블릭 도메인) 작가: 문체 특징 + 아주 짧은 예시 문장(1~2개)만 사용
 *  - 현대 작가: 실명을 표방하지 않으며, 분위기·느낌만 순수 창작으로 추상화
 */

export const CUSTOM_STYLE_ID = 'signature';

export const DEFAULT_CUSTOM_STYLE = {
  survey: {
    mood: 'warm',
    sentence: 'short',
    speech: 'diary',
    keywords: '',
  },
  sliders: {
    sentenceLength: 45,
    vividness: 50,
    energy: 50,
    humor: 35,
  },
  analysis: {
    sampleCount: 0,
    averageSentenceLength: 0,
    sentenceFlavor: '아직 문장 길이를 재는 중이에요.',
    frequentWords: [],
    questionCount: 0,
    exclamationCount: 0,
    punctuationTrend: '아직 내 글 자국을 모으는 중이에요.',
    speechTrend: '아직 말투를 읽는 중이에요.',
    summary: '아직 내 글을 분석하지 않았어요. 먼저 빵을 한 번 구워볼까요? 🍞',
  },
  useAnalysis: false,
  created: false,
  updatedAt: null,
  sliderMoves: 0,
  profile: null,
};

export const AUTHORS = [
  {
    id: 'confession',
    name: '🌫️ 부끄러운 고백빵',
    baseAuthor: '다자이 오사무 참고 (저작권 만료)',
    copyrightStatus: 'public_domain',
    mood: '🌫️ 솔직한 고백 · 나직한 독백 · 쓸쓸하지만 진솔한',
    styleFeatures: {
      viewpoint: '1인칭 고백체 ("저는", "나는"으로 시작)',
      tone: '자조적이고 솔직한 어조, 부끄러움을 숨기지 않는 말투',
      sentence: '나직하고 조용한 독백, 짧고 솔직한 문장들',
      emotion: '쓸쓸함, 솔직함, 담담함 (진솔한 일기 톤)',
      vocabulary: '꾸밈없는 일상 언어, "사실은", "솔직히", "부끄럽게도"',
    },
    editingGuidelines: [
      '1인칭으로 솔직하게 자신의 마음을 고백해 보세요.',
      '꾸미지 말고 있는 그대로의 감정을 써보세요.',
      '짧고 단호한 문장으로 마음을 표현해 보세요.',
      '"사실은..." 또는 "솔직히 말하면..." 으로 시작해 보면 어떨까요?',
    ],
    encouragements: [
      '솔직하게 쓰는 게 가장 용기 있는 글이에요. 이 기세로 계속 써봐요! 🌫️',
      '꾸미지 않은 진심이 담긴 글이에요. 부끄럽지 않아도 돼요! 🍞',
      '이렇게 솔직하게 쓸 수 있다는 게 대단해요. 조금 더 고백해 봐요! 💙',
    ],
    // 퍼블릭 도메인 작가의 아주 짧은 예시 (원문 인용 아닌 참고용)
    exampleSentences: [
      '부끄럼 많은 생애를 보냈습니다. (다자이 오사무, 《인간 실격》 첫 문장)',
    ],
  },
  {
    id: 'jindalrae',
    name: '🌸 노래하는 진달래빵',
    baseAuthor: '김소월 참고 (저작권 만료)',
    copyrightStatus: 'public_domain',
    mood: '🌸 서정적 · 그리움 · 민요처럼 노래하는 리듬감',
    styleFeatures: {
      viewpoint: '1인칭 또는 독백체, 감정에 몰입하는 서정적 시점',
      tone: '그리움과 애틋함, 노래처럼 읽히는 리듬감 있는 어조',
      sentence: '반복과 운율이 있는 문장, 비슷한 구조가 되풀이됨',
      emotion: '그리움, 애틋함, 아련함, 기다림',
      vocabulary: '"아름다운", "사뿐히", "하염없이" 같은 감각적이고 서정적인 어휘',
    },
    editingGuidelines: [
      '감정을 직접 말하기보다 비유나 풍경으로 표현해 보세요.',
      '같은 문장 구조를 반복해 리듬감을 만들어 보세요.',
      '"~고", "~며" 같은 나열형 어미로 시처럼 이어가 보세요.',
      '색깔, 소리, 냄새 같은 감각적인 표현을 넣어봐요.',
    ],
    encouragements: [
      '문장에서 노래 소리가 들려요! 🌸 리듬감이 살아있어요!',
      '그리움이 물씬 풍기는 글이에요. 민요처럼 아름다워요! 🎵',
      '감각적인 표현이 정말 좋아요. 조금 더 운율을 살려봐요! ✨',
    ],
    exampleSentences: [
      '나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리오리다. (김소월, 〈진달래꽃〉)',
    ],
  },
  {
    id: 'sigolle',
    name: '😄 구수한 시골빵',
    baseAuthor: '김유정 참고 (저작권 만료)',
    copyrightStatus: 'public_domain',
    mood: '😄 해학적 · 구수한 · 정겨운 시골 풍경',
    styleFeatures: {
      viewpoint: '관찰자 또는 1인칭, 인물과 상황을 익살스럽게 묘사',
      tone: '능청스럽고 구수한 어조, 해학과 따뜻함이 섞인 말투',
      sentence: '생동감 있고 맛깔스러운 문장, 입말에 가까운 생생한 표현',
      emotion: '익살, 해학, 정겨움, 따뜻한 웃음',
      vocabulary: '의성어·의태어 활용, "와르르", "슬그머니", "뚝딱" 같은 생동감 있는 표현',
    },
    editingGuidelines: [
      '인물이나 상황을 과장되게 표현해 재미를 더해보세요.',
      '의성어·의태어("와르르", "슬그머니", "뚝딱")를 활용해 보세요.',
      '구어체로 생생하게 써봐요. 말하듯이 쓰면 더 맛있어요!',
      '상황의 아이러니나 엉뚱함을 포착해서 써봐요.',
    ],
    encouragements: [
      '구수한 냄새가 솔솔 나는 글이에요! 😄 해학이 살아있어요!',
      '이렇게 재미있게 쓰다니! 읽다가 웃음이 나왔어요! 🥰',
      '생동감이 넘쳐요! 의성어나 의태어를 더 넣어봐도 좋을 것 같아요! 🌾',
    ],
    exampleSentences: [],
  },
  {
    id: 'teatime',
    name: '😏 재치있는 티타임빵',
    baseAuthor: '제인 오스틴 참고 (저작권 만료)',
    copyrightStatus: 'public_domain',
    mood: '😏 위트 · 우아함 · 은근한 풍자 · 섬세한 관찰',
    styleFeatures: {
      viewpoint: '관찰자적 시점, 인물과 상황을 냉철하게 바라보는 눈',
      tone: '우아하면서도 은근히 재치 있는 어조, 직접 말하지 않고 비틀기',
      sentence: '균형 잡힌 문장, 대조와 비교를 즐기는 구조',
      emotion: '유머, 풍자, 섬세한 관찰, 적당한 거리감',
      vocabulary: '정확하고 품격 있는 어휘, 은근한 반어법',
    },
    editingGuidelines: [
      '바로 말하지 말고 돌려서 표현해 보세요. 독자가 알아채게!',
      '두 가지를 나란히 놓아 비교하는 문장을 써보세요.',
      '관찰한 것을 정확하고 간결하게 포착해 보세요.',
      '반어법이나 과장을 절제해서 써보면 더 재치 있어요.',
    ],
    encouragements: [
      '재치가 반짝반짝 빛나요! 😏 이 은근한 유머 감각이 매력이에요!',
      '관찰력이 정말 날카로워요! 딱 이 정도 거리감이 좋아요! 🍵',
      '우아하면서도 재미있어요! 조금 더 비틀어봐도 좋을 것 같아요! ✨',
    ],
    exampleSentences: [],
  },
  {
    id: 'diary',
    name: '🌸 매일 다정 일기빵',
    // 현대 작가는 실명 표방 없이, 분위기만 순수 창작으로 추상화
    baseAuthor: '순수 창작 (다정한 일상 일기 스타일)',
    copyrightStatus: 'original',
    mood: '🌸 따뜻함 · 일상의 소중함 · 다정한 구어체',
    styleFeatures: {
      viewpoint: '1인칭, 오늘 하루를 따뜻하게 돌아보는 시점',
      tone: '다정하고 솔직한 구어체, 친구에게 말하듯 편안한 어조',
      sentence: '짧고 명확한 문장, 일상적인 장면을 구체적으로 묘사',
      emotion: '따뜻함, 소소한 기쁨, 솔직함, 꾸준함의 힘',
      vocabulary: '"오늘은", "요즘", "사실" 같은 생활 언어, 친근한 일상 어휘',
    },
    editingGuidelines: [
      '오늘 있었던 작은 일을 구체적으로 써봐요.',
      '친구에게 말하듯 편안하고 다정하게 써봐요.',
      '"오늘은 ___했어요" 식으로 솔직하게 시작해 보세요.',
      '소소하지만 소중한 순간을 찾아서 표현해 봐요.',
    ],
    encouragements: [
      '따뜻한 마음이 글에서 느껴져요! 🌸 오늘도 잘 썼어요!',
      '이렇게 꾸준히 쓰는 게 제일 중요해요! 정말 대단해요! 💪',
      '일상을 이렇게 따뜻하게 쓸 수 있다니! 매일 써봐요! ✨',
    ],
    exampleSentences: [],
  },
  {
    id: 'meditation',
    name: '🕯️ 차분 사색빵',
    baseAuthor: '순수 창작 프리셋',
    copyrightStatus: 'original',
    mood: '🕯️ 고요함 · 깊이 있는 사색 · 여백이 있는 담백함',
    styleFeatures: {
      viewpoint: '관찰자 또는 1인칭, 안을 들여다보는 성찰적 시점',
      tone: '조용하고 담백하며 깊이 있는 어조, 서두르지 않는 말투',
      sentence: '천천히 전개되는 문장, 여백이 느껴지는 짧은 문장들',
      emotion: '고요함, 사색, 여유, 내면의 평화',
      vocabulary: '"문득", "조용히", "천천히", "고요히" 같은 차분한 부사',
    },
    editingGuidelines: [
      '서두르지 말고 천천히 생각을 풀어가 보세요.',
      '짧은 문장 뒤에 잠시 멈추는 느낌을 넣어봐요.',
      '내면의 생각을 조용히 들여다보듯 써보세요.',
      '"문득", "조용히" 같은 차분한 어휘를 활용해 보세요.',
    ],
    encouragements: [
      '고요하고 깊은 글이에요. 🕯️ 여백이 아름다워요!',
      '천천히 씌어진 글에서 사색의 향기가 나요. 멋져요! 🌙',
      '담백하고 진중한 문장이에요. 이 차분함을 유지해봐요! ✨',
    ],
    exampleSentences: [],
  },
];

const MOOD_LABELS = {
  bright: '😄 밝고 재미있는',
  warm: '🌸 따뜻하고 다정한',
  calm: '🕯️ 차분하고 진지한',
};

const SENTENCE_LABELS = {
  short: '✂️ 짧고 툭툭 끊어지는',
  flow: '🌊 길고 흐르듯 이어지는',
  rhythm: '🎵 리듬감 있게 통통 튀는',
};

const SPEECH_LABELS = {
  formal: '🙋 존댓말로 차근차근 건네는',
  informal: '😊 반말로 가깝게 다가가는',
  diary: '📖 일기처럼 속마음을 적는',
};

const AVERAGE_SENTENCE_LENGTH_BASELINE = 24;
const MAX_ANALYSIS_ADJUSTMENT = 15;
const SURVEY_SENTENCE_SHIFT = 18;

function clampSlider(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function mergeCustomStyle(customStyle = {}) {
  return {
    ...DEFAULT_CUSTOM_STYLE,
    ...customStyle,
    survey: {
      ...DEFAULT_CUSTOM_STYLE.survey,
      ...(customStyle.survey || {}),
    },
    sliders: {
      ...DEFAULT_CUSTOM_STYLE.sliders,
      ...(customStyle.sliders || {}),
    },
    analysis: {
      ...DEFAULT_CUSTOM_STYLE.analysis,
      ...(customStyle.analysis || {}),
      frequentWords: Array.isArray(customStyle.analysis?.frequentWords)
        ? customStyle.analysis.frequentWords
        : DEFAULT_CUSTOM_STYLE.analysis.frequentWords,
    },
  };
}

function getSentenceStyleText(data) {
  // 평균 24자를 '보통 호흡' 기준선으로 보고,
  // 분석 결과는 슬라이더를 완전히 덮어쓰지 않도록 최대 ±15까지만 살짝 보정합니다.
  const base = data.sliders.sentenceLength
    + (data.survey.sentence === 'short' ? -SURVEY_SENTENCE_SHIFT : 0)
    + (data.survey.sentence === 'flow' ? SURVEY_SENTENCE_SHIFT : 0)
    + (data.useAnalysis && data.analysis.averageSentenceLength
      ? Math.max(-MAX_ANALYSIS_ADJUSTMENT, Math.min(MAX_ANALYSIS_ADJUSTMENT, data.analysis.averageSentenceLength - AVERAGE_SENTENCE_LENGTH_BASELINE))
      : 0);

  if (base <= 35) return '짧고 경쾌한 문장';
  if (base >= 65) return '길고 천천히 흐르는 문장';
  return data.survey.sentence === 'rhythm'
    ? '리듬감 있게 굴러가는 문장'
    : '고르게 이어지는 문장';
}

function getVividnessText(value) {
  if (value <= 30) return '담백한 표현';
  if (value >= 70) return '반짝이는 표현';
  return '차분하게 살짝 색을 입힌 표현';
}

function getEnergyText(value) {
  if (value <= 30) return '조용하고 침착한 호흡';
  if (value >= 70) return '활발하고 씩씩한 호흡';
  return '부드럽고 안정적인 호흡';
}

function getHumorText(value) {
  if (value <= 30) return '진지하게 마음을 전하는';
  if (value >= 70) return '장난기 있게 미소 짓는';
  return '살짝 웃음이 비치는';
}

export function buildCustomStylePreview(customStyle = {}) {
  const data = mergeCustomStyle(customStyle);
  const keywords = data.survey.keywords
    .split(',')
    .map(word => word.trim())
    .filter(Boolean)
    .slice(0, 3);
  const opener = data.survey.speech === 'formal'
    ? '오늘은'
    : data.survey.speech === 'informal'
      ? '오늘'
      : '오늘은 왠지';
  const keywordText = keywords.length > 0
    ? `${keywords[0]} `
    : data.sliders.vividness >= 65
      ? '반짝 '
      : '';
  const ending = data.survey.speech === 'formal'
    ? '마음이 되었어요.'
    : data.survey.speech === 'informal'
      ? '기분이 들었어.'
      : '마음이 들었다.';
  const sentence = `${opener} ${keywordText}${data.sliders.energy >= 65 ? '신나게' : '조용히'} 한 장면을 꺼내 ${ending}`.replace(/\s+/g, ' ').trim();
  const description = `${getSentenceStyleText(data)}에 ${getVividnessText(data)}, ${getEnergyText(data)}, ${getHumorText(data)} 느낌을 섞었어요.`;

  return { sentence, description };
}

export function createCustomStyleProfile(customStyle = {}) {
  const data = mergeCustomStyle(customStyle);
  const preview = buildCustomStylePreview(data);
  const keywords = data.survey.keywords
    .split(',')
    .map(word => word.trim())
    .filter(Boolean)
    .slice(0, 5);
  const frequentWords = data.useAnalysis
    ? (data.analysis.frequentWords || []).slice(0, 3).map(item => item.word)
    : [];
  const signatureWords = [...new Set([...keywords, ...frequentWords])];
  const mood = `${MOOD_LABELS[data.survey.mood]} · ${getSentenceStyleText(data)} · ${getEnergyText(data)}`;
  const speechLabel = SPEECH_LABELS[data.survey.speech] || SPEECH_LABELS.diary;
  const vocabularyText = signatureWords.length > 0
    ? `"${signatureWords.join('", "')}" 같은 나만의 단어가 살아 있는 어휘`
    : `${getVividnessText(data)}을 살리는 말`;
  const analysisLine = data.useAnalysis && data.analysis.sampleCount > 0
    ? `최근 글 ${data.analysis.sampleCount}편에서 드러난 ${data.analysis.sentenceFlavor} 흐름과 ${data.analysis.speechTrend}`
    : '아직은 내가 고른 설문과 슬라이더 취향을 중심으로 굽는 중';

  return {
    id: CUSTOM_STYLE_ID,
    name: '🏆 나만의 시그니처 빵',
    baseAuthor: '내가 직접 만든 문체 레시피',
    copyrightStatus: 'original',
    mood,
    styleFeatures: {
      viewpoint: `${speechLabel} 시점`,
      tone: `${MOOD_LABELS[data.survey.mood]} 분위기에 ${getHumorText(data)} 말투`,
      sentence: `${getSentenceStyleText(data)} (${analysisLine})`,
      emotion: `${MOOD_LABELS[data.survey.mood]} 감정선, ${getEnergyText(data)}`,
      vocabulary: vocabularyText,
    },
    editingGuidelines: [
      `${getSentenceStyleText(data)}이 느껴지도록 한 문장씩 호흡을 맞춰봐요.`,
      signatureWords.length > 0
        ? `"${signatureWords[0]}" 같은 나만의 단어를 한 번씩 반짝이게 넣어봐요.`
        : '자주 쓰고 싶은 단어를 한두 개 골라 글의 향기로 써봐요.',
      data.useAnalysis && data.analysis.sampleCount > 0
        ? `최근 내 글처럼 ${data.analysis.punctuationTrend}`
        : `${SPEECH_LABELS[data.survey.speech]} 느낌을 끝까지 지켜보세요.`,
      `${getHumorText(data)} 분위기를 살리되, 너무 많이 꾸미지 말고 내 마음이 먼저 보이게 써봐요.`,
    ],
    encouragements: [
      '이건 정말 네 글 냄새가 나는 레시피예요! 아주 멋져요! 🏆',
      '한 줄만 읽어도 "아, 이건 네 문체다!" 하고 느껴져요. 계속 키워봐요! 🍞',
      '조금씩 고를수록 너만의 시그니처 빵이 더 진해지고 있어요! ✨',
    ],
    exampleSentences: [preview.sentence],
    previewDescription: preview.description,
  };
}

export function normalizeCustomStyle(customStyle = {}) {
  const merged = mergeCustomStyle(customStyle);
  const normalized = {
    ...merged,
    survey: {
      ...merged.survey,
      keywords: typeof merged.survey.keywords === 'string' ? merged.survey.keywords : '',
    },
    sliders: {
      sentenceLength: clampSlider(merged.sliders.sentenceLength, DEFAULT_CUSTOM_STYLE.sliders.sentenceLength),
      vividness: clampSlider(merged.sliders.vividness, DEFAULT_CUSTOM_STYLE.sliders.vividness),
      energy: clampSlider(merged.sliders.energy, DEFAULT_CUSTOM_STYLE.sliders.energy),
      humor: clampSlider(merged.sliders.humor, DEFAULT_CUSTOM_STYLE.sliders.humor),
    },
    sliderMoves: Math.max(0, Number(merged.sliderMoves) || 0),
    created: Boolean(merged.created),
    useAnalysis: Boolean(merged.useAnalysis),
  };

  normalized.profile = createCustomStyleProfile(normalized);
  return normalized;
}

export function getAllAuthors(customStyle) {
  return [createCustomStyleProfile(customStyle), ...AUTHORS];
}

/**
 * ID로 작가 프로필을 찾아 반환합니다.
 * @param {string} id
 * @param {Object} [customStyle]
 * @returns {Object|null}
 */
export function getAuthorById(id, customStyle) {
  if (id === CUSTOM_STYLE_ID) {
    return createCustomStyleProfile(customStyle);
  }
  return AUTHORS.find(a => a.id === id) || null;
}
