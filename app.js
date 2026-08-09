const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_PENTATONIC_OFFSETS = [0, 2, 4, 7, 9];
const LANGUAGES = ["Amharic", "Tigrinya", "Ge'ez", "Other"];
const SPEEDS = ["slow", "medium", "fast"];
const LENGTHS = ["short", "long"];

// Chroma extraction range/threshold and block-voting window, tuned against
// ~24 real Ethiopian mezmur clips (one 60s excerpt each for all 12 major
// pentatonic keys). Only spectral peaks (not raw broadband energy) are
// counted, which avoids percussion/harmonic noise drowning out the melody
// and fixed a "dominant note mistaken for tonic" bias in earlier testing.
const MIN_FREQ = 150;
const MAX_FREQ = 1800;
const PEAK_RANGE_DB = 20;
const SILENCE_DB = -85;
const BLOCK_MS = 4000;
const DISPLAY_DECAY = 0.9;
const TUNER_BUFFER_SIZE = 2048;

let audioCtx = null;
let analyser = null;
let timeData = null;
let freqData = null;
let displayChroma = new Array(12).fill(0);
let blockChroma = new Array(12).fill(0);
let blockStartTime = 0;
let votes = new Array(12).fill(0);

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

const micBar = document.getElementById("micBar");
const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const navBackdrop = document.getElementById("navBackdrop");
const MIC_SECTIONS = new Set(["tuner", "key"]);

function closeMenu() {
  siteNav.classList.remove("open");
  navBackdrop.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function goToSection(sectionId) {
  document.querySelectorAll(".nav-link").forEach((b) => b.classList.toggle("active", b.dataset.section === sectionId));
  document.querySelectorAll(".section-panel").forEach((p) => p.classList.toggle("active", p.id === sectionId));
  micBar.classList.toggle("hidden", !MIC_SECTIONS.has(sectionId));
  closeMenu();
}

document.querySelectorAll("[data-section]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    goToSection(el.dataset.section);
  });
});

menuToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navBackdrop.classList.toggle("open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navBackdrop.addEventListener("click", closeMenu);

goToSection("tuner");
renderPlaylistGrid();
renderMezmurSection();

micBtn.addEventListener("click", startMic);

async function startMic() {
  try {
    micBtn.disabled = true;
    micStatus.textContent = "Requesting microphone access...";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);

    timeData = new Float32Array(analyser.fftSize);
    freqData = new Float32Array(analyser.frequencyBinCount);
    blockStartTime = performance.now();

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

  updateTuner(timeData.subarray(0, TUNER_BUFFER_SIZE), audioCtx.sampleRate);
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

// Only counts local spectral peaks (not raw bin energy) within PEAK_RANGE_DB
// of the loudest peak in range, restricted to the melodic fundamental range.
// This is what separates real melody content from percussion/harmonic smear.
function updateChroma(freqData, sampleRate) {
  const binHz = sampleRate / analyser.fftSize;
  const minBin = Math.max(1, Math.floor(MIN_FREQ / binHz));
  const maxBin = Math.min(freqData.length - 2, Math.floor(MAX_FREQ / binHz));

  let frameMaxDb = -Infinity;
  for (let i = minBin; i <= maxBin; i++) {
    if (freqData[i] > frameMaxDb) frameMaxDb = freqData[i];
  }
  if (frameMaxDb < SILENCE_DB) return;

  const newEnergy = new Array(12).fill(0);
  for (let i = minBin + 1; i < maxBin; i++) {
    const v = freqData[i];
    const isPeak = v > freqData[i - 1] && v > freqData[i + 1];
    if (!isPeak || v < frameMaxDb - PEAK_RANGE_DB) continue;
    const freq = i * binHz;
    const amp = Math.pow(10, v / 20);
    const noteNum = 12 * Math.log2(freq / 440) + 69;
    const pitchClass = ((Math.round(noteNum) % 12) + 12) % 12;
    newEnergy[pitchClass] += amp;
  }

  for (let i = 0; i < 12; i++) {
    blockChroma[i] += newEnergy[i];
    displayChroma[i] = displayChroma[i] * DISPLAY_DECAY + newEnergy[i] * (1 - DISPLAY_DECAY);
  }

  const now = performance.now();
  if (now - blockStartTime >= BLOCK_MS) {
    const [root] = bestPentatonicRoot(blockChroma);
    if (root !== null) votes[root]++;
    blockChroma = new Array(12).fill(0);
    blockStartTime = now;
  }
}

function bestPentatonicRoot(chromaVec) {
  const total = chromaVec.reduce((a, b) => a + b, 0);
  if (total < 1e-6) return [null, 0];

  let bestRoot = 0;
  let bestScore = -Infinity;
  for (let root = 0; root < 12; root++) {
    const scaleTones = MAJOR_PENTATONIC_OFFSETS.map((o) => (root + o) % 12);
    const inSum = scaleTones.reduce((sum, pc) => sum + chromaVec[pc], 0);
    if (inSum > bestScore) {
      bestScore = inSum;
      bestRoot = root;
    }
  }
  return [bestRoot, bestScore / total];
}

// The detected key is the most-voted root across completed 4s blocks (a
// simple temporal vote is more robust than one running average, since it
// isn't skewed by a single loud instrumental passage). Until the first
// block completes, fall back to a provisional read of the in-progress block.
function updateKeyDisplay() {
  const totalVotes = votes.reduce((a, b) => a + b, 0);

  if (totalVotes === 0) {
    const [root, ratio] = bestPentatonicRoot(blockChroma);
    if (root === null) {
      keyNameEl.textContent = "--";
      keyConfidenceEl.textContent = "confidence: 0%";
    } else {
      keyNameEl.textContent = `${NOTE_NAMES[root]} Major (pentatonic)`;
      keyConfidenceEl.textContent = `confidence: ${Math.round(ratio * 100)}% (listening...)`;
    }
  } else {
    let bestRoot = 0;
    for (let i = 1; i < 12; i++) {
      if (votes[i] > votes[bestRoot]) bestRoot = i;
    }
    const confidence = Math.round((votes[bestRoot] / totalVotes) * 100);
    keyNameEl.textContent = `${NOTE_NAMES[bestRoot]} Major (pentatonic)`;
    keyConfidenceEl.textContent = `confidence: ${confidence}% (${totalVotes} sample${totalVotes > 1 ? "s" : ""})`;
  }

  const [displayRoot] = bestPentatonicRoot(displayChroma);
  const scaleTones = new Set(
    displayRoot === null ? [] : MAJOR_PENTATONIC_OFFSETS.map((o) => (displayRoot + o) % 12)
  );
  const maxVal = Math.max(...displayChroma, 1e-6);
  displayChroma.forEach((val, i) => {
    const heightPx = Math.max(2, (val / maxVal) * 130);
    chromaBars[i].style.height = `${heightPx}px`;
    chromaBars[i].classList.toggle("in-scale", scaleTones.has(i));
  });
}

function renderPlaylistGrid() {
  const grid = document.getElementById("playlistGrid");
  KEY_PLAYLISTS.forEach(({ key, label, playlistId }) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "playlist-card";
    card.innerHTML = `<div class="key-label">${key}</div><div class="play-hint">${label} · ▶ Play</div>`;
    card.addEventListener("click", () => {
      const wrap = document.createElement("div");
      wrap.className = "playlist-embed-wrap";
      wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1" title="${label} mezmur playlist" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      card.replaceWith(wrap);
    });
    grid.appendChild(card);
  });
}

function pgQuoteInValue(v) {
  return `"${String(v).replace(/"/g, '\\"')}"`;
}

function pgInParam(values) {
  return `in.(${[...values].map(pgQuoteInValue).join(",")})`;
}

function pgArrayLiteral(values) {
  const quoted = [...values].map((v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${quoted.join(",")}}`;
}

async function mezmurRestFetch(params) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`Supabase fetch failed: ${resp.status}`);
  return resp.json();
}

async function fetchMezmur({ topics, languages, speeds, lengths, search, sort }) {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", sort || "title.asc");
  if (topics && topics.size > 0) params.set("topics", `ov.${pgArrayLiteral(topics)}`);
  if (languages && languages.size > 0) params.set("language", pgInParam(languages));
  if (speeds && speeds.size > 0) params.set("speed", pgInParam(speeds));
  if (lengths && lengths.size > 0) params.set("length", pgInParam(lengths));
  if (search) params.set("title", `ilike.*${search}*`);
  return mezmurRestFetch(params);
}

async function fetchDistinctTopics() {
  const params = new URLSearchParams({ select: "topics" });
  const rows = await mezmurRestFetch(params);
  const all = rows.flatMap((r) => r.topics || []);
  return [...new Set(all)].sort();
}

function mediaLinkHtml(url) {
  if (!url) return "";
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="media-link">▶ Watch / Listen</a>`;
}

// A single dropdown button that expands into several nested checkbox
// groups (Theme, Language, Speed, Length, ...), one per filter criterion.
// `groups` is an array of { label, values, selected, labelFn } where
// `selected` is a Set the caller owns; this only renders it and reports
// changes back via onChange. `refreshGroupValues(groupIndex, values)` lets
// a group's option list be filled in asynchronously (e.g. topics loaded
// from the DB after the dropdown itself is already rendered).
function createFilterDropdown(groups, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "dropdown-check";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "dropdown-toggle";

  const panel = document.createElement("div");
  panel.className = "dropdown-panel";

  function renderToggleLabel() {
    const count = groups.reduce((sum, g) => sum + g.selected.size, 0);
    toggle.innerHTML = `<span>Filters${count > 0 ? ` <span class="count">(${count})</span>` : ""}</span><span class="dropdown-arrow">▾</span>`;
  }

  function renderGroup(group) {
    const section = document.createElement("div");
    section.className = "dropdown-group";
    const heading = document.createElement("div");
    heading.className = "dropdown-group-label";
    heading.textContent = group.label;
    section.appendChild(heading);
    group.values.forEach((v) => {
      const optLabel = document.createElement("label");
      optLabel.className = "dropdown-option";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = group.selected.has(v);
      cb.addEventListener("change", () => {
        if (cb.checked) group.selected.add(v);
        else group.selected.delete(v);
        renderToggleLabel();
        onChange();
      });
      optLabel.appendChild(cb);
      optLabel.appendChild(document.createTextNode(" " + (group.labelFn ? group.labelFn(v) : v)));
      section.appendChild(optLabel);
    });
    return section;
  }

  function renderPanel() {
    panel.innerHTML = "";
    groups.forEach((group) => panel.appendChild(renderGroup(group)));
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".dropdown-check.open").forEach((el) => {
      if (el !== wrap) el.classList.remove("open");
    });
    wrap.classList.toggle("open");
  });

  renderToggleLabel();
  renderPanel();
  wrap.appendChild(toggle);
  wrap.appendChild(panel);

  return {
    wrap,
    setGroupValues(index, values) {
      groups[index].values = values;
      renderPanel();
    },
  };
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-check")) {
    document.querySelectorAll(".dropdown-check.open").forEach((el) => el.classList.remove("open"));
  }
});

