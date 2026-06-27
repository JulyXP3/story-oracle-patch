/**
 * 大纲模式 - 消息折叠模块（手动折叠）
 */
(function () {
  "use strict";

  function isOutlineMode() {
    const win = document.getElementById("so-window");
    return win?.classList.contains("so-outline-on");
  }

  function addCollapseButton() {
    if (!isOutlineMode()) {
      console.log("[Story Oracle Patch] 不在大纲模式，跳过添加折叠按钮");
      return;
    }

    const messages = document.querySelectorAll(
      "#so-messages .so-msg.so-assistant",
    );
    console.log(`[Story Oracle Patch] 找到 ${messages.length} 条AI消息`);

    messages.forEach((msg, index) => {
      const actionsBar = msg.querySelector(".so-actions");
      if (!actionsBar) {
        console.log(`[Story Oracle Patch] 消息 ${index} 没有 .so-actions`);
        return;
      }

      // 检查是否已添加折叠按钮
      if (actionsBar.querySelector(".so-collapse-btn")) {
        return;
      }

      console.log(`[Story Oracle Patch] 为消息 ${index} 添加折叠按钮`);

      // 创建折叠按钮
      const collapseBtn = document.createElement("button");
      collapseBtn.className = "so-msg-btn so-collapse-btn";
      collapseBtn.title = "折叠/展开";
      collapseBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
      collapseBtn.addEventListener("click", () =>
        toggleCollapse(msg, collapseBtn),
      );

      // 添加到操作栏
      actionsBar.appendChild(collapseBtn);
      console.log(`[Story Oracle Patch] 折叠按钮添加完成`);
    });
  }

  function toggleCollapse(msg, btn) {
    const contentEl = msg.querySelector(".so-content");
    if (!contentEl) return;

    const isCollapsed = msg.hasAttribute("data-collapsed");

    if (isCollapsed) {
      // 展开
      const wrapper = contentEl.querySelector(".so-outline-collapse");
      if (wrapper) {
        const body = wrapper.querySelector(".so-outline-body");
        if (body) {
          contentEl.innerHTML = body.innerHTML;
        }
      }
      msg.removeAttribute("data-collapsed");
      btn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
      btn.title = "折叠";
    } else {
      // 折叠
      const content = contentEl.innerHTML;

      const wrapper = document.createElement("details");
      wrapper.className = "so-outline-collapse";

      const summary = document.createElement("summary");
      summary.className = "so-outline-summary";
      summary.innerHTML =
        '<span class="so-outline-badge">折叠内容</span><span class="so-outline-label">PLOT_OUTLINE</span>';

      const body = document.createElement("div");
      body.className = "so-outline-body";
      body.innerHTML = content;

      wrapper.appendChild(summary);
      wrapper.appendChild(body);

      contentEl.innerHTML = "";
      contentEl.appendChild(wrapper);

      msg.setAttribute("data-collapsed", "true");
      btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
      btn.title = "展开";
    }
  }

  function addStyles() {
    const style = document.createElement("style");
    style.id = "so-outline-collapse-styles";
    style.textContent = `
      /* 大纲折叠容器 */
      .so-outline-collapse {
        margin: 0;
        padding: 0;
      }

      /* 折叠摘要（点击展开/收起） */
      .so-outline-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(74, 222, 128, 0.15);
        border: 1px solid rgba(74, 222, 128, 0.3);
        border-radius: 8px;
        cursor: pointer;
        list-style: none;
        transition: all 0.2s;
      }

      .so-outline-summary::-webkit-details-marker {
        display: none;
      }

      .so-outline-summary::before {
        content: '›';
        display: inline-block;
        font-size: 1.2em;
        color: var(--so-outline-accent, #4ade80);
        transition: transform 0.2s;
        font-weight: bold;
      }

      .so-outline-collapse[open] .so-outline-summary::before {
        transform: rotate(90deg);
      }

      .so-outline-summary:hover {
        background: rgba(74, 222, 128, 0.2);
        border-color: rgba(74, 222, 128, 0.5);
      }

      /* 思维链标签 */
      .so-outline-badge {
        padding: 2px 8px;
        background: rgba(74, 222, 128, 0.25);
        border-radius: 4px;
        font-size: 0.85em;
        color: var(--so-outline-accent, #4ade80);
        font-weight: 500;
      }

      /* PLOT_OUTLINE 文本 */
      .so-outline-label {
        font-size: 0.85em;
        color: var(--SmartThemeBodyColor, #e6e6e6);
        opacity: 0.7;
        font-family: 'Consolas', monospace;
      }

      /* 折叠内容 */
      .so-outline-body {
        margin-top: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        border-left: 3px solid var(--so-outline-accent, #4ade80);
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    console.log("[Story Oracle Patch] 消息折叠模块初始化中...");

    addStyles();

    // 定期检查并添加折叠按钮
    setInterval(() => {
      addCollapseButton();
    }, 1000);

    console.log("[Story Oracle Patch] 消息折叠模块初始化成功");
  }

  window.StoryOraclePatch = window.StoryOraclePatch || {};
  window.StoryOraclePatch.initOutlineCollapse = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
