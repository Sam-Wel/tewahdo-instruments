const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_PENTATONIC_OFFSETS = [0, 2, 4, 7, 9];
const CHROMA_DECAY = 0.95;
const MIN_FREQ = 80;
const MAX_FREQ = 5000;

let audioCtx = null;
let analyser = null;
let timeData = null;
let freqData = null;
let chroma = new Array(12).fill(0);

const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");
const noteNameEl = document.getElementById("noteName");
const noteFreqEl = document.getElementById("noteFreq");
const needleEl = document.getElementById("needle");
const centsEl = document.getElementById("cents");
const keyNameEl = document.getElementById("keyName");
const keyConfidenceEl = document.getElementById("keyConfidence");
const chromaChartEl = document.getElementById("chromaChart");

const chromaBars = NOTE_NAMES.map((name) => {
  const wrap = document.createElement("div");
  wrap.className = "chroma-bar-wrap";
  const bar = document.createElement("div");
  bar.className = "chroma-bar";
  bar.style.height = "2px";
  const label = document.createElement("div");
  label.className = "chroma-label";
  label.textContent = name;
  wrap.appendChild(bar);
  wrap.appendChild(label);
  chromaChartEl.appendChild(wrap);
  return bar;
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

micBtn.addEventListener("click", startMic);

async function startMic() {
  try {
    micBtn.disabled = true;
    micStatus.textContent = "Requesting microphone access...";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);

    timeData = new Float32Array(analyser.fftSize);
    freqData = new Float32Array(analyser.frequencyBinCount);

    micStatus.textContent = "Listening";
    micBtn.textContent = "Microphone Active";
    requestAnimationFrame(update);
  } catch (err) {
    micStatus.textContent = "Microphone access denied";
    micBtn.disabled = false;
    console.error(err);
  }
}

function update() {
  analyser.getFloatTimeDomainData(timeData);
  analyser.getFloatFrequencyData(freqData);

  updateTuner(timeData, audioCtx.sampleRate);
  updateChroma(freqData, audioCtx.sampleRate);
  updateKeyDisplay();

  requestAnimationFrame(update);
}

function updateTuner(buf, sampleRate) {
  const freq = autoCorrelate(buf, sampleRate);
  if (freq === -1) {
    noteNameEl.textContent = "--";
    noteFreqEl.textContent = "0.0 Hz";
    centsEl.textContent = "0 cents";
    needleEl.style.transform = "rotate(0deg)";
    return;
  }

  const noteNum = Math.round(12 * Math.log2(freq / 440) + 69);
  const noteFreq = 440 * Math.pow(2, (noteNum - 69) / 12);
  const cents = Math.floor(1200 * Math.log2(freq / noteFreq));
  const name = NOTE_NAMES[((noteNum % 12) + 12) % 12];

  noteNameEl.textContent = name;
  noteFreqEl.textContent = `${freq.toFixed(1)} Hz`;
  centsEl.textContent = `${cents > 0 ? "+" : ""}${cents} cents`;

  const clamped = Math.max(-50, Math.min(50, cents));
  const angle = (clamped / 50) * 90;
  needleEl.style.transform = `rotate(${angle}deg)`;
}

function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buf.slice(r1, r2);
  const newSize = trimmed.length;
  const c = new Array(newSize).fill(0);
  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (d < newSize - 1 && c[d] > c[d + 1]) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  let T0 = maxPos;
  if (T0 <= 0) return -1;

  const x1 = c[T0 - 1] !== undefined ? c[T0 - 1] : c[T0];
  const x2 = c[T0];
  const x3 = c[T0 + 1] !== undefined ? c[T0 + 1] : c[T0];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) T0 = T0 - b / (2 * a);

  if (T0 <= 0) return -1;
  return sampleRate / T0;
}

function updateChroma(freqData, sampleRate) {
  const binHz = sampleRate / analyser.fftSize;
  const newEnergy = new Array(12).fill(0);

  const minBin = Math.max(1, Math.floor(MIN_FREQ / binHz));
  const maxBin = Math.min(freqData.length - 1, Math.ceil(MAX_FREQ / binHz));

  for (let i = minBin; i <= maxBin; i++) {
    const db = freqData[i];
    if (db < -90) continue;
    const freq = i * binHz;
    const amp = Math.pow(10, db / 20);
    const noteNum = 12 * Math.log2(freq / 440) + 69;
    const pitchClass = ((Math.round(noteNum) % 12) + 12) % 12;
    newEnergy[pitchClass] += amp;
  }

  for (let i = 0; i < 12; i++) {
    chroma[i] = chroma[i] * CHROMA_DECAY + newEnergy[i] * (1 - CHROMA_DECAY);
  }
}

function updateKeyDisplay() {
  const total = chroma.reduce((a, b) => a + b, 0);
  if (total < 1e-6) {
    keyNameEl.textContent = "--";
    keyConfidenceEl.textContent = "confidence: 0%";
    chromaBars.forEach((bar) => {
      bar.style.height = "2px";
      bar.classList.remove("in-scale");
    });
    return;
  }

  let bestRoot = 0;
  let bestScore = -Infinity;
  for (let root = 0; root < 12; root++) {
    const scaleTones = MAJOR_PENTATONIC_OFFSETS.map((o) => (root + o) % 12);
    const inSum = scaleTones.reduce((sum, pc) => sum + chroma[pc], 0);
    if (inSum > bestScore) {
      bestScore = inSum;
      bestRoot = root;
    }
  }

  const confidence = Math.round((bestScore / total) * 100);
  keyNameEl.textContent = `${NOTE_NAMES[bestRoot]} Major (pentatonic)`;
  keyConfidenceEl.textContent = `confidence: ${confidence}%`;

  const scaleTones = new Set(MAJOR_PENTATONIC_OFFSETS.map((o) => (bestRoot + o) % 12));
  const maxVal = Math.max(...chroma, 1e-6);
  chroma.forEach((val, i) => {
    const heightPx = Math.max(2, (val / maxVal) * 130);
    chromaBars[i].style.height = `${heightPx}px`;
    chromaBars[i].classList.toggle("in-scale", scaleTones.has(i));
  });
}
