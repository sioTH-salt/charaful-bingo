const MAX_PARTICIPANTS = 35;

const cards = [
  { id: 1, category: "リーダー", text: "初対面でも場をまとめるのが得意", color: "#ff3d8b" },
  { id: 2, category: "リーダー", text: "班決めや役割決めで自然と動き出す", color: "#ff3d8b" },
  { id: 3, category: "聞き上手", text: "相手の話を最後まで聞ける", color: "#00a8ff" },
  { id: 4, category: "聞き上手", text: "相談されることが多い", color: "#00a8ff" },
  { id: 5, category: "盛り上げ", text: "空気を明るくする一言が出せる", color: "#ffd23f" },
  { id: 6, category: "盛り上げ", text: "イベントやゲームで声を出せる", color: "#ffd23f" },
  { id: 7, category: "コツコツ", text: "毎日少しずつ続けるのが得意", color: "#17c964" },
  { id: 8, category: "コツコツ", text: "準備や確認を丁寧にできる", color: "#17c964" },
  { id: 9, category: "ひらめき", text: "新しいアイデアを考えるのが好き", color: "#8b5cf6" },
  { id: 10, category: "ひらめき", text: "変わった発想で驚かれることがある", color: "#8b5cf6" },
  { id: 11, category: "チャレンジ", text: "知らないことにもまず挑戦してみる", color: "#ff7a00" },
  { id: 12, category: "チャレンジ", text: "新しい場所に行くとワクワクする", color: "#ff7a00" },
  { id: 13, category: "マイペース", text: "自分のリズムを大切にしている", color: "#2dd4bf" },
  { id: 14, category: "マイペース", text: "落ち着いて考えてから動く", color: "#2dd4bf" },
  { id: 15, category: "サポート", text: "困っている人を見ると手伝いたくなる", color: "#84cc16" },
  { id: 16, category: "サポート", text: "裏方の仕事にもやりがいを感じる", color: "#84cc16" },
  { id: 17, category: "分析", text: "理由や仕組みを考えるのが好き", color: "#64748b" },
  { id: 18, category: "分析", text: "情報を整理してから判断したい", color: "#64748b" },
  { id: 19, category: "表現", text: "絵・文章・音楽などで表すのが好き", color: "#ec4899" },
  { id: 20, category: "表現", text: "自分らしい見せ方を工夫したい", color: "#ec4899" },
  { id: 21, category: "冒険", text: "予定外の展開も楽しめる", color: "#06b6d4" },
  { id: 22, category: "冒険", text: "行ったことのない場所に惹かれる", color: "#06b6d4" },
  { id: 23, category: "ユーモア", text: "笑いを取るのが好き", color: "#f97316" },
  { id: 24, category: "ユーモア", text: "小さなネタを見つけるのが得意", color: "#f97316" },
  { id: 25, category: "集中", text: "好きなことには深く没頭できる", color: "#6366f1" },
  { id: 26, category: "集中", text: "時間を忘れて作業することがある", color: "#6366f1" },
  { id: 27, category: "フレンドリー", text: "初対面の人にも声をかけられる", color: "#22c55e" },
  { id: 28, category: "フレンドリー", text: "人の名前や顔を覚えるのが得意", color: "#22c55e" },
  { id: 29, category: "ポジティブ", text: "失敗しても切り替えが早い", color: "#eab308" },
  { id: 30, category: "ポジティブ", text: "良いところを見つけるのが得意", color: "#eab308" },
];

const allCategories = [...new Set(cards.map((card) => card.category))];
const STORAGE_KEY = "charafull-bingo-state-v1";

const state = {
  currentCardIndex: 0,
  answers: {},
  yesCards: [],
  selectedCardIdsForChoice: [],
  mySelectedCards: [],
  badgeNumber: null,
  bingoBoard: [],
  bingoBoardState: [],
  targetNumbers: [],
  scannedHistory: [],
  currentScreenId: "screen-start",
  html5QrCode: null,
  isScannerRunning: false,
  isHandlingScan: false,
  isAnimatingCard: false,
  manualSelectedCategories: [],
  pendingPartnerCategories: [],
};

let audioContext = null;

function getElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`DOM element not found: ${selector}`);
  }
  return element;
}

