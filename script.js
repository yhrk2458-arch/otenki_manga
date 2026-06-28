// =====================================================
// 天気漫画 - script.js
// 気象庁の防災情報API(認証不要・CORS許可)を利用しています。
// 参考: https://www.jma.go.jp/bosai/forecast/
// =====================================================

// ---- 地域リスト ----
// 気象庁の「予報区(office)コード」です。
// 完全なリストは https://www.jma.go.jp/bosai/common/const/area.json で確認できます。
// まずは主要都市のみ。後で自由に追加してください。
const AREAS = [
  { code: "130000", name: "東京都" },
  { code: "270000", name: "大阪府" },
  { code: "230000", name: "愛知県(名古屋)" },
  { code: "400000", name: "福岡県" },
  { code: "016000", name: "北海道(石狩・札幌)" },
  { code: "471000", name: "沖縄県(沖縄本島)" }
];

// ---- DOM要素 ----
const areaSelect = document.getElementById("area-select");
const resultSection = document.getElementById("result");
const errorSection = document.getElementById("error-message");
const weatherIcon = document.getElementById("weather-icon");
const tempDisplay = document.getElementById("temp-display");
const weatherText = document.getElementById("weather-text");
const mangaImage = document.getElementById("manga-image");
const mangaTitle = document.getElementById("manga-title");

let scenarios = null;

// ---- 初期化 ----
init();

async function init() {
  // 地域プルダウンを作成
  AREAS.forEach(area => {
    const opt = document.createElement("option");
    opt.value = area.code;
    opt.textContent = area.name;
    areaSelect.appendChild(opt);
  });

  // シナリオデータを読み込み
  scenarios = await fetch("data/scenarios.json").then(r => r.json());

  // 前回選択した地域を復元(ローカルストレージ)
  const savedArea = localStorage.getItem("selectedArea");
  if (savedArea) {
    areaSelect.value = savedArea;
    loadWeather(savedArea);
  }

  areaSelect.addEventListener("change", () => {
    const code = areaSelect.value;
    if (!code) return;
    localStorage.setItem("selectedArea", code);
    loadWeather(code);
  });
}

// ---- 天気情報の取得 ----
async function loadWeather(areaCode) {
  showLoading();
  try {
    const url = `https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API取得失敗");
    const data = await res.json();

    const { weatherCategory, weatherLabel } = extractWeather(data);
    const temp = extractTemperature(data);

    displayResult(weatherCategory, weatherLabel, temp);
  } catch (err) {
    console.error(err);
    showError();
  }
}

// ---- 天気予報テキストから「晴れ/曇り/雨」を判定 ----
// JMAのweatherCodes/weathersから当日の予報文を取り、キーワードで分類します。
// 注:細かい表記揺れ(「晴れ時々曇り」等)があるため、優先順位で判定しています。
function extractWeather(data) {
  // timeSeries[0] が天気コード・天気文のシリーズ
  const series = data[0].timeSeries[0];
  const areaData = series.areas[0];
  const weatherStr = areaData.weathers[0]; // 例:「曇り　夜　晴れ」

  let category = "cloudy";
  let label = weatherStr;

  if (weatherStr.includes("雨") || weatherStr.includes("雷")) {
    category = "rainy";
  } else if (weatherStr.includes("晴")) {
    category = "sunny";
  } else if (weatherStr.includes("曇")) {
    category = "cloudy";
  }

  return { weatherCategory: category, weatherLabel: label };
}

// ---- 気温の取得 ----
// 注:気象庁の予報APIは「今日の最高/最低気温(予測値)」が中心で、
// リアルタイムの現在気温が必要な場合はアメダスAPIとの組み合わせが必要です。
// (https://www.jma.go.jp/bosai/amedas/data/latest_time_data.json など)
// まずは「今日の最高気温」を温度帯判定の代用として使っています。
// 後でアメダス連携に切り替える際は、この関数だけ修正すればOKです。
function extractTemperature(data) {
  try {
    // timeSeries配列の中から気温情報を含むものを探す
    const tempSeries = data[0].timeSeries.find(s => s.areas[0].temps);
    const temps = tempSeries.areas[0].temps;
    // 配列は地域や時間帯によって構成が異なるため、数値として有効な最初の値を採用
    const validTemp = temps.find(t => t !== "" && !isNaN(parseInt(t)));
    return validTemp ? parseInt(validTemp) : null;
  } catch (e) {
    console.warn("気温の取得に失敗しました。データ構造を確認してください。", e);
    return null;
  }
}

// ---- 気温→帯カテゴリ変換 ----
function getTempBand(temp) {
  if (temp === null) return "comfortable"; // フォールバック
  if (temp >= 28) return "hot";
  if (temp >= 23) return "warm";
  if (temp >= 15) return "comfortable";
  return "cold";
}

// ---- 結果表示 ----
function displayResult(category, label, temp) {
  errorSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  const icons = { sunny: "☀️", cloudy: "☁️", rainy: "☔" };
  weatherIcon.textContent = icons[category] || "❓";
  tempDisplay.textContent = temp !== null ? `${temp}℃` : "--℃";
  weatherText.textContent = label;

  const band = getTempBand(temp);
  const candidates = scenarios[band][category];

  if (candidates && candidates.length > 0) {
    // 同じ日に同じ話が出るよう、日付+地域でシードを作って選択(毎回ランダムだと一覧性がないため)
    const today = new Date().toISOString().slice(0, 10);
    const seed = hashString(today + areaSelect.value);
    const chosen = candidates[seed % candidates.length];

    mangaImage.src = chosen.image;
    mangaImage.alt = chosen.title;
    mangaTitle.textContent = chosen.title;
  } else {
    mangaTitle.textContent = "この条件のお話はまだ準備中です";
  }
}

// ---- 簡易ハッシュ関数(同じ日は同じ話を表示するため) ----
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ---- ローディング/エラー表示 ----
function showLoading() {
  resultSection.classList.remove("hidden");
  errorSection.classList.add("hidden");
  mangaTitle.textContent = "読み込み中...";
}

function showError() {
  resultSection.classList.add("hidden");
  errorSection.classList.remove("hidden");
}
