/* ===== 세종수목원 식물도감 - 앱 로직 ===== */
(function () {
  "use strict";

  const STORAGE_PREFIX = "sejong_plant_dex_v3_"; // 입장코드별 localStorage 키 접두사
  const LAST_CODE_KEY = "sejong_last_code";        // 마지막 로그인 코드 기억
  const QUEST_SIZE = 5; // 사용자마다 찾아야 할 식물 수

  // 현재 로그인한 입장 코드
  let ticketCode = null;
  function storageKey() { return STORAGE_PREFIX + (ticketCode || "guest"); }

  // ---------- Supabase 클라이언트 ----------
  let sb = null;
  function initSupabase() {
    try {
      const cfg = window.SUPABASE_CONFIG;
      if (cfg && window.supabase && cfg.url && cfg.anonKey) {
        sb = window.supabase.createClient(cfg.url, cfg.anonKey);
      }
    } catch (e) { sb = null; }
  }

  // ---------- 상태(localStorage + Supabase) ----------
  // state = { collected: {...}, badges: {...}, quest: [...] }
  function emptyState() { return { collected: {}, badges: {}, quest: [] }; }
  function normalizeState(s) {
    s = s || {};
    s.collected = s.collected || {};
    s.badges = s.badges || {};
    s.quest = Array.isArray(s.quest) ? s.quest : [];
    return s;
  }
  function loadLocalState() {
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return emptyState();
      return normalizeState(JSON.parse(raw));
    } catch (e) {
      return emptyState();
    }
  }
  function saveLocalState() {
    try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch (e) {}
  }
  // 로컬 저장 + 서버 저장(디바운스)
  function saveState() {
    saveLocalState();
    scheduleRemoteSave();
  }
  let state = emptyState();

  // ---------- Supabase 세션 저장/불러오기 ----------
  // 6자리 코드로 서버에서 진행 불러오기 (없으면 null)
  async function fetchRemoteSession(code) {
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from("sessions").select("quest,collected,badges")
        .eq("ticket_code", code).maybeSingle();
      if (error) { console.warn("fetch error", error.message); return null; }
      if (!data) return null;
      return normalizeState({
        quest: data.quest, collected: data.collected, badges: data.badges,
      });
    } catch (e) { return null; }
  }
  // 현재 state를 서버에 저장(upsert)
  async function upsertRemoteSession() {
    if (!sb || !ticketCode) return;
    try {
      await sb.from("sessions").upsert({
        ticket_code: ticketCode,
        quest: state.quest,
        collected: state.collected,
        badges: state.badges,
        updated_at: new Date().toISOString(),
      }, { onConflict: "ticket_code" });
    } catch (e) { /* 오프라인 등: 로컬엔 이미 저장됨 */ }
  }
  let remoteSaveTimer = null;
  function scheduleRemoteSave() {
    if (!sb || !ticketCode) return;
    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = setTimeout(upsertRemoteSession, 600);
  }

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

  // 식물 대표 이미지 HTML: 사진(img) 있으면 사진, 없으면 이모지.
  // 사진 로드 실패 시 자동으로 이모지로 대체(onerror).
  function plantVisual(p, sizeClass) {
    if (p.img) {
      return '<img class="plant-photo ' + (sizeClass || '') + '" src="' + p.img + '" alt="' + p.name +
        '" onerror="this.onerror=null;this.outerHTML=\'<span>' + (p.emoji || '🌿') + '</span>\'">';
    }
    return '<span>' + (p.emoji || '🌿') + '</span>';
  }
  // 위치 표기: locations(전체 위치 텍스트) 우선, 없으면 zone 이름
  function plantLocationText(p) {
    if (p.locations) return p.locations;
    var z = zoneById(p.zone);
    return z ? z.name : '';
  }

  // 이름을 글자수만큼 'O'로 가림(공백은 유지). 예: "핑크뮬리" -> "OOOO"
  function maskName(name) {
    return String(name || '').replace(/\S/g, 'O');
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
      probe.src = "assets/pixel-map.png";
    }

    const target = currentTarget();
    const doneQuest = questPlants().filter((p) => isCollected(p.id));

    // 지도에 표시할 대상: 이미 수집한 퀘스트 식물들 + 현재 목표 1개
    const items = doneQuest.map((p) => ({ p: p, kind: "done" }));
    if (target) items.push({ p: target, kind: "target" });

    if (items.length === 0) {
      if (questTotal() > 0) {
        const banner = document.createElement("div");
        banner.className = "map-clear-banner";
        banner.innerHTML = "🎉 목표 식물 " + questTotal() + "종을 모두 찾았어요!";
        markers.appendChild(banner);
      }
      return;
    }

    // 겹침 방지: 각 식물의 앵커(실제 위치)와, 밀어낸 핀 위치를 계산.
    // 핀은 앵커 위쪽 슬롯에 배치하고, 슬롯이 겹치면 좌우로 분산.
    const placed = []; // 이미 놓인 핀 위치들 {x,y}
    const MINDIST = 20; // 핀 간 최소 거리(% 기준 대략치)

    function farEnough(x, y) {
      return placed.every((q) => {
        const dx = q.x - x, dy = q.y - y;
        return (dx * dx + dy * dy) >= (MINDIST * MINDIST) * 0.25;
      });
    }
    // 앵커 주변에서 겹치지 않는 핀 위치 탐색(위쪽 우선 → 나선형)
    function findSlot(ax, ay) {
      const cands = [
        [0, -16], [0, -24], [-16, -14], [16, -14],
        [-20, -2], [20, -2], [0, -32], [-24, -22], [24, -22],
        [-14, 12], [14, 12], [0, 14],
      ];
      for (const [dx, dy] of cands) {
        const x = Math.max(8, Math.min(92, ax + dx));
        const y = Math.max(10, Math.min(88, ay + dy));
        if (farEnough(x, y)) return { x, y };
      }
      // 다 겹치면 그냥 위로
      return { x: Math.max(8, Math.min(92, ax)), y: Math.max(10, Math.min(88, ay - 16)) };
    }

    items.forEach((it) => {
      const z = zoneById(it.p.zone);
      if (!z) return;
      const ax = z.x, ay = z.y;              // 앵커(실제 위치)
      const slot = findSlot(ax, ay);          // 핀 위치(겹침 회피)
      placed.push(slot);

      // 1) 연결선(앵커 → 핀)
      const line = document.createElement("div");
      line.className = "map-link";
      const dx = slot.x - ax, dy = slot.y - ay;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      line.style.left = ax + "%";
      line.style.top = ay + "%";
      line.style.width = len + "%";
      line.style.transform = "rotate(" + ang + "deg)";
      markers.appendChild(line);

      // 2) 앵커 점(실제 위치)
      const anchor = document.createElement("div");
      anchor.className = "map-anchor" + (it.kind === "target" ? " target" : "");
      anchor.style.left = ax + "%";
      anchor.style.top = ay + "%";
      markers.appendChild(anchor);

      // 3) 핀(사진 또는 ?) + 구역 라벨
      const pin = document.createElement("div");
      pin.className = "map-pin " + it.kind;
      pin.style.left = slot.x + "%";
      pin.style.top = slot.y + "%";

      const label = it.kind === "target" ? "여기서 찾기" : it.p.name;
      const labelClass = it.kind === "target" ? "pin-label highlight" : "pin-label";
      const visual = it.kind === "target" ? "?" : plantVisual(it.p, "marker-photo");
      const bubbleClass = "pin-bubble " + it.kind + (it.kind === "target" ? " pulse" : "") + (it.p.img && it.kind === "done" ? " has-photo" : "");

      pin.innerHTML =
        '<div class="' + bubbleClass + '">' + visual + '</div>' +
        '<div class="' + labelClass + '">' + label + '</div>';
      pin.addEventListener("click", () => openPlantModal(it.p.id, "map"));
      markers.appendChild(pin);
    });
  }

  // ---------- 도감 렌더 ----------
  function renderDex() {
    const grid = $("#dex-grid");
    grid.innerHTML = "";
    // 도감은 등록된 전체 식물을 표시(수집한 것만 컬러 활성화)
    PLANTS.forEach((p, idx) => {
      const done = isCollected(p.id);
      const card = document.createElement("div");
      card.className = "dex-card " + (done ? "unlocked" : "locked");

      const isNew = done && state._recentlyCollected === p.id;
      card.innerHTML =
        `<span class="dex-num">#${String(idx + 1).padStart(2, "0")}</span>` +
        (isNew ? `<span class="badge-new">NEW</span>` : "") +
        `<div class="dex-emoji">${done ? plantVisual(p, "dex-photo") : "🌱"}</div>` +
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
        `<div class="pm-hero ${p.img ? "has-photo" : ""}" style="background:${z ? z.color + "22" : "#e3f0e5"}">` +
          plantVisual(p, "pm-photo") +
          `<div class="pm-close"><button class="icon-btn" data-close="plant"><i data-lucide="x"></i></button></div>` +
        `</div>` +
        `<div class="pm-body">` +
          `<h2 class="pm-name">${p.name}</h2>` +
          (p.sci ? `<div class="pm-sci">${p.sci}</div>` : "") +
          `<div class="pm-tags">` +
            `<span class="pm-tag">📍 ${plantLocationText(p)}</span>` +
            (p.bloom ? `<span class="pm-tag">🌸 ${p.bloom}</span>` : "") +
          `</div>` +
          `<p class="pm-desc">${p.desc}</p>` +
          `<div class="pm-found"><i data-lucide="calendar-check"></i> 발견 일시: ${fmtDate(state.collected[id])}</div>` +
        `</div>`;
    } else {
      body =
        `<div class="pm-hero ${p.img ? "has-photo" : ""}" style="background:${z ? z.color + "22" : "#efeade"}">` +
          plantVisual(p, "pm-photo") +
          `<span class="pm-find-badge">찾아가기</span>` +
          `<div class="pm-close"><button class="icon-btn" data-close="plant"><i data-lucide="x"></i></button></div>` +
        `</div>` +
        `<div class="pm-body">` +
          `<h2 class="pm-name pm-name-masked">${maskName(p.name)}</h2>` +
          `<div class="pm-sci">사진과 힌트를 보고 찾아가 보세요!</div>` +
          `<div class="pm-tags">` +
            `<span class="pm-tag">📍 ${plantLocationText(p)}</span>` +
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

    // 이미 수집한 식물이면 안내만
    if (isCollected(id)) {
      showCollectPopup(p, true, []);
      return true;
    }

    // 정답 판정: 지금 찾아야 할 목표(currentTarget)의 QR만 정답으로 인정
    const target = currentTarget();
    if (target && id !== target.id) {
      // 오답: 목표가 아닌 식물의 QR을 찍음 -> 수집하지 않음
      showWrongPopup(target);
      return false;
    }
    // 목표가 없는데(=퀘스트 밖) 아직 수집 안 한 식물이면 오답 처리
    if (!target && !isQuestPlant(id)) {
      showWrongPopup(null);
      return false;
    }

    // 정답: 수집 처리
    state.collected[id] = new Date().toISOString();
    state._recentlyCollected = id;
    const newBadges = evaluateBadges();
    saveState();
    renderAll();
    showCollectPopup(p, false, newBadges);
    fireConfetti();
    return true;
  }

  // 오답 안내 팝업 (정답 이름은 노출하지 않아 맞히는 재미 유지)
  function showWrongPopup(target) {
    const card = $("#collect-card");
    const tz = target ? zoneById(target.zone) : null;
    const guide = target
      ? `지금 찾는 식물은 여기가 아니에요.<br><strong>${tz ? tz.name : ""}</strong> 쪽의 목표 식물을 다시 찾아보세요!`
      : `지금 목표로 배정된 식물이 아니에요. 지도에서 목표 식물을 확인해 주세요.`;
    card.innerHTML =
      `<div class="collect-badge wrong">앗, 다른 식물이에요</div>` +
      `<div class="collect-emoji">❌</div>` +
      `<div class="collect-name">틀렸어요</div>` +
      `<div class="collect-next">${guide}</div>` +
      `<button class="collect-btn" id="collect-ok">다시 찾아볼게요</button>`;
    openModal("#collect-popup");
    $("#collect-ok").addEventListener("click", () => closeModal("#collect-popup"));
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
      `<div class="collect-emoji ${p.img ? "has-photo" : ""}">${plantVisual(p, "collect-photo")}</div>` +
      `<div class="collect-name">${p.name}</div>` +
      (p.sci ? `<div class="collect-sci">${p.sci}</div>` : "") +
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

  // ---------- 앱 시작(로그인 성공 후 호출) ----------
  function startApp() {
    $("#login-overlay").classList.add("hidden");
    ensureQuest();        // 목표 5종 확정(없으면 새로 배정 → 저장 시 서버 반영)
    saveState();          // 새 배정/이어받기 상태를 로컬+서버에 반영
    updateCurrentCode();
    renderAll();
    refreshIcons();
    handleCollectParam();
  }

  // 헤더에 현재 입장번호 표시
  function updateCurrentCode() {
    const el = $("#current-code");
    if (!el) return;
    if (ticketCode) {
      el.innerHTML = `<i data-lucide="ticket"></i> 입장번호 <strong>${ticketCode}</strong>`;
      el.style.display = "flex";
    } else {
      el.innerHTML = "";
      el.style.display = "none";
    }
    refreshIcons();
  }

  // 로그아웃(확인 후 로그인 화면으로)
  function doLogout() {
    const ok = window.confirm(
      "로그아웃할까요?\n\n진행 상황은 입장번호 " + (ticketCode || "") +
      " 로 서버에 저장되어 있어, 같은 번호로 다시 로그인하면 이어서 할 수 있어요."
    );
    if (!ok) return;
    // 마지막 상태를 서버에 즉시 저장
    upsertRemoteSession();
    ticketCode = null;
    try { localStorage.removeItem(LAST_CODE_KEY); } catch (e) {}
    updateCurrentCode();
    const input = $("#login-code");
    if (input) input.value = "";
    $("#login-error").textContent = "";
    $("#login-overlay").classList.remove("hidden");
    if (input) input.focus();
  }

  // ---------- 로그인 처리 ----------
  async function doLogin(code) {
    const btn = $("#login-start");
    const errEl = $("#login-error");
    errEl.textContent = "";

    if (!/^\d{6}$/.test(code)) {
      errEl.textContent = "6자리 숫자를 정확히 입력해 주세요.";
      return;
    }
    btn.classList.add("loading"); btn.disabled = true;

    ticketCode = code;
    try { localStorage.setItem(LAST_CODE_KEY, code); } catch (e) {}

    // 1) 로컬 캐시 먼저 로드(오프라인 대비)
    state = loadLocalState();

    // 2) 서버에서 세션 조회 → 있으면 이어받기
    const remote = await fetchRemoteSession(code);
    if (remote) {
      state = remote;
      saveLocalState(); // 서버 데이터를 로컬에도 캐시
    }

    btn.classList.remove("loading"); btn.disabled = false;
    startApp();
  }

  function setupLoginUI() {
    const input = $("#login-code");
    const btn = $("#login-start");
    // 숫자만 허용
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 6);
      $("#login-error").textContent = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin(input.value.trim());
    });
    btn.addEventListener("click", () => doLogin(input.value.trim()));

    // 지난번 로그인 코드가 있으면 미리 채워줌(편의)
    try {
      const last = localStorage.getItem(LAST_CODE_KEY);
      if (last) input.value = last;
    } catch (e) {}
  }

  // ---------- 부트스트랩 ----------
  function boot() {
    initSupabase();
    setupLoginUI();
    const lo = $("#logout-btn");
    if (lo) lo.addEventListener("click", doLogout);
    refreshIcons(); // 로그인 화면 아이콘 렌더
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // 디버그/데모/운영용 전역 노출
  window.SejongDex = {
    code: function () { return ticketCode; },
    collect: collectPlant,
    quest: function () { return state.quest.slice(); },
    // 현재 코드의 진행만 초기화 + 목표 재배정(로컬+서버)
    reset: function () {
      state = emptyState(); ensureQuest(); saveState(); renderAll();
      showToast("초기화 완료! 새로운 목표 " + questTotal() + "종이 배정됐어요.");
    },
    // 로그아웃(확인창 포함)
    logout: doLogout,
    // 목표 전부 수집(데모)
    collectAll: function () { ensureQuest(); state.quest.forEach((id) => { state.collected[id] = new Date().toISOString(); }); evaluateBadges(); saveState(); renderAll(); },
  };
})();