const dom = {
  screens: document.querySelectorAll(".screen"),
  analysisCard: getElement("#analysis-card"),
  analysisProgress: getElement("#analysis-progress"),
  selectedSource: getElement("#selected-source"),
  selectCount: getElement("#select-count"),
  confirmSelection: getElement("#confirm-selection"),
  badgeInput: getElement("#badge-number"),
  registerError: getElement("#register-error"),
  introCategoryCards: getElement("#intro-category-cards"),
  myCategories: getElement("#my-categories"),
  bingoBoard: getElement("#bingo-board"),
  targetPanel: getElement("#target-panel"),
  qrModal: getElement("#qr-modal"),
  qrContainer: getElement("#qr-container"),
  qrDataText: getElement("#qr-data-text"),
  scanStatus: getElement("#scan-status"),
  manualCategoryPanel: getElement("#manual-category-panel"),
  manualPartnerNumber: getElement("#manual-partner-number"),
  manualCategoryList: getElement("#manual-category-list"),
  manualCount: getElement("#manual-count"),
  confirmManualCategories: getElement("#confirm-manual-categories"),
  syncResult: getElement("#sync-result"),
  bingoMessage: getElement("#bingo-message"),
};

function applyParticipantLimitText() {
  dom.badgeInput.max = String(MAX_PARTICIPANTS);
  dom.badgeInput.placeholder = "例: 12";
  dom.manualPartnerNumber.max = String(MAX_PARTICIPANTS);
  dom.manualPartnerNumber.placeholder = "例: 8";
}

function showScreen(screenId) {
  dom.screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });
  state.currentScreenId = screenId;
  saveGameState();
}

function saveGameState() {
  try {
    const payload = {
      yesCards: state.yesCards,
      mySelectedCards: state.mySelectedCards,
      userNumber: state.badgeNumber,
      bingoBoard: state.bingoBoard,
      bingoBoardState: state.bingoBoardState,
      currentTargets: state.targetNumbers,
      scannedHistory: state.scannedHistory,
      currentScreenId: state.currentScreenId,
      currentCardIndex: state.currentCardIndex,
      answers: state.answers,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Game state save failed:", error);
  }
}

function loadGameState() {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (!savedText) {
      return false;
    }

    const saved = JSON.parse(savedText);
    state.currentCardIndex = Number.isInteger(saved.currentCardIndex) ? saved.currentCardIndex : 0;
    state.answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
    state.yesCards = normalizeSavedCards(saved.yesCards);
    state.mySelectedCards = normalizeSelectedCards(saved.mySelectedCards, saved.yesCards);
    state.badgeNumber = normalizeBadgeNumber(saved.userNumber ?? saved.badgeNumber ?? saved.userBadgeNumber);
    state.bingoBoard = Array.isArray(saved.bingoBoard) ? saved.bingoBoard.filter((category) => category === "FREE" || allCategories.includes(category)) : [];
    state.bingoBoardState = normalizeBingoBoardState(saved.bingoBoardState);
    if (state.bingoBoardState.length !== 9 && state.bingoBoard.length === 9) {
      state.bingoBoardState = state.bingoBoard.map((category, index) => ({
        index,
        category,
        isFree: category === "FREE",
        isOpen: category === "FREE",
      }));
    }
    state.targetNumbers = normalizeNumberList(saved.currentTargets);
    state.scannedHistory = normalizeNumberList(saved.scannedHistory);
    state.currentScreenId = typeof saved.currentScreenId === "string" ? saved.currentScreenId : "screen-start";
    return true;
  } catch (error) {
    console.warn("Game state load failed:", error);
    return false;
  }
}

function normalizeSavedCards(savedCards) {
  if (!Array.isArray(savedCards)) {
    return [];
  }

  return savedCards
    .map((savedCard) => cards.find((card) => card.id === savedCard.id || card.id === savedCard))
    .filter(Boolean);
}

function normalizeSelectedCards(savedCards, fallbackCards = []) {
  const sourceCards = Array.isArray(savedCards) && savedCards.length > 0 ? savedCards : fallbackCards;
  if (!Array.isArray(sourceCards)) {
    return [];
  }

  const normalized = sourceCards
    .map((savedCard) => {
      const source = findCardFromSavedValue(savedCard);
      return source ? { ...source } : null;
    })
    .filter(Boolean)
    .slice(0, 3);

  return normalized;
}

function findCardFromSavedValue(savedCard) {
  if (!savedCard) {
    return null;
  }

  if (typeof savedCard === "string") {
    return cards.find((card) => card.category === savedCard || String(card.id) === savedCard) || null;
  }

  if (typeof savedCard === "number") {
    return cards.find((card) => card.id === savedCard) || null;
  }

  const exactById = cards.find((card) => card.id === savedCard.id || card.id === savedCard.cardId);
  if (exactById) {
    return { ...exactById };
  }

  if (savedCard.category && savedCard.text) {
    return {
      id: savedCard.id,
      category: savedCard.category,
      text: savedCard.text,
      color: savedCard.color || cards.find((card) => card.category === savedCard.category)?.color || "#00a8ff",
    };
  }

  return cards.find((card) => card.category === savedCard.category || card.category === savedCard.name) || null;
}

function normalizeBadgeNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= MAX_PARTICIPANTS ? number : null;
}

function normalizeNumberList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => Number(value))
    .filter((value, index, array) => Number.isInteger(value) && value >= 1 && value <= MAX_PARTICIPANTS && array.indexOf(value) === index);
}

function normalizeBingoBoardState(savedCells) {
  if (!Array.isArray(savedCells)) {
    return [];
  }

  return savedCells
    .map((cell, index) => {
      const category = cell?.category;
      if (category !== "FREE" && !allCategories.includes(category)) {
        return null;
      }

      return {
        index: Number.isInteger(cell.index) ? cell.index : index,
        category,
        isFree: category === "FREE",
        isOpen: Boolean(cell.isOpen) || category === "FREE",
      };
    })
    .filter(Boolean)
    .slice(0, 9);
}

function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch((error) => {
      console.warn("AudioContext resume failed:", error);
    });
  }

  return audioContext;
}

function playTone(frequency, startOffset, duration, type = "sine", gainValue = 0.06) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime + startOffset;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);
}

function playTapSound() {
  playTone(520, 0, 0.07, "triangle", 0.04);
}

function playSyncSound() {
  [660, 880, 1320].forEach((frequency, index) => {
    playTone(frequency, index * 0.08, 0.18, "sine", 0.055);
  });
  playTone(1760, 0.28, 0.22, "triangle", 0.045);
}

function playBingoSound() {
  [523, 659, 784, 1046].forEach((frequency, index) => {
    playTone(frequency, index * 0.13, 0.2, "square", 0.045);
  });
  [1318, 1568, 2093].forEach((frequency) => {
    playTone(frequency, 0.58, 0.38, "triangle", 0.035);
  });
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function handleUserGestureFeedback() {
  ensureAudioContext();
  playTapSound();
  vibrate(10);
}

function launchBingoConfetti() {
  if (!window.confetti) {
    return;
  }

  const duration = 2600;
  const end = Date.now() + duration;

  const timer = window.setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(timer);
      return;
    }

    const particleCount = Math.round(60 * (timeLeft / duration));
    confetti({
      particleCount,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.72 },
      colors: ["#ff3d8b", "#ffd23f", "#00a8ff", "#17c964", "#ffffff"],
    });
    confetti({
      particleCount,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.72 },
      colors: ["#ff3d8b", "#ffd23f", "#00a8ff", "#17c964", "#ffffff"],
    });
  }, 180);
}

function getMyCategoryNames() {
  state.mySelectedCards = normalizeSelectedCards(state.mySelectedCards);
  return state.mySelectedCards
    .map((card) => String(card.category || "").trim())
    .filter((category) => category && allCategories.includes(category))
    .slice(0, 3);
}

function syncQrSourceState() {
  state.badgeNumber = normalizeBadgeNumber(state.badgeNumber ?? dom.badgeInput.value);
  state.mySelectedCards = normalizeSelectedCards(state.mySelectedCards);
  return {
    badgeNumber: state.badgeNumber,
    categories: getMyCategoryNames(),
  };
}

function renderAnalysisCard() {
  const card = cards[state.currentCardIndex];
  if (!card) {
    renderSelectionScreen();
    showScreen("screen-select");
    return;
  }

  dom.analysisProgress.textContent = `${state.currentCardIndex + 1} / ${cards.length}`;
  dom.analysisCard.classList.remove("fly-yes", "fly-maybe", "fly-no");
  dom.analysisCard.innerHTML = `
    <span class="card-category" style="background:${card.color}">${card.category}</span>
    <p class="card-text">${card.text}</p>
  `;
}

function answerCard(answer) {
  if (state.isAnimatingCard) {
    return;
  }

  const card = cards[state.currentCardIndex];
  if (!card) {
    return;
  }

  state.isAnimatingCard = true;
  const animationClass = answer === "yes" ? "fly-yes" : answer === "no" ? "fly-no" : "fly-maybe";
  dom.analysisCard.classList.add(animationClass);

  window.setTimeout(() => {
    state.answers[card.id] = answer;
    if (answer === "yes" && !state.yesCards.some((yesCard) => yesCard.id === card.id)) {
      state.yesCards.push(card);
    }

    state.currentCardIndex += 1;
    state.isAnimatingCard = false;
    renderAnalysisCard();
    saveGameState();
  }, 240);
}

