(function () {
  const domains = window.DOMAIN_DATA;
  const state = {
    domainId: domains[0].id,
    mode: "overview", // overview | collapse | quiz
    query: "",
  };

  const $nav = document.getElementById("domain-nav");
  const $main = document.getElementById("main");
  const $modes = document.querySelectorAll("[data-mode]");
  const $search = document.getElementById("search");
  const $mnemonic = document.getElementById("mnemonic");

  if ($mnemonic) $mnemonic.textContent = window.MNEMONIC || "";

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

  function matchQuery(domain) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    const blob = JSON.stringify(domain).toLowerCase();
    return blob.includes(q);
  }

  function renderNav() {
    $nav.innerHTML = domains
      .map((d) => {
        const active = d.id === state.domainId ? " active" : "";
        const hidden = matchQuery(d) ? "" : " hidden-by-search";
        return `<button type="button" class="domain-tab${active}${hidden}" data-id="${d.id}" title="${escapeHtml(d.name)}">
          <span class="short">${escapeHtml(d.short)}</span>
          <span class="full">${escapeHtml(d.name.replace("绩效域", "").replace("与生命周期", ""))}</span>
        </button>`;
      })
      .join("");
  }

  function tagsHtml(tags) {
    if (!tags || !tags.length) return "";
    return `<div class="tags">${tags
      .map((t) => `<span class="tag">${highlight(t)}</span>`)
      .join("")}</div>`;
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

  function renderMain() {
    const domain = domains.find((d) => d.id === state.domainId) || domains[0];

    const goals = domain.goals
      .map((g) => `<li>${highlight(g)}</li>`)
      .join("");

    const checks = domain.checks
      .map(
        (c) =>
          `<li><span class="ck-label">${highlight(c.label)}</span><span class="ck-desc">${highlight(c.desc)}</span></li>`
      )
      .join("");

    const sections = (domain.sections || [])
      .map((s, i) => sectionHtml(s, i))
      .join("");

    $main.innerHTML = `
      <header class="domain-head">
        <h2>${highlight(domain.name)}</h2>
        <span class="en">${escapeHtml(domain.en)}</span>
        <p class="tip">${highlight(domain.tip)}</p>
      </header>
      <div class="grid-2">
        <div class="box goals">
          <h3 class="box-title">预期目标 <span class="badge">必背</span></h3>
          <ul class="goal-list revealable">${goals}</ul>
        </div>
        <div class="box checks">
          <h3 class="box-title">效果检查 <span class="badge">怎么验</span></h3>
          <ul class="check-list revealable">${checks}</ul>
        </div>
      </div>
      ${sections}
    `;

    applyModeClass();
  }

  function applyModeClass() {
    document.body.classList.remove("mode-overview", "mode-collapse", "mode-quiz");
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

  function setDomain(id) {
    state.domainId = id;
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
    setDomain(tab.dataset.id);
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
      $main.querySelectorAll(".revealable").forEach((el) => el.classList.add("revealed"));
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
      $main.querySelectorAll(".revealable").forEach((el) => el.classList.remove("revealed"));
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
      const matched = domains.filter(matchQuery);
      if (matched.length && !matched.find((d) => d.id === state.domainId)) {
        state.domainId = matched[0].id;
      }
      renderNav();
      renderMain();
    }, 120);
  });

  // Keyboard: 1-8 switch domain, Q/W/E modes
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.key >= "1" && e.key <= "8") {
      const idx = Number(e.key) - 1;
      if (domains[idx]) setDomain(domains[idx].id);
    }
    if (e.key === "q" || e.key === "Q") setMode("overview");
    if (e.key === "w" || e.key === "W") setMode("collapse");
    if (e.key === "e" || e.key === "E") setMode("quiz");
  });

  // Init
  renderNav();
  renderMain();
})();
