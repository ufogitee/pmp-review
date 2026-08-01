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
    module: "ka",
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

  function diagramSplit(caption, visual, points, hint) {
    const lis = (points || [])
      .map((p) => `<li>${p}</li>`)
      .join("");
    return `<figure class="diagram diagram-split">
      <figcaption>${caption}</figcaption>
      ${hint ? `<p class="diagram-hint">${hint}</p>` : ""}
      <div class="diagram-split-body">
        <div class="diagram-visual">${visual}</div>
        <ul class="diagram-points">${lis}</ul>
      </div>
    </figure>`;
  }

  function diagramEqMatrix() {
    const visual = `<div class="eq-grid" role="table" aria-label="情商四象限">
      <div class="eq-spacer" aria-hidden="true"></div>
      <div class="eq-colhead">意识</div>
      <div class="eq-colhead">管理</div>
      <div class="eq-rowhead">自我</div>
      <div class="eq-cell"><strong>自我意识</strong><span>影响团队？</span></div>
      <div class="eq-cell"><strong>自我管理</strong><span>三思而后行</span></div>
      <div class="eq-rowhead">社交</div>
      <div class="eq-cell"><strong>社交意识</strong><span>同理·倾听</span></div>
      <div class="eq-cell"><strong>社交技能</strong><span>融洽·高效</span></div>
    </div>`;
    return diagramSplit(
      "图18-2 情商的组成部分",
      visual,
      [
        "上＝自我 · 下＝社交",
        "左＝意识 · 右＝管理/技能",
        "社交意识/技能利于团队与干系人",
        "部分模型第5维：动机",
      ],
      "领导力基础 · 四象限速记"
    );
  }

  function diagramStakeholderCycle() {
    const steps = ["识别", "理解", "分析", "排序", "参与", "监督"];
    const cx = 70;
    const cy = 70;
    const r = 46;
    const nodes = steps
      .map((label, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / steps.length;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `<g class="cycle-node">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14"/>
          <text x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="middle">${label}</text>
        </g>`;
      })
      .join("");
    const arrows = steps
      .map((_, i) => {
        const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / steps.length;
        const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / steps.length;
        const rr = r;
        const x1 = cx + rr * Math.cos(a0 + 0.32);
        const y1 = cy + rr * Math.sin(a0 + 0.32);
        const x2 = cx + rr * Math.cos(a1 - 0.32);
        const y2 = cy + rr * Math.sin(a1 - 0.32);
        return `<path class="cycle-arc" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rr} ${rr} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" marker-end="url(#cycle-arrow)"/>`;
      })
      .join("");
    const visual = `<svg class="cycle-svg" viewBox="0 0 140 140" role="img" aria-label="干系人参与六环">
      <defs>
        <marker id="cycle-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#0d6e6e"/>
        </marker>
      </defs>
      <circle class="cycle-ring" cx="${cx}" cy="${cy}" r="${r}"/>
      ${arrows}${nodes}
      <text class="cycle-center" x="${cx}" y="${cy + 3}" text-anchor="middle">闭环</text>
    </svg>`;
    return diagramSplit(
      "图18-1 促进干系人有效参与",
      visual,
      [
        "识别 → 理解 → 分析",
        "→ 优先级排序 → 参与 → 监督",
        "监督后再识别，持续循环",
        "正文常合写「理解和分析」",
      ],
      "六环闭环 · 手机友好缩小版"
    );
  }

  function diagramDevSpectrum() {
    const visual = `<div class="spectrum-bar" aria-hidden="true">
      <span class="seg pred">预测</span>
      <span class="seg hybrid">混合</span>
      <span class="seg adapt">适应</span>
    </div>
    <p class="spectrum-axis">迭代与增量性质逐渐增强 →</p>`;
    return diagramSplit(
      "图18-3 开发方法光谱",
      visual,
      [
        "预测（瀑布）：早期界定，严控变更",
        "混合：预测定框 + 过程可适应",
        "适应（含敏捷）：愿景 + 反馈迭代",
      ],
      "选方法看确定性与变更"
    );
  }

  function diagramIterIncr() {
    const visual = `<svg class="mini-svg" viewBox="0 0 160 100" aria-hidden="true">
      <text x="4" y="14" class="mini-label">迭代</text>
      <circle cx="28" cy="40" r="10" class="blob a"/><circle cx="48" cy="40" r="14" class="blob a"/><circle cx="72" cy="40" r="18" class="blob a"/>
      <text x="4" y="72" class="mini-label">增量</text>
      <rect x="18" y="78" width="22" height="14" class="blob b"/><rect x="44" y="78" width="22" height="14" class="blob b"/><rect x="70" y="78" width="22" height="14" class="blob b"/>
      <text x="100" y="44" class="mini-note">完善</text>
      <text x="100" y="88" class="mini-note">叠加</text>
    </svg>`;
    return diagramSplit(
      "迭代 vs 增量",
      visual,
      [
        "迭代：反复澄清、完善同一成果",
        "增量：分块增加功能，逐步完整",
        "二者都靠反馈调整；敏捷常用两者结合",
      ],
      "易混对比 · 一图分清"
    );
  }

  function diagramUncertaintyCone() {
    const visual = `<svg class="mini-svg" viewBox="0 0 160 100" aria-hidden="true">
      <polygon points="10,10 10,90 150,55 150,45" class="cone-fill"/>
      <line x1="10" y1="50" x2="150" y2="50" class="cone-mid"/>
      <text x="12" y="22" class="mini-label">宽</text>
      <text x="128" y="42" class="mini-label">窄</text>
      <text x="40" y="98" class="mini-note">时间 →</text>
    </svg>`;
    return diagramSplit(
      "图18-6 估算区间随时间收窄",
      visual,
      [
        "区间：不确定范围，越往后越窄",
        "准确度：估得对不对",
        "精确度：估得细不细（≠准确）",
        "信心：信息越多越高",
      ],
      "不确定锥 · 规划估算必背"
    );
  }

  function diagramChangeCostCurve() {
    const visual = `<svg class="mini-svg" viewBox="0 0 160 100" aria-hidden="true">
      <path d="M12 85 Q50 80 80 55 T148 12" class="cost-curve"/>
      <line x1="12" y1="90" x2="150" y2="90" class="axis"/>
      <line x1="12" y1="90" x2="12" y2="10" class="axis"/>
      <text x="14" y="14" class="mini-label">成本</text>
      <text x="118" y="98" class="mini-note">阶段 →</text>
    </svg>`;
    return diagramSplit(
      "变更/缺陷纠正成本曲线",
      visual,
      [
        "需求 → 设计 → 构建 → 测试 → 投产",
        "越晚发现/变更，纠正成本越高",
        "质量与前期投入相关",
      ],
      "交付域 · 越晚越贵"
    );
  }

  function diagramAccuracyPrecision() {
    const visual = `<svg class="mini-svg target-svg" viewBox="0 0 160 100" aria-hidden="true">
      <circle cx="80" cy="50" r="38" class="tgt-ring"/>
      <circle cx="80" cy="50" r="26" class="tgt-ring"/>
      <circle cx="80" cy="50" r="14" class="tgt-ring"/>
      <circle cx="80" cy="50" r="4" class="tgt-bull"/>
      <circle cx="108" cy="28" r="3.5" class="tgt-dart"/><circle cx="114" cy="32" r="3.5" class="tgt-dart"/>
      <circle cx="110" cy="36" r="3.5" class="tgt-dart"/><circle cx="116" cy="28" r="3.5" class="tgt-dart"/>
      <text x="4" y="14" class="mini-label">靶心=准</text>
      <text x="100" y="98" class="mini-note">扎堆=精≠准</text>
    </svg>`;
    return diagramSplit(
      "图18-7 准确度低但精确度高",
      visual,
      [
        "准确度：估得对不对，接近真值（打中靶心）",
        "精确度：估得细不细、是否一致（扎堆）",
        "可很精确却不准：小数位多或很一致，但仍偏",
      ],
      "规划估算 · 考点认图"
    );
  }

  function diagramLeadLag() {
    const visual = `<svg class="mini-svg leadlag-svg" viewBox="0 0 160 100" aria-hidden="true">
      <line x1="16" y1="70" x2="148" y2="70" class="axis"/>
      <text x="120" y="84" class="mini-note">时间 →</text>
      <circle cx="48" cy="48" r="10" class="ll-lead"/>
      <text x="28" y="30" class="mini-label">提前</text>
      <text x="22" y="96" class="mini-note">预判·可早干预</text>
      <line x1="60" y1="52" x2="100" y2="58" class="ll-arrow"/>
      <polygon points="100,54 110,58 100,62" class="ll-arrow-head"/>
      <circle cx="118" cy="58" r="10" class="ll-lag"/>
      <text x="100" y="42" class="mini-label">滞后</text>
      <text x="92" y="96" class="mini-note">事后结果</text>
    </svg>`;
    return diagramSplit(
      "提前指标 vs 滞后指标",
      visual,
      [
        "提前：预判趋势（待办量、未管理风险、在制品）→ 早干预",
        "滞后：事后结果（实际成本、进度偏差）→ 更好测",
        "二者搭配：滞后看结果，提前防恶化",
      ],
      "度量指标 · 理解认图"
    );
  }

  function diagramBurnCharts() {
    const visual = `<svg class="mini-svg burn-svg" viewBox="0 0 160 100" aria-hidden="true">
      <line x1="8" y1="48" x2="152" y2="48" class="burn-div"/>
      <text x="10" y="12" class="mini-label">燃尽 · 剩余↓</text>
      <polyline points="14,18 50,28 90,38 140,42" class="burn-down"/>
      <text x="10" y="62" class="mini-label">燃起 · 完成↑</text>
      <polyline points="14,88 50,78 90,68 140,58" class="burn-up"/>
      <text x="118" y="98" class="mini-note">时间 →</text>
    </svg>`;
    return diagramSplit(
      "燃尽图 vs 燃起图",
      visual,
      [
        "燃尽：跟踪剩余工作，曲线向下",
        "燃起：跟踪已完成工作，曲线向上",
        "斜率可反映速度；卷面认图必背",
      ],
      "度量展示 · 考点认图"
    );
  }

  function diagramTaskBoard() {
    const visual = `<div class="task-board" aria-hidden="true">
      <div class="tb-col"><span class="tb-h">待办</span><i></i><i></i><i></i></div>
      <div class="tb-col"><span class="tb-h">进行中</span><i></i><i></i></div>
      <div class="tb-col"><span class="tb-h">完成</span><i></i><i></i><i></i><i></i></div>
    </div>`;
    return diagramSplit(
      "任务板（看板）",
      visual,
      [
        "列：待办 → 进行中 → 完成（可裁剪）",
        "可视化在制品与流动；拉动式推进",
        "适应型交付 / 度量展示常一起考",
      ],
      "度量展示 · 考点认图"
    );
  }

  function diagramHtml(id) {
    if (!id) return "";
    const map = {
      "eq-matrix": diagramEqMatrix,
      "stakeholder-cycle": diagramStakeholderCycle,
      "dev-spectrum": diagramDevSpectrum,
      "iter-incr": diagramIterIncr,
      "uncertainty-cone": diagramUncertaintyCone,
      "accuracy-precision": diagramAccuracyPrecision,
      "change-cost-curve": diagramChangeCostCurve,
      "lead-lag": diagramLeadLag,
      "burn-charts": diagramBurnCharts,
      "task-board": diagramTaskBoard,
    };
    const fn = map[id];
    if (!fn) return "";
    return `<div class="diagram-wrap revealable">${fn()}</div>`;
  }

  function sectionHtml(section, idx) {
    const ids = section.diagrams || (section.diagram ? [section.diagram] : []);
    const diagrams = ids.map(diagramHtml).join("");
    const blocks = (section.blocks || []).map(blockHtml).join("");
    return `<section class="section" data-sec="${idx}">
      <button type="button" class="section-head" data-toggle-sec="${idx}">
        <span>${highlight(section.title)}</span>
        <span class="chev">▼</span>
      </button>
      <div class="section-body">${diagrams}${blocks}</div>
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

  const CIRCLES = "①②③④⑤⑥⑦⑧⑨⑩";

  function pairsHtml(pairs, lead) {
    const leadHtml = lead
      ? `<p class="pair-lead">${highlight(lead)}</p>`
      : "";
    return `<div class="pair-list">
      <h3 class="box-title pair-heading">预期目标 ↔ 效果检查 <span class="badge">对照背</span></h3>
      ${leadHtml}
      <div class="pair-table-head" aria-hidden="true">
        <span>预期目标</span>
        <span></span>
        <span>效果检查</span>
      </div>
      ${pairs
        .map((p, i) => {
          const mark = CIRCLES[i] || `${i + 1}.`;
          const checks = (p.checks || [])
            .map(
              (c) =>
                `<li><span class="ck-label">${highlight(c.label)}</span><span class="ck-desc">${highlight(c.desc)}</span></li>`
            )
            .join("");
          return `<article class="pair-card revealable">
            <div class="pair-goal">
              <span class="pair-no">${mark}</span>
              <span class="pair-goal-text">${highlight(p.goal)}</span>
            </div>
            <div class="pair-arrow" aria-hidden="true">→</div>
            <ul class="pair-checks">${checks}</ul>
          </article>`;
        })
        .join("")}
    </div>`;
  }

  function dualBoxHtml(item, cfg) {
    const goals = (item.goals || []).map(goalItemHtml).join("");
    const checks = (item.checks || [])
      .map(
        (c) =>
          `<li><span class="ck-label">${highlight(c.label)}</span><span class="ck-desc">${highlight(c.desc)}</span></li>`
      )
      .join("");
    return `<div class="grid-2">
      <div class="box goals">
        <h3 class="box-title">${cfg.boxLeft.title} <span class="badge">${cfg.boxLeft.badge}</span></h3>
        <ul class="goal-list revealable">${goals}</ul>
      </div>
      <div class="box checks">
        <h3 class="box-title">${cfg.boxRight.title} <span class="badge">${cfg.boxRight.badge}</span></h3>
        <ul class="check-list revealable">${checks}</ul>
      </div>
    </div>`;
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
    const usePairs =
      state.module === "perf" && item.pairs && item.pairs.length;
    const topBlock = usePairs
      ? pairsHtml(item.pairs, item.pairsLead)
      : dualBoxHtml(item, cfg);
    const sections = (item.sections || [])
      .map((s, i) => sectionHtml(s, i))
      .join("");

    $main.innerHTML = `
      <header class="domain-head">
        <h2>${highlight(item.name)}</h2>
        <span class="en">${escapeHtml(item.en || "")}</span>
        <p class="tip">${highlight(item.tip || "")}</p>
      </header>
      ${topBlock}
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