function renderSelectionScreen() {
  state.selectedCardIdsForChoice = [];
  dom.selectedSource.innerHTML = "";

  if (state.yesCards.length < 3) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "「はい」のカードが3枚未満です。今回は決定できないため、もう一度はじめから振り分けてください。";
    dom.selectedSource.appendChild(message);

    const restartButton = document.createElement("button");
    restartButton.className = "secondary-button";
    restartButton.type = "button";
    restartButton.textContent = "振り分けをやり直す";
    restartButton.addEventListener("click", () => {
      handleUserGestureFeedback();
      restartAnalysis();
    });
    dom.selectedSource.appendChild(restartButton);

    updateSelectionState();
    return;
  }

  state.yesCards.forEach((card) => {
    const button = document.createElement("button");
    button.className = "mini-card";
    button.type = "button";
    button.dataset.cardId = card.id;
    button.innerHTML = `<span class="card-category" style="background:${card.color}">${card.category}</span><br>${card.text}`;
    button.addEventListener("click", () => {
      handleUserGestureFeedback();
      toggleSelectedCard(card.id, button);
    });
    dom.selectedSource.appendChild(button);
  });
  updateSelectionState();
}

function toggleSelectedCard(cardId, element) {
  const exists = state.selectedCardIdsForChoice.includes(cardId);
  if (exists) {
    state.selectedCardIdsForChoice = state.selectedCardIdsForChoice.filter((id) => id !== cardId);
  } else if (state.selectedCardIdsForChoice.length < 3) {
    state.selectedCardIdsForChoice.push(cardId);
  }

  element.classList.toggle("selected", state.selectedCardIdsForChoice.includes(cardId));
  updateSelectionState();
  saveGameState();
}

function updateSelectionState() {
  dom.selectCount.textContent = `${state.selectedCardIdsForChoice.length} / 3`;
  dom.confirmSelection.disabled = state.selectedCardIdsForChoice.length !== 3;
}

function confirmSelectedCards() {
  if (state.selectedCardIdsForChoice.length !== 3) {
    return;
  }

  state.mySelectedCards = state.selectedCardIdsForChoice.map((id) => {
    const card = cards.find((candidate) => candidate.id === id);
    return { ...card };
  });

  saveGameState();
  showScreen("screen-register");
}

function registerBadgeNumber() {
  const value = Number(dom.badgeInput.value);
  if (!Number.isInteger(value) || value < 1 || value > MAX_PARTICIPANTS) {
    dom.registerError.textContent = `1〜${MAX_PARTICIPANTS}の番号を入力してください。`;
    return;
  }

  dom.registerError.textContent = "";
  state.badgeNumber = value;
  renderIntroScreen();
  saveGameState();
  showScreen("intro-screen");
}

function restartAnalysis() {
  state.currentCardIndex = 0;
  state.answers = {};
  state.yesCards = [];
  state.selectedCardIdsForChoice = [];
  state.mySelectedCards = [];
  state.badgeNumber = null;
  state.bingoBoard = [];
  state.bingoBoardState = [];
  state.targetNumbers = [];
  state.scannedHistory = [];
  renderAnalysisCard();
  showScreen("screen-analysis");
}

function setupMainScreen() {
  renderMyCategories();
  if (state.bingoBoardState.length !== 9) {
    renderBingoBoard();
  } else {
    renderBingoBoardFromState();
  }

  if (state.targetNumbers.length !== 3) {
    renderTargets();
  } else {
    renderTargetsFromState();
  }
}

function renderIntroScreen() {
  dom.introCategoryCards.innerHTML = "";
  state.mySelectedCards = normalizeSelectedCards(state.mySelectedCards);
  state.mySelectedCards.forEach((card) => {
    const source = cards.find((candidate) => candidate.id === card.id || candidate.category === card.category);
    const categoryCard = document.createElement("div");
    categoryCard.className = "intro-category-card";
    categoryCard.style.background = source?.color || "#00a8ff";
    categoryCard.innerHTML = `
      <span class="intro-card-category">${card.category}</span>
      <span class="intro-card-text">${card.text}</span>
    `;
    dom.introCategoryCards.appendChild(categoryCard);
  });
}

function startBingoFromIntro() {
  setupMainScreen();
  saveGameState();
  showScreen("screen-main");
}

function renderMyCategories() {
  dom.myCategories.innerHTML = "";
  state.mySelectedCards = normalizeSelectedCards(state.mySelectedCards);
  state.mySelectedCards.forEach((card) => {
    const source = cards.find((candidate) => candidate.id === card.id || candidate.category === card.category);
    const tag = document.createElement("article");
    tag.className = "my-card-summary";
    tag.style.borderColor = source?.color || "#231942";
    tag.innerHTML = `
      <span class="my-card-category" style="background:${source?.color || "#00a8ff"}">${card.category}</span>
      <p class="my-card-text">${card.text}</p>
    `;
    dom.myCategories.appendChild(tag);
  });
}

