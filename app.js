/* ===== 세종수목원 식물도감 - 앱 로직 ===== */
(function () {
  "use strict";

  const STORAGE_KEY = "sejong_plant_dex_v1";
  const QUEST_SIZE = 5; // 사용자마다 찾아야 할 식물 수

  // ---------- 상태(localStorage) ----------
  // state = { collected: {...}, badges: {...}, quest: ["plant_003", ...] }
  // quest: 사용자마다 랜덤으로 배정된 5개 식물 id (한 번 정하면 유지)
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { collected: {}, badges: {}, quest: [] };
      const s = JSON.parse(raw);
      s.collected = s.collected || {};
      s.badges = s.badges || {};
      s.quest = Array.isArray(s.quest) ? s.quest : [];
      return s;
    } catch (e) {
      return { collected: {}, badges: {}, quest: [] };
    }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  let state = loadState();

  // ---------- 헬퍼 ----------
  const $ = (sel) => document.querySelector(sel);
  const zoneById = (id) => ZONES.find((z) => z.id === id);
  const plantById = (id) => PLANTS.find((p) => p.id === id);
  const isCollected = (id) => !!state.collected[id];

  // ---------- 퀘스트(랜덤 5종) ----------
  // 전체 식물 중 랜덤 5종을 사용자별로 한 번만 배정하고 유지
  function ensureQuest() {
    const valid = state.quest.filter((id) => plantById(id));
    if (valid.length === QUEST_SIZE) { state.quest = valid; return; }
    const pool = PLANTS.map((p) => p.id);
    // Fisher-Yates 셔플
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.quest = pool.slice(0, Math.min(QUEST_SIZE, pool.length));
    saveState();
  }
  // 퀘스트에 속한 식물만 대상으로 계산
  const questPlants = () => state.quest.map((id) => plantById(id)).filter(Boolean);
  const isQuestPlant = (id) => state.quest.indexOf(id) !== -1;
  const questTotal = () => state.quest.length;
  const collectedCount = () => state.quest.filter((id) => isCollected(id)).length;
  // 현재 찾아야 할(아직 미수집) 첫 번째 퀘스트 식물
  const currentTarget = () => questPlants().find((p) => !isCollected(p.id)) || null;

  function refreshIcons() {
    if (window.lucide && typeof lucide.createIcons === "function") lucide.createIcons();
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // ---------- 진행도 ----------
  function updateProgress() {
    const total = questTotal();
    const got = collectedCount();
    const pct = total ? Math.round((got / total) * 100) : 0;
    $("#progress-text").textContent = `${got} / ${total} (${pct}%)`;
    $("#progress-fill").style.width = pct + "%";
  }

  // ---------- 지도 렌더 ----------
  function renderMap() {
    const markers = $("#map-markers");
    markers.innerHTML = "";

    // 지도 이미지 로드 실패 시 대체 배경 적용
    const mapBg = $("#map-bg");
    if (mapBg && !mapBg.dataset.checked) {
      mapBg.dataset.checked = "1";
      const probe = new Image();
      probe.onerror = () => mapBg.classList.add("fallback");
      probe.src = "assets/sejong-map.png";
    }

    // 이미 수집한 퀘스트 식물이 있는 구역에만 라벨 노출(스포일러 최소화)
    const target = currentTarget();
    const doneQuest = questPlants().filter((p) => isCollected(p.id));
    const labelZones = new Set(doneQuest.map((p) => p.zone));
    if (target) labelZones.add(target.zone);

    ZONES.forEach((z) => {
      if (!labelZones.has(z.id)) return;
      const lbl = document.createElement("div");
      lbl.className = "zone-label";
      lbl.style.left = z.x + "%";
      lbl.style.top = (z.y - 11) + "%";
      lbl.textContent = z.name;
      markers.appendChild(lbl);
    });

    // 같은 구역에 여러 핀이 겹치지 않도록 소량 오프셋 부여
    const zoneSeen = {};
    function placePin(z, plantId) {
      const n = zoneSeen[z.id] = (zoneSeen[z.id] || 0);
      zoneSeen[z.id]++;
      // 0번은 중앙, 이후는 살짝 어긋나게
      const dx = n === 0 ? 0 : Math.cos(n * 2.4) * 6;
      const dy = n === 0 ? 0 : Math.sin(n * 2.4) * 6;
      return { x: z.x + dx, y: z.y + dy };
    }

    // 이미 수집 완료한 퀘스트 식물: 완료 핀으로 표시
    doneQuest.forEach((p) => {
      const z = zoneById(p.zone);
      if (!z) return;
      const pos = placePin(z, p.id);
      const m = document.createElement("div");
      m.className = "marker done";
      m.style.left = pos.x + "%";
      m.style.top = pos.y + "%";
      m.textContent = p.emoji;
      m.title = p.name;
      m.addEventListener("click", () => openPlantModal(p.id, "map"));
      markers.appendChild(m);
    });

    // 현재 찾아야 할 식물: 단 하나의 '?' 핀만 펄스로 강조
    if (target) {
      const z = zoneById(target.zone);
      if (z) {
        const pos = placePin(z, target.id);
        const m = document.createElement("div");
        m.className = "marker locked pulse";
        m.style.left = pos.x + "%";
        m.style.top = pos.y + "%";
        m.textContent = "?";
        m.title = "다음 목표";
        m.addEventListener("click", () => openPlantModal(target.id, "map"));
        markers.appendChild(m);
      }
    } else if (questTotal() > 0) {
      // 모든 퀘스트 완료: 안내 배너
      const banner = document.createElement("div");
      banner.className = "map-clear-banner";
      banner.innerHTML = "🎉 목표 식물 " + questTotal() + "종을 모두 찾았어요!";
      markers.appendChild(banner);
    }
  }

  // ---------- 도감 렌더 ----------
  function renderDex() {
    const grid = $("#dex-grid");
    grid.innerHTML = "";
    questPlants().forEach((p, idx) => {
      const done = isCollected(p.id);
      const card = document.createElement("div");
      card.className = "dex-card " + (done ? "unlocked" : "locked");

      const isNew = done && state._recentlyCollected === p.id;
      card.innerHTML =
        `<span class="dex-num">#${String(idx + 1).padStart(2, "0")}</span>` +
        (isNew ? `<span class="badge-new">NEW</span>` : "") +
        `<div class="dex-emoji">${done ? p.emoji : "🌱"}</div>` +
        `<div class="dex-name">${done ? p.name : "？？？"}</div>`;
      card.addEventListener("click", () => openPlantModal(p.id, "dex"));
      grid.appendChild(card);
    });
  }

  // ---------- 뱃지 로직 ----------
  function badgeUnlocked(badge) {
    const c = badge.condition;
    if (c.type === "count") return collectedCount() >= c.value;
    // 퀘스트 전체(5종) 완료 조건
    if (c.type === "complete") return questTotal() > 0 && collectedCount() >= questTotal();
    return false;
  }
  // 새로 해금된 뱃지 목록 반환 (state.badges 업데이트)
  function evaluateBadges() {
    const newly = [];
    BADGES.forEach((b) => {
      const unlocked = badgeUnlocked(b);
      if (unlocked && !state.badges[b.id]) {
        state.badges[b.id] = true;
        newly.push(b);
      }
    });
    return newly;
  }

  function renderBadges() {
    const grid = $("#badge-grid");
    grid.innerHTML = "";
    BADGES.forEach((b) => {
      const unlocked = !!state.badges[b.id] || badgeUnlocked(b);
      const card = document.createElement("div");
      card.className = "badge-card " + (unlocked ? "unlocked" : "locked");
      card.innerHTML =
        `<div class="badge-icon"><i data-lucide="${unlocked ? b.icon : "lock"}"></i></div>` +
        `<div class="badge-title">${b.name}</div>` +
        `<div class="badge-desc">${b.desc}</div>`;
      grid.appendChild(card);
    });
    renderCertificate();
    refreshIcons();
  }

  // ---------- 완료 인증 카드 ----------
  function renderCertificate() {
    const zone = $("#cert-zone");
    const total = questTotal();
    const got = collectedCount();
    if (total === 0 || got < total) {
      zone.innerHTML =
        `<div class="cert-locked">` +
        `<i data-lucide="trophy"></i><br>` +
        `내게 배정된 목표 식물(${total}종)을 모두 찾으면<br><strong>탐험 완료 인증 카드</strong>가 발급됩니다.` +
        `<br><span style="font-size:12px">현재 ${got} / ${total} 수집</span>` +
        `</div>`;
      refreshIcons();
      return;
    }
    const badgeCount = BADGES.filter((b) => state.badges[b.id] || badgeUnlocked(b)).length;
    const today = fmtDate(new Date().toISOString());
    zone.innerHTML =
      `<div class="cert-card" id="cert-card">` +
      `<div class="cert-seal">🏅</div>` +
      `<h3>세종의 탐험가</h3>` +
      `<div class="cert-sub">국립세종수목원 식물도감 완성 인증</div>` +
      `<div class="cert-stats">` +
        `<div><span class="num">${got}</span><span class="lbl">수집 식물</span></div>` +
        `<div><span class="num">${badgeCount}</span><span class="lbl">획득 뱃지</span></div>` +
        `<div><span class="num">100%</span><span class="lbl">완성도</span></div>` +
      `</div>` +
      `<div class="cert-date">발급일 ${today}</div>` +
      `<button class="cert-share" id="cert-share-btn"><i data-lucide="share-2"></i> 공유하기</button>` +
      `</div>`;
    refreshIcons();
    const btn = $("#cert-share-btn");
    if (btn) btn.addEventListener("click", shareCertificate);
  }

  async function shareCertificate() {
    const shareData = {
      title: "세종수목원 식물 탐험 완료!",
      text: `국립세종수목원에서 나만의 목표 식물 ${questTotal()}종을 모두 찾아 '세종의 탐험가'가 되었어요! 🌿🏅`,
      url: location.origin + location.pathname,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
        showToast("공유 문구를 복사했어요. 원하는 곳에 붙여넣으세요!");
      }
    } catch (e) {
      showToast("화면을 캡처해 자랑해보세요! 📸");
    }
  }

  // ---------- 식물 상세 모달 ----------
  function openPlantModal(id, from) {
    const p = plantById(id);
    if (!p) return;
    const done = isCollected(id);
    const z = zoneById(p.zone);
    const card = $("#plant-modal-card");

    let body;
    if (done) {
      body =
        `<div class="pm-hero" style="background:${z ? z.color + "22" : "#e3f0e5"}">` +
          `<span>${p.emoji}</span>` +
          `<div class="pm-close"><button class="icon-btn" data-close="plant"><i data-lucide="x"></i></button></div>` +
        `</div>` +
        `<div class="pm-body">` +
          `<h2 class="pm-name">${p.name}</h2>` +
          `<div class="pm-sci">${p.sci}</div>` +
          `<div class="pm-tags">` +
            `<span class="pm-tag">📍 ${z ? z.name : ""}</span>` +
            `<span class="pm-tag">🌸 ${p.bloom}</span>` +
          `</div>` +
          `<p class="pm-desc">${p.desc}</p>` +
          `<div class="pm-found"><i data-lucide="calendar-check"></i> 발견 일시: ${fmtDate(state.collected[id])}</div>` +
        `</div>`;
    } else {
      body =
        `<div class="pm-hero" style="background:#efeade">` +
          `<span style="filter:brightness(0) opacity(0.25)">${p.emoji}</span>` +
          `<div class="pm-close"><button class="icon-btn" data-close="plant"><i data-lucide="x"></i></button></div>` +
        `</div>` +
        `<div class="pm-body">` +
          `<h2 class="pm-name">？？？</h2>` +
          `<div class="pm-sci">아직 발견하지 못한 식물</div>` +
          `<div class="pm-tags">` +
            `<span class="pm-tag">📍 ${z ? z.name : ""}</span>` +
          `</div>` +
          `<div class="pm-locked-note"><i data-lucide="map-pinned"></i><div><strong>위치 힌트</strong><br>${p.hint}</div></div>` +
          `<div class="pm-locked-note"><i data-lucide="qr-code"></i><div>현장 푯말의 QR을 스캔하면 도감에 등록돼요.</div></div>` +
        `</div>`;
    }
    card.innerHTML = body;
    openModal("#plant-modal");
    card.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", () => closeModal("#plant-modal"))
    );
    refreshIcons();
  }

  // ---------- 수집 처리 (최우선 기능) ----------
  function collectPlant(id, opts) {
    opts = opts || {};
    const p = plantById(id);
    if (!p) {
      showToast("알 수 없는 식물 코드예요 🤔");
      return false;
    }
    const already = isCollected(id);
    if (!already) {
      state.collected[id] = new Date().toISOString();
      state._recentlyCollected = id;
      const newBadges = evaluateBadges();
      saveState();
      renderAll();
      showCollectPopup(p, false, newBadges);
      fireConfetti();
    } else {
      showCollectPopup(p, true, []);
    }
    return true;
  }

  function showCollectPopup(p, already, newBadges) {
    const z = zoneById(p.zone);
    const card = $("#collect-card");
    let badgeHtml = "";
    if (newBadges && newBadges.length) {
      badgeHtml =
        `<div style="margin:6px 0 2px;font-size:12.5px;color:var(--gold);font-weight:800">` +
        newBadges.map((b) => `🏅 '${b.name}' 뱃지 획득!`).join("<br>") +
        `</div>`;
    }

    // 퀘스트 진행/다음 목표 안내
    let questHtml = "";
    if (!already) {
      const got = collectedCount();
      const total = questTotal();
      const next = currentTarget();
      if (isQuestPlant(p.id)) {
        if (next) {
          const nz = zoneById(next.zone);
          questHtml =
            `<div class="collect-next">목표 진행 ${got} / ${total}<br>` +
            `다음 목표: <strong>${nz ? nz.name : ""}</strong> 구역으로 이동해 다음 QR을 찾아보세요!</div>`;
        } else {
          questHtml = `<div class="collect-next">🎉 목표 식물 ${total}종을 모두 찾았어요! 뱃지 탭에서 인증 카드를 확인하세요.</div>`;
        }
      } else {
        // 퀘스트 외 식물(보너스)
        questHtml = `<div class="collect-next">보너스 발견! (내 목표: ${got} / ${total})</div>`;
      }
    }

    card.innerHTML =
      `<div class="collect-badge">${already ? "이미 수집한 식물" : "NEW! 식물 발견"}</div>` +
      `<div class="collect-emoji">${p.emoji}</div>` +
      `<div class="collect-name">${p.name}</div>` +
      `<div class="collect-sci">${p.sci}</div>` +
      (already
        ? `<div class="collect-already">이미 도감에 등록된 식물이에요.</div>`
        : `<div class="collect-msg">${z ? z.name + "의 " : ""}<strong>${p.name}</strong>을(를)<br>도감에 등록했어요! 🎉</div>` + badgeHtml + questHtml) +
      `<button class="collect-btn" id="collect-ok">${already ? "확인" : "좋아요!"}</button>`;
    openModal("#collect-popup");
    $("#collect-ok").addEventListener("click", () => closeModal("#collect-popup"));
  }

  function fireConfetti() {
    if (typeof confetti !== "function") return;
    const opts = { origin: { y: 0.6 }, zIndex: 100 };
    confetti(Object.assign({ particleCount: 90, spread: 70, startVelocity: 42 }, opts));
    setTimeout(() => confetti(Object.assign({ particleCount: 60, spread: 100, angle: 60, origin: { x: 0, y: 0.7 } }, { zIndex: 100 })), 180);
    setTimeout(() => confetti(Object.assign({ particleCount: 60, spread: 100, angle: 120, origin: { x: 1, y: 0.7 } }, { zIndex: 100 })), 320);
  }

  // ---------- 모달 유틸 ----------
  function openModal(sel) { $(sel).classList.add("open"); }
  function closeModal(sel) { $(sel).classList.remove("open"); }

  // 오버레이 바깥 클릭 시 닫기
  document.querySelectorAll(".modal-overlay").forEach((ov) => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov) {
        ov.classList.remove("open");
        if (ov.id === "scanner-modal") stopScanner();
      }
    });
  });

  // ---------- 토스트 ----------
  let toastTimer;
  function showToast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------- 탭 전환 ----------
  function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === tab)
    );
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $("#view-" + tab).classList.add("active");
    if (tab === "dex") state._recentlyCollected = null; // NEW 뱃지는 다시 방문 시 해제
  }
  document.querySelectorAll(".tab-btn").forEach((b) =>
    b.addEventListener("click", () => switchTab(b.dataset.tab))
  );

  // ---------- QR 스캐너 (html5-qrcode) ----------
  let html5Qr = null;
  function startScanner() {
    openModal("#scanner-modal");
    if (typeof Html5Qrcode === "undefined") {
      showToast("스캐너를 불러오지 못했어요. 인터넷 연결을 확인하세요.");
      return;
    }
    html5Qr = new Html5Qrcode("qr-reader");
    html5Qr
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const id = extractCollectId(decodedText);
          if (id) {
            stopScanner();
            closeModal("#scanner-modal");
            collectPlant(id);
          } else {
            showToast("식물 QR코드가 아니에요 🌱");
          }
        },
        () => {} // 프레임 실패 무시
      )
      .catch(() => {
        showToast("카메라 권한을 허용해야 스캔할 수 있어요.");
      });
  }
  function stopScanner() {
    if (html5Qr) {
      html5Qr.stop().then(() => { html5Qr.clear(); html5Qr = null; }).catch(() => { html5Qr = null; });
    }
  }
  // QR 텍스트(URL 또는 순수 id)에서 collect id 추출
  function extractCollectId(text) {
    if (!text) return null;
    try {
      const u = new URL(text, location.href);
      const c = u.searchParams.get("collect");
      if (c) return c;
    } catch (e) { /* not a URL */ }
    // "plant_001" 또는 "collect=plant_001" 형태 허용
    const m = String(text).match(/(plant_\d{3})/);
    return m ? m[1] : null;
  }

  $("#scan-fab").addEventListener("click", startScanner);
  $("#scanner-close").addEventListener("click", () => { stopScanner(); closeModal("#scanner-modal"); });

  // ---------- URL 파라미터 자동 수집 (최우선 기능) ----------
  function handleCollectParam() {
    const params = new URLSearchParams(location.search);
    const id = params.get("collect");
    if (id) {
      // 즉시 수집 팝업. 살짝 지연시켜 렌더 후 자연스럽게 노출
      setTimeout(() => collectPlant(id), 400);
      // 주소창 정리 (새로고침 시 중복 팝업 방지)
      if (history.replaceState) {
        history.replaceState(null, "", location.origin + location.pathname);
      }
    }
  }

  // ---------- 전체 렌더 ----------
  function renderAll() {
    updateProgress();
    renderMap();
    renderDex();
    renderBadges();
  }

  // ---------- 초기화 ----------
  function init() {
    ensureQuest(); // 사용자별 랜덤 5종 목표 확정
    renderAll();
    refreshIcons();
    handleCollectParam();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 디버그/데모용 전역 노출
  window.SejongDex = {
    collect: collectPlant,
    quest: function () { return state.quest.slice(); },
    // 완전 초기화 + 새로운 랜덤 목표 재배정
    reset: function () { localStorage.removeItem(STORAGE_KEY); state = loadState(); ensureQuest(); renderAll(); showToast("초기화 완료! 새로운 목표 " + questTotal() + "종이 배정됐어요."); },
    // 목표만 새로 뽑기(수집 기록 유지)
    reroll: function () { state.quest = []; ensureQuest(); state.badges = {}; renderAll(); showToast("새로운 목표 식물을 배정했어요."); },
    // 목표 전부 수집(데모)
    collectAll: function () { ensureQuest(); state.quest.forEach((id) => { state.collected[id] = new Date().toISOString(); }); evaluateBadges(); saveState(); renderAll(); },
  };
})();