function renderMezmurSection() {
  const filtersEl = document.getElementById("mezmurFilters");
  const listEl = document.getElementById("mezmurList");
  const statusEl = document.getElementById("mezmurStatus");
  const searchEl = document.getElementById("mezmurSearch");
  const sortEl = document.getElementById("mezmurSort");

  const selectedTopics = new Set();
  const selectedLanguages = new Set();
  const selectedSpeeds = new Set();
  const selectedLengths = new Set();
  let searchTimer = null;

  const capitalize = (s) => s[0].toUpperCase() + s.slice(1);

  async function refreshList() {
    statusEl.textContent = "Loading...";
    listEl.innerHTML = "";
    try {
      const rows = await fetchMezmur({
        topics: selectedTopics,
        languages: selectedLanguages,
        speeds: selectedSpeeds,
        lengths: selectedLengths,
        search: searchEl.value.trim(),
        sort: sortEl.value,
      });
      statusEl.textContent = "";

      if (rows.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No mezmur match this filter yet.</div>`;
        return;
      }
      rows.forEach((m) => {
        const details = document.createElement("details");
        details.className = "mezmur-card";
        details.innerHTML = `
          <summary>
            <span>${m.title}</span>
            <span class="mezmur-tags">${(m.topics || []).map((t) => `<span class="tag">${t}</span>`).join("")}<span class="tag">${m.language}</span><span class="tag">${m.speed}</span><span class="tag">${m.length}</span></span>
          </summary>
          <div class="mezmur-lyrics">${m.lyrics}${mediaLinkHtml(m.media_url)}</div>
        `;
        listEl.appendChild(details);
      });
    } catch (err) {
      statusEl.textContent = "Could not load mezmur right now. Try again shortly.";
      console.error(err);
    }
  }

  const filterDropdown = createFilterDropdown(
    [
      { label: "Theme", values: [], selected: selectedTopics },
      { label: "Language", values: LANGUAGES, selected: selectedLanguages },
      { label: "Speed", values: SPEEDS, selected: selectedSpeeds, labelFn: capitalize },
      { label: "Length", values: LENGTHS, selected: selectedLengths, labelFn: capitalize },
    ],
    refreshList
  );
  filtersEl.appendChild(filterDropdown.wrap);

  fetchDistinctTopics()
    .then((topics) => filterDropdown.setGroupValues(0, topics))
    .catch((err) => console.error(err));

  searchEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(refreshList, 300);
  });
  sortEl.addEventListener("change", refreshList);

  refreshList();
}