function renderBingoBoard() {
  const selectedCategories = shuffle(allCategories).slice(0, 8);
  const categoriesWithFree = [...selectedCategories.slice(0, 4), "FREE", ...selectedCategories.slice(4)];
  state.bingoBoard = categoriesWithFree;
  state.bingoBoardState = categoriesWithFree.map((category, index) => ({
    index,
    category,
    isFree: category === "FREE",
    isOpen: category === "FREE",
  }));

  renderBingoBoardFromState();
  saveGameState();
}

function renderTargets() {
  state.targetNumbers = shuffle(
    Array.from({ length: MAX_PARTICIPANTS }, (_, index) => index + 1).filter((number) => number !== state.badgeNumber),
  ).slice(0, 3);
  renderTargetsFromState();
  saveGameState();
}

function renderTargetsFromState() {
  dom.targetPanel.textContent = `次のターゲット：【${state.targetNumbers.join("番】【")}番】を探せ！`;
}

function showMyQr() {
  const qrSource = syncQrSourceState();
  if (!qrSource.badgeNumber || qrSource.categories.length !== 3) {
    console.warn("QR source data is incomplete:", {
      badgeNumber: qrSource.badgeNumber,
      mySelectedCards: state.mySelectedCards,
      categories: qrSource.categories,
    });
    alert("名札番号と3つのカテゴリが揃ってからQRを表示してください。");
    return;
  }

  const categoryString = qrSource.categories.map((category) => String(category).trim()).join(",");
  const safeData = encodeURIComponent(categoryString);
  const qrData = `${qrSource.badgeNumber}|${safeData}`;
  dom.qrContainer.innerHTML = "";
  dom.qrDataText.textContent = `QRデータ: ${qrSource.badgeNumber}|${categoryString}`;

  if (!window.QRCode) {
    dom.qrContainer.textContent = qrData;
  } else if (!qrData) {
    dom.qrContainer.textContent = "QRにするカテゴリがありません。";
  } else {
    try {
      new QRCode(dom.qrContainer, {
        text: qrData,
        width: 250,
        height: 250,
        typeNumber: 10,
        correctLevel: QRCode.CorrectLevel.L,
      });
    } catch (error) {
      console.error("QR generation failed:", error);
      dom.qrContainer.textContent = qrData;
      dom.qrDataText.textContent = "QR生成に失敗しました。下の文字列を相手に見せてください。";
    }
  }

  dom.qrModal.classList.add("active");
  dom.qrModal.setAttribute("aria-hidden", "false");
}

function closeQrModal() {
  dom.qrModal.classList.remove("active");
  dom.qrModal.setAttribute("aria-hidden", "true");
}

async function openScanner() {
  resetManualCategoryPanel();
  showScreen("screen-scan");
  await startQrScanner();
}

async function startQrScanner() {
  dom.scanStatus.textContent = "カメラを起動しています...";

  if (!window.Html5Qrcode) {
    dom.scanStatus.textContent = "QRリーダーを読み込めませんでした。手動入力を使ってください。";
    return;
  }

  const cameraConfigs = await getCameraConfigs();
  for (const cameraConfig of cameraConfigs) {
    try {
      if (!state.html5QrCode) {
        state.html5QrCode = new Html5Qrcode("reader");
      }

      await state.html5QrCode.start(cameraConfig, { fps: 10, qrbox: { width: 240, height: 240 } }, onQrScanSuccess, () => {});

      state.isScannerRunning = true;
      dom.scanStatus.textContent = "相手のQRコードを枠内に入れてください。";
      return;
    } catch (error) {
      state.isScannerRunning = false;
      console.warn("QR scanner start fallback failed:", cameraConfig, error);
      await clearScannerInstance();
    }
  }

  dom.scanStatus.textContent = "カメラを起動できませんでした。手動入力を使ってください。";
}

async function getCameraConfigs() {
  const configs = [{ facingMode: "environment" }, { facingMode: "user" }];

  try {
    const cameras = await Html5Qrcode.getCameras();
    cameras.forEach((camera) => {
      configs.push(camera.id);
    });
  } catch (error) {
    console.warn("Camera list unavailable:", error);
  }

  return configs;
}

async function clearScannerInstance() {
  if (!state.html5QrCode) {
    return;
  }

  try {
    await state.html5QrCode.clear();
  } catch (error) {
    console.warn("QR scanner clear failed:", error);
  } finally {
    state.html5QrCode = null;
  }
}

