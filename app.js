(function () {
  const MODULES = {
    perf: {
      id: "perf",
      list: () => window.PERF_DATA || window.DOMAIN_DATA || [],
      mnemonic: () => window.PERF_MNEMONIC || window.MNEMONIC || "",
      mnemonicNote: () => "",
      shortLabel: (name) =>
        name.replace("绩效域", "").replace("与生命周期", ""),
      boxLeft: { title: "预期目标", badge: "必背" },
      boxRight: { title: "效果检查", badge: "怎么验" },
    },
    ka: {
      id: "ka",
      list: () => window.KA_DATA || [],
      mnemonic: () => window.KA_MNEMONIC || "",
      mnemonicNote: () => window.KA_MNEMONIC_NOTE || "",
      shortLabel: (name) =>
        name.replace("项目", "").replace("管理", ""),
      boxLeft: { title: "过程清单", badge: "ITTO骨架" },
      boxRight: { title: "必背要点", badge: "公式/易混" },
    },
  };

  const state = {
    module: "perf",
    itemId: null,
    mode: "overview",
    query: "",
  };

  const $nav = document.getElementById("domain-nav");
  const $main = document.getElementById("main");
  const $modes = document.querySelectorAll("[data-mode]");
  const $moduleBtns = document.querySelectorAll(".module-btn");
  const $search = document.getElementById("search");
  const $mnemonic = document.getElementById("mnemonic");
  const $mnemonicNote = document.getElementById("mnemonic-note");
  const $searchEmpty = document.getElementById("search-empty");

  function mod() {
    return MODULES[state.module];
  }

  function currentList() {
    return mod().list();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlight(text) {
    const q = state.query.trim();
    const safe = escapeHtml(text);
    if (!q) return safe;
    try {
      const re = new RegExp(
        `(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      return safe.replace(re, "<mark>$1</mark>");
    } catch {
      return safe;
    }
  }

  function matchQuery(item) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    return JSON.stringify(item).toLowerCase().includes(q);
  }

  function ensureItemId() {
    const list = currentList();
    if (!list.length) {
      state.itemId = null;
      return;
    }
    if (!list.find((d) => d.id === state.itemId)) {
      const matched = list.filter(matchQuery);
      state.itemId = (matched[0] || list[0]).id;
    }
  }

  function updateMnemonic() {
    if ($mnemonic) $mnemonic.textContent = mod().mnemonic();
    if ($mnemonicNote) {
      const note = mod().mnemonicNote();
      $mnemonicNote.textContent = note;
      $mnemonicNote.classList.toggle("hidden", !note);
    }
  }

  function updateModuleUi() {
    document.body.dataset.module = state.module;
    $nav.dataset.module = state.module;
    $moduleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.module === state.module);
    });
    updateMnemonic();
  }

  function renderNav() {
    const list = currentList();
    const matchedCount = list.filter(matchQuery).length;
    if ($searchEmpty) {
      $searchEmpty.classList.toggle(
        "hidden",
        !state.query.trim() || matchedCount > 0
      );
    }

    $nav.innerHTML = list
      .map((d) => {
        const active = d.id === state.itemId ? " active" : "";
        const hidden = matchQuery(d) ? "" : " hidden-by-search";
        return `<button type="button" class="domain-tab${active}${hidden}" data-id="${d.id}" title="${escapeHtml(d.name)}">
          <span class="short">${escapeHtml(d.short)}</span>
          <span class="full">${escapeHtml(mod().shortLabel(d.name))}</span>
        </button>`;
      })
      .join("");
  }

  function tagsHtml(tags) {
    if (!tags || !tags.length) return "";
    return `<div class="tags">${tags
      .map((t) => {
        const pg = processGroupClass(t);
        return `<span class="tag${pg}">${highlight(t)}</span>`;
      })
      .join("")}</div>`;
  }

  function processGroupClass(text) {
    const t = String(text);
    if (/^启动/.test(t) || t === "启动") return " pg-init";
    if (/^规划/.test(t) || t === "规划") return " pg-plan";
    if (/^执行/.test(t) || t === "执行") return " pg-exec";
    if (/^监控/.test(t) || t === "监控") return " pg-monitor";
    if (/^收尾/.test(t) || t === "收尾") return " pg-close";
    return "";
  }

  function itemsHtml(items) {
    if (!items || !items.length) return "";
    return `<ul class="item-list">${items
      .map((it) => `<li>${highlight(it)}</li>`)
      .join("")}</ul>`;
  }

  function blockHtml(block) {
    const label = block.label
      ? `<div class="block-label">${highlight(block.label)}</div>`
      : "";
    const parts = [];
    if (block.tags) parts.push(tagsHtml(block.tags));
    if (block.items) parts.push(itemsHtml(block.items));
    if (block.note)
      parts.push(`<p class="note">${highlight(block.note)}</p>`);
    return `<div class="block">${label}<div class="block-content revealable">${parts.join("")}</div></div>`;
  }

  function sectionHtml(section, idx) {
    const blocks = (section.blocks || []).map(blockHtml).join("");
    return `<section class="section" data-sec="${idx}">
      <button type="button" class="section-head" data-toggle-sec="${idx}">
        <span>${highlight(section.title)}</span>
        <span class="chev">▼</span>
      </button>
      <div class="section-body">${blocks}</div>
    </section>`;
  }

  function goalItemHtml(g) {
    if (state.module !== "ka") {
      return `<li>${highlight(g)}</li>`;
    }
    const parts = String(g).split("｜");
    if (parts.length >= 2) {
      const pg = parts[0].trim();
      const name = parts.slice(1).join("｜").trim();
      return `<li class="proc-item"><span class="pg-pill ${processGroupClass(pg).trim()}">${highlight(pg)}</span><span class="proc-name">${highlight(name)}</span></li>`;
    }
    return `<li>${highlight(g)}</li>`;
  }

  function renderMain() {
    ensureItemId();
    const list = currentList();
    const item = list.find((d) => d.id === state.itemId) || list[0];
    if (!item) {
      $main.innerHTML = `<p class="tip">暂无数据</p>`;
      return;
    }

    const cfg = mod();
    const goals = (item.goals || []).map(goalItemHtml).join("");
    const checks = (item.checks || [])
      .map(
        (c) =>
          `<li><span class="ck-label">${highlight(c.label)}</span><span class="ck-desc">${highlight(c.desc)}</span></li>`
      )
      .join("");
    const sections = (item.sections || [])
      .map((s, i) => sectionHtml(s, i))
      .join("");

    $main.innerHTML = `
      <header class="domain-head">
        <h2>${highlight(item.name)}</h2>
        <span class="en">${escapeHtml(item.en || "")}</span>
        <p class="tip">${highlight(item.tip || "")}</p>
      </header>
      <div class="grid-2">
        <div class="box goals">
          <h3 class="box-title">${cfg.boxLeft.title} <span class="badge">${cfg.boxLeft.badge}</span></h3>
          <ul class="goal-list revealable">${goals}</ul>
        </div>
        <div class="box checks">
          <h3 class="box-title">${cfg.boxRight.title} <span class="badge">${cfg.boxRight.badge}</span></h3>
          <ul class="check-list revealable">${checks}</ul>
        </div>
      </div>
      ${sections}
    `;

    applyModeClass();
  }

  function applyModeClass() {
    document.body.classList.remove(
      "mode-overview",
      "mode-collapse",
      "mode-quiz"
    );
    document.body.classList.add(`mode-${state.mode}`);

    $modes.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === state.mode);
    });

    if (state.mode === "overview") {
      $main.querySelectorAll(".section").forEach((el) => {
        el.classList.remove("collapsed", "forced-open");
      });
      $main.querySelectorAll(".revealable").forEach((el) => {
        el.classList.add("revealed");
      });
    }

    if (state.mode === "collapse") {
      $main.querySelectorAll(".section").forEach((el) => {
        el.classList.remove("forced-open", "collapsed");
      });
      $main.querySelectorAll(".revealable").forEach((el) => {
        el.classList.add("revealed");
      });
    }

    if (state.mode === "quiz") {
      $main.querySelectorAll(".section").forEach((el) => {
        el.classList.remove("collapsed");
        el.classList.add("forced-open");
      });
      $main.querySelectorAll(".revealable").forEach((el) => {
        el.classList.remove("revealed");
      });
    }
  }

  function refresh() {
    ensureItemId();
    updateModuleUi();
    renderNav();
    renderMain();
  }

  function setModule(moduleId) {
    if (!MODULES[moduleId] || state.module === moduleId) return;
    state.module = moduleId;
    state.itemId = null;
    state.query = "";
    if ($search) $search.value = "";
    refresh();
  }

  function setItem(id) {
    state.itemId = id;
    renderNav();
    renderMain();
  }

  function setMode(mode) {
    state.mode = mode;
    applyModeClass();
  }

  // Events
  $nav.addEventListener("click", (e) => {
    const tab = e.target.closest(".domain-tab");
    if (!tab) return;
    setItem(tab.dataset.id);
  });

  $moduleBtns.forEach((btn) => {
    btn.addEventListener("click", () => setModule(btn.dataset.module));
  });

  $modes.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  document.getElementById("btn-expand").addEventListener("click", () => {
    if (state.mode === "collapse") {
      $main.querySelectorAll(".section").forEach((el) => {
        el.classList.add("forced-open");
      });
    } else {
      $main.querySelectorAll(".section").forEach((el) => {
        el.classList.remove("collapsed");
      });
    }
    if (state.mode === "quiz") {
      $main
        .querySelectorAll(".revealable")
        .forEach((el) => el.classList.add("revealed"));
    }
  });

  document.getElementById("btn-fold").addEventListener("click", () => {
    if (state.mode === "collapse") {
      $main.querySelectorAll(".section").forEach((el) => {
        el.classList.remove("forced-open");
      });
    } else {
      $main.querySelectorAll(".section").forEach((el) => {
        el.classList.add("collapsed");
      });
    }
    if (state.mode === "quiz") {
      $main
        .querySelectorAll(".revealable")
        .forEach((el) => el.classList.remove("revealed"));
    }
  });

  document.getElementById("btn-print").addEventListener("click", () => {
    window.print();
  });

  $main.addEventListener("click", (e) => {
    const head = e.target.closest("[data-toggle-sec]");
    if (head) {
      const sec = head.closest(".section");
      if (state.mode === "collapse") {
        sec.classList.toggle("forced-open");
      } else {
        sec.classList.toggle("collapsed");
      }
      return;
    }

    if (state.mode === "quiz") {
      const rev = e.target.closest(".revealable");
      if (rev) rev.classList.toggle("revealed");
    }
  });

  let searchTimer;
  $search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = $search.value;
      const matched = currentList().filter(matchQuery);
      if (matched.length && !matched.find((d) => d.id === state.itemId)) {
        state.itemId = matched[0].id;
      }
      renderNav();
      renderMain();
    }, 120);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;

    if (e.key === "a" || e.key === "A") {
      setModule("perf");
      return;
    }
    if (e.key === "s" || e.key === "S") {
      setModule("ka");
      return;
    }

    // 1-9 and 0 (10th) switch items in current module
    if (e.key >= "1" && e.key <= "9") {
      const idx = Number(e.key) - 1;
      const list = currentList();
      if (list[idx]) setItem(list[idx].id);
    }
    if (e.key === "0") {
      const list = currentList();
      if (list[9]) setItem(list[9].id);
    }

    if (e.key === "q" || e.key === "Q") setMode("overview");
    if (e.key === "w" || e.key === "W") setMode("collapse");
    if (e.key === "e" || e.key === "E") setMode("quiz");
  });

  // Init
  ensureItemId();
  refresh();
})();