async function stopQrScanner() {
  if (!state.html5QrCode || !state.isScannerRunning) {
    return;
  }

  try {
    await state.html5QrCode.stop();
    await state.html5QrCode.clear();
  } catch (error) {
    console.error("QR scanner stop failed:", error);
  } finally {
    state.isScannerRunning = false;
    state.html5QrCode = null;
  }
}

async function onQrScanSuccess(decodedText) {
  if (state.isHandlingScan) {
    return;
  }

  const trimmedText = String(decodedText || "").trim();
  let partnerData;
  try {
    partnerData = parsePartnerPayload(trimmedText);
  } catch (e) {
    console.warn("Invalid QR payload:", trimmedText, e);
    await stopQrScanner();
    dom.scanStatus.textContent = "無効なQRコードです。もう一度スキャンする場合はメインに戻って再開するか、手動入力を使ってください。";
    return;
  }

  try {
    await handlePartnerData(partnerData);
  } catch (e) {
    console.error("QR handling failed:", e);
    await stopQrScanner();
    dom.scanStatus.textContent = "QR処理中にエラーが発生しました。手動入力を使ってください。";
  }
}

function parsePartnerPayload(payload) {
  const text = String(payload || "").trim();
  const parts = text.split("|");
  if (parts.length !== 2) {
    throw new Error("QR payload must be badgeNumber|category1,category2,category3");
  }

  const [numberPart, categoriesPart] = parts;
  const badgeNumber = normalizeBadgeNumber(numberPart);
  if (!badgeNumber) {
    throw new Error("QR payload contains invalid badge number");
  }

  return {
    badgeNumber,
    categories: parseCategoryPayload(categoriesPart),
  };
}

function parseCategoryPayload(payload) {
  const decodedPayload = decodeURIComponent(String(payload || ""));
  return decodedPayload
    .replace(/\s+/g, "")
    .split(",")
    .filter((category) => category.length > 0);
}

function renderManualCategoryOptions() {
  dom.manualCategoryList.innerHTML = "";
  allCategories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-toggle";
    button.textContent = category;
    button.addEventListener("click", () => {
      handleUserGestureFeedback();
      toggleManualCategory(category, button);
    });
    dom.manualCategoryList.appendChild(button);
  });
  updateManualCategoryState();
}

function resetManualCategoryPanel() {
  state.manualSelectedCategories = [];
  dom.manualPartnerNumber.value = "";
  dom.manualCategoryPanel.classList.add("hidden");
  renderManualCategoryOptions();
}

function toggleManualCategory(category, button) {
  const exists = state.manualSelectedCategories.includes(category);
  if (exists) {
    state.manualSelectedCategories = state.manualSelectedCategories.filter((item) => item !== category);
  } else if (state.manualSelectedCategories.length < 3) {
    state.manualSelectedCategories.push(category);
  }

  button.classList.toggle("selected", state.manualSelectedCategories.includes(category));
  updateManualCategoryState();
}

function updateManualCategoryState() {
  dom.manualCount.textContent = `${state.manualSelectedCategories.length} / 3`;
  dom.confirmManualCategories.disabled = state.manualSelectedCategories.length !== 3;
}

async function confirmManualCategories() {
  if (state.manualSelectedCategories.length !== 3) {
    return;
  }

  const partnerNumber = normalizeBadgeNumber(dom.manualPartnerNumber.value);
  if (!partnerNumber) {
    alert(`相手の名札番号を1〜${MAX_PARTICIPANTS}で入力してください。`);
    return;
  }

  await handlePartnerData({
    badgeNumber: partnerNumber,
    categories: [...state.manualSelectedCategories],
  });
}

async function handlePartnerData(partnerData) {
  if (state.isHandlingScan) {
    return;
  }

  if (partnerData.badgeNumber === state.badgeNumber) {
    alert("自分自身はスキャンできません。別の人を探そう");
    return;
  }

  if (state.scannedHistory.includes(partnerData.badgeNumber)) {
    alert("この方はスキャン済みです！別の人を探そう");
    await stopQrScanner();
    showScreen("screen-main");
    return;
  }

  state.isHandlingScan = true;
  state.pendingPartnerCategories = partnerData.categories;
  state.scannedHistory.push(partnerData.badgeNumber);
  saveGameState();
  await stopQrScanner();

  const matchedCategories = getMatchedCategories(partnerData.categories);
  dom.syncResult.textContent = createSyncMessage(matchedCategories, partnerData.categories);
  playSyncSound();
  vibrate([100, 50, 100]);
  showScreen("screen-sync");

  window.setTimeout(() => {
    resolveBingoWithPartnerCategories(partnerData.categories);
    state.isHandlingScan = false;
    saveGameState();
  }, 3400);
}

function getMatchedCategories(partnerCategories) {
  const myCategories = getMyCategoryNames();
  return partnerCategories.filter((category) => myCategories.includes(category));
}

function createSyncMessage(matchedCategories, partnerCategories) {
  if (matchedCategories.length === 3) {
    return "✨奇跡の完全一致！ 運命のバディ発見！";
  }

  if (matchedCategories.length >= 1) {
    const leadMessages = ["似た者同士！", "✨意気投合間違いなし！", "奇跡の共通点！", "シンクロ発見！", "会話が弾む予感！"];
    return `${pickRandom(leadMessages)} お互い「${matchedCategories.join("・")}」を持っています！`;
  }

  const myCat = pickRandom(getMyCategoryNames()) || "自分らしさ";
  const targetCat = pickRandom(partnerCategories) || "相手らしさ";
  const mismatchTemplates = [
    `あなたの【${myCat}】と相手の【${targetCat}】が交わる時、未知の化学反応が起きる！`,
    `【${targetCat}】を持つ相手がいれば、あなたの【${myCat}】がさらに輝く最高の補完コンビ！`,
    `正反対の魅力！【${myCat}】×【${targetCat}】で弱点なしの無敵チーム結成！`,
    `あなたの【${myCat}】に相手の【${targetCat}】が加われば、新しい景色が見えてくる！`,
    `共通点ゼロでも相性抜群！【${myCat}】と【${targetCat}】で会場をかき回そう！`,
    `違うからこそ面白い！【${myCat}】×【${targetCat}】のミラクルペア誕生！`,
  ];
  return pickRandom(mismatchTemplates);
}

function resolveBingoWithPartnerCategories(partnerCategories) {
  const openedCategories = openMatchingBingoCells(partnerCategories);
  renderBingoBoardFromState();
  saveGameState();

  if (hasBingo()) {
    dom.bingoMessage.className = "bingo-message bingo-win";
    dom.bingoMessage.textContent = "BINGO達成！！今すぐ画面をスタッフに見せて景品をGETしろ！！‍♂️";
    playBingoSound();
    vibrate([300, 100, 300, 100, 500]);
    launchBingoConfetti();
    showScreen("screen-bingo-result");
    return;
  }

  dom.bingoMessage.className = "bingo-message bingo-continue";
  dom.bingoMessage.textContent =
    openedCategories.length > 0
      ? `${openedCategories.join("・")} が開いた！ 次のターゲットを探そう！`
      : "今回は開くマスなし！ 次のターゲットを探そう！";
  renderTargets();
  showScreen("screen-bingo-result");
  window.setTimeout(() => showScreen("screen-main"), 2400);
}

function openMatchingBingoCells(partnerCategories) {
  const candidates = state.bingoBoardState.filter((cell) => !cell.isOpen && partnerCategories.includes(cell.category));
  const selectedCell = pickRandom(candidates);
  if (!selectedCell) {
    return [];
  }

  selectedCell.isOpen = true;
  return [selectedCell.category];
}

function renderBingoBoardFromState() {
  dom.bingoBoard.innerHTML = "";
  state.bingoBoardState.forEach((cellState) => {
    const cell = document.createElement("div");
    cell.className = "bingo-cell";
    cell.dataset.index = String(cellState.index);
    cell.textContent = cellState.category;
    cell.classList.toggle("free", cellState.isFree);
    cell.classList.toggle("open", cellState.isOpen);
    attachDebugOpenHandlers(cell, cellState);
    dom.bingoBoard.appendChild(cell);
  });
}

function attachDebugOpenHandlers(cell, cellState) {
  let pressTimer = null;

  cell.addEventListener("dblclick", () => {
    forceOpenBingoCell(cellState.index);
  });

  cell.addEventListener("pointerdown", () => {
    pressTimer = window.setTimeout(() => {
      forceOpenBingoCell(cellState.index);
    }, 650);
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
    cell.addEventListener(eventName, () => {
      if (pressTimer) {
        window.clearTimeout(pressTimer);
        pressTimer = null;
      }
    });
  });
}

function forceOpenBingoCell(index) {
  const cell = state.bingoBoardState[index];
  if (!cell || cell.isOpen) {
    return;
  }

  handleUserGestureFeedback();
  cell.isOpen = true;
  renderBingoBoardFromState();
  saveGameState();

  if (hasBingo()) {
    dom.bingoMessage.className = "bingo-message bingo-win";
    dom.bingoMessage.textContent = "BINGO達成！！今すぐ画面をスタッフに見せて景品をGETしろ！！‍♂️";
    playBingoSound();
    vibrate([300, 100, 300, 100, 500]);
    launchBingoConfetti();
    showScreen("screen-bingo-result");
  }
}

function hasBingo() {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  return lines.some((line) => line.every((index) => state.bingoBoardState[index]?.isOpen));
}

function restoreSavedView() {
  dom.badgeInput.value = state.badgeNumber ?? "";

  if (state.mySelectedCards.length > 0) {
    renderIntroScreen();
    renderMyCategories();
  }

  if (state.bingoBoardState.length === 9) {
    renderBingoBoardFromState();
  }

  if (state.targetNumbers.length === 3) {
    renderTargetsFromState();
  }

  const resumableScreenId = getResumableScreenId(state.currentScreenId);
  if (resumableScreenId === "screen-analysis") {
    renderAnalysisCard();
  } else if (resumableScreenId === "screen-select") {
    renderSelectionScreen();
  } else if (resumableScreenId === "intro-screen") {
    renderIntroScreen();
  } else if (resumableScreenId === "screen-main" && state.bingoBoardState.length !== 9 && state.mySelectedCards.length === 3) {
    setupMainScreen();
  }

  showScreen(resumableScreenId);
}

function getResumableScreenId(screenId) {
  const existingScreen = document.getElementById(screenId);
  if (!existingScreen) {
    return "screen-start";
  }

  if (screenId === "screen-scan" || screenId === "screen-sync" || screenId === "screen-bingo-result") {
    if (state.bingoBoardState.length === 9 && state.badgeNumber) {
      return "screen-main";
    }
    return state.mySelectedCards.length === 3 && state.badgeNumber ? "intro-screen" : "screen-start";
  }

  if (screenId === "screen-main" && (!state.badgeNumber || state.mySelectedCards.length !== 3)) {
    return "screen-start";
  }

  if (screenId === "intro-screen" && (!state.badgeNumber || state.mySelectedCards.length !== 3)) {
    return "screen-start";
  }

  return screenId;
}

function resetGameData() {
  if (!confirm("セーブデータを消去して最初からやり直しますか？")) {
    return;
  }

  try {
    localStorage.clear();
  } catch (error) {
    console.warn("Game state reset failed:", error);
  } finally {
    window.location.reload();
  }
}

function clearScanHistoryForTest() {
  state.scannedHistory = [];
  saveGameState();
  alert("スキャン履歴をクリアしました！同じ人を再度スキャンできます。");
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickRandom(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => {
    handleUserGestureFeedback();
    showScreen(button.dataset.next);
  });
});

document.querySelectorAll("[data-answer]").forEach((button) => {
  button.addEventListener("click", () => {
    handleUserGestureFeedback();
    answerCard(button.dataset.answer);
  });
});

dom.confirmSelection.addEventListener("click", () => {
  handleUserGestureFeedback();
  confirmSelectedCards();
});
getElement("#confirm-register").addEventListener("click", () => {
  handleUserGestureFeedback();
  registerBadgeNumber();
});
getElement("#start-bingo").addEventListener("click", () => {
  handleUserGestureFeedback();
  startBingoFromIntro();
});
getElement("#show-my-qr").addEventListener("click", () => {
  handleUserGestureFeedback();
  showMyQr();
});
getElement("#close-qr-modal").addEventListener("click", () => {
  handleUserGestureFeedback();
  closeQrModal();
});
dom.qrModal.addEventListener("click", (event) => {
  if (event.target === dom.qrModal) {
    handleUserGestureFeedback();
    closeQrModal();
  }
});
getElement("#open-scanner").addEventListener("click", () => {
  handleUserGestureFeedback();
  openScanner();
});
getElement("#open-manual-entry").addEventListener("click", () => {
  handleUserGestureFeedback();
  dom.manualCategoryPanel.classList.toggle("hidden");
});
dom.confirmManualCategories.addEventListener("click", () => {
  handleUserGestureFeedback();
  confirmManualCategories();
});
getElement("#close-scanner").addEventListener("click", async () => {
  handleUserGestureFeedback();
  await stopQrScanner();
  showScreen("screen-main");
});
getElement("#reset-game-data").addEventListener("click", () => {
  handleUserGestureFeedback();
  resetGameData();
});
document.querySelectorAll("[data-full-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    handleUserGestureFeedback();
    resetGameData();
  });
});
getElement("#clear-scan-history").addEventListener("click", () => {
  handleUserGestureFeedback();
  clearScanHistoryForTest();
});

applyParticipantLimitText();
renderManualCategoryOptions();
if (loadGameState()) {
  restoreSavedView();
} else {
  renderAnalysisCard();
  saveGameState();
}
