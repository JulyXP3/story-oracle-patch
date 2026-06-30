/**
 * Markdown 渲染补丁 - 为 AI 回复添加 Markdown 支持
 */
(function () {
  "use strict";

  let markedLoaded = false;

  // 动态加载 marked.js 库
  function loadMarked() {
    return new Promise((resolve, reject) => {
      if (markedLoaded && window.marked) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
      script.onload = () => {
        markedLoaded = true;
        configureMarked();
        resolve();
      };
      script.onerror = () => {
        console.error("[Markdown] 加载 marked.js 失败");
        reject(new Error("Failed to load marked.js"));
      };
      document.head.appendChild(script);
    });
  }

  // 配置 marked.js
  function configureMarked() {
    if (!window.marked) return;

    // 基础配置
    marked.setOptions({
      breaks: true, // 支持 GFM 换行（单个回车换行）
      gfm: true, // 启用 GitHub Flavored Markdown
      headerIds: false, // 不生成标题 ID
      mangle: false, // 不混淆邮箱地址
    });
  }

  // 渲染 Markdown 内容
  function renderMarkdown(text) {
    if (!window.marked || !text) return text;

    try {
      // 使用 marked 解析 Markdown
      const html = marked.parse(text);
      return html;
    } catch (e) {
      console.error("[Markdown] 渲染失败:", e);
      return text; // 渲染失败时返回原文本
    }
  }

  // 检查内容是否像 Markdown
  function looksLikeMarkdown(text) {
    if (!text) return false;

    // 检查是否包含常见的 Markdown 标记
    const markdownPatterns = [
      /^#{1,6}\s/m, // 标题
      /\*\*.*?\*\*/m, // 粗体
      /\*.*?\*/m, // 斜体
      /`.*?`/m, // 行内代码
      /```/m, // 代码块
      /^\s*[-*+]\s/m, // 无序列表
      /^\s*\d+\.\s/m, // 有序列表
      /^\s*>/m, // 引用
      /\[.*?\]\(.*?\)/m, // 链接
    ];

    return markdownPatterns.some((pattern) => pattern.test(text));
  }

  // 处理单个消息元素
  function processMessage(contentEl) {
    // 检查是否已经处理过
    if (contentEl.dataset.markdownProcessed === "true") return;
    if (!contentEl.textContent) return;

    const text = contentEl.textContent;

    // 只处理看起来像 Markdown 的内容
    if (looksLikeMarkdown(text)) {
      // **关键修改：保存原始内容到 data 属性**
      contentEl.dataset.originalContent = text;

      const html = renderMarkdown(text);
      contentEl.innerHTML = html;
      contentEl.classList.add("markdown-content");
      contentEl.dataset.markdownProcessed = "true";
    }
  }

  // 监听消息容器，自动渲染新消息
  function observeMessages() {
    const messagesEl = document.querySelector("#so-messages");
    if (!messagesEl) {
      setTimeout(observeMessages, 1000);
      return;
    }

    // 处理现有消息
    messagesEl.querySelectorAll(".so-assistant .so-content").forEach((el) => {
      processMessage(el);
    });

    // 方案1：监听新消息节点添加
    const nodeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains("so-assistant")) {
            const contentEl = node.querySelector(".so-content");
            if (contentEl) {
              // 检查是否正在流式回复
              if (contentEl.classList.contains("so-streaming")) {
                // 等待流式回复结束
                waitForStreamingEnd(contentEl);
              } else {
                // 立即处理
                processMessage(contentEl);
              }
            }
          }
        });
      });
    });

    nodeObserver.observe(messagesEl, {
      childList: true,
      subtree: true,
    });

    // 方案2：监听 class 变化（捕获流式回复结束）
    const classObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const target = mutation.target;
          // 检查是否是 so-streaming 被移除
          if (
            target.classList?.contains("so-content") &&
            !target.classList.contains("so-streaming") &&
            mutation.oldValue?.includes("so-streaming")
          ) {
            // 流式回复结束，现在可以渲染
            processMessage(target);
          }
        }
      });
    });

    classObserver.observe(messagesEl, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
      subtree: true,
    });
  }

  // 等待流式回复结束
  function waitForStreamingEnd(contentEl) {
    const checkInterval = setInterval(() => {
      if (!contentEl.classList.contains("so-streaming")) {
        clearInterval(checkInterval);
        processMessage(contentEl);
      }
    }, 1000);

    // 超时保护（30秒）
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  }

  // 添加 Markdown 样式
  function addMarkdownStyles() {
    const style = document.createElement("style");
    style.id = "markdown-render-styles";
    style.textContent = `
      /* Markdown 基础样式 */
      .markdown-content {
        line-height: 1.6;
      }

      /* 标题 */
      .markdown-content h1,
      .markdown-content h2,
      .markdown-content h3,
      .markdown-content h4,
      .markdown-content h5,
      .markdown-content h6 {
        margin: 1em 0 0.5em 0;
        font-weight: 600;
        line-height: 1.3;
      }

      .markdown-content h1 { font-size: 1.8em; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 0.3em; }
      .markdown-content h2 { font-size: 1.5em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.3em; }
      .markdown-content h3 { font-size: 1.3em; }
      .markdown-content h4 { font-size: 1.1em; }
      .markdown-content h5 { font-size: 1em; }
      .markdown-content h6 { font-size: 0.9em; opacity: 0.8; }

      /* 段落 */
      .markdown-content p {
        margin: 0.8em 0;
      }

      /* 粗体、斜体 */
      .markdown-content strong {
        font-weight: 600;
        color: #4ade80;
      }

      .markdown-content em {
        font-style: italic;
        opacity: 0.9;
      }

      /* 行内代码 */
      .markdown-content code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.9em;
        color: #fbbf24;
      }

      /* 代码块 */
      .markdown-content pre {
        background: rgba(0, 0, 0, 0.3);
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1em 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .markdown-content pre code {
        background: none;
        padding: 0;
        color: #e6e6e6;
        font-size: 0.85em;
      }

      /* 列表 */
      .markdown-content ul,
      .markdown-content ol {
        margin: 0.8em 0;
        padding-left: 2em;
      }

      .markdown-content li {
        margin: 0.3em 0;
      }

      .markdown-content ul {
        list-style-type: disc;
      }

      .markdown-content ol {
        list-style-type: decimal;
      }

      /* 引用块 */
      .markdown-content blockquote {
        margin: 1em 0;
        padding: 0.5em 1em;
        border-left: 4px solid #4ade80;
        background: rgba(74, 222, 128, 0.1);
        border-radius: 0 4px 4px 0;
      }

      .markdown-content blockquote p {
        margin: 0.5em 0;
      }

      /* 链接 */
      .markdown-content a {
        color: #60a5fa;
        text-decoration: none;
        border-bottom: 1px solid rgba(96, 165, 250, 0.3);
      }

      .markdown-content a:hover {
        color: #93c5fd;
        border-bottom-color: #93c5fd;
      }

      /* 分隔线 */
      .markdown-content hr {
        margin: 2em 0;
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      /* 表格 */
      .markdown-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }

      .markdown-content th,
      .markdown-content td {
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 12px;
        text-align: left;
      }

      .markdown-content th {
        background: rgba(255, 255, 255, 0.1);
        font-weight: 600;
      }

      .markdown-content tr:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      /* 图片 */
      .markdown-content img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1em 0;
      }
    `;
    document.head.appendChild(style);
  }

  // 初始化
  async function init() {
    try {
      // 加载 marked.js
      await loadMarked();

      // 添加样式
      addMarkdownStyles();

      // 开始监听消息
      observeMessages();

      console.log("[Markdown] ✅ Markdown 渲染已启用");
    } catch (e) {
      console.error("[Markdown] 初始化失败:", e);
    }
  }

  // 启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 暴露到全局（可选，用于调试）
  window.StoryOraclePatch = window.StoryOraclePatch || {};
  window.StoryOraclePatch.markdownEnabled = true;
  window.StoryOraclePatch.renderMarkdown = renderMarkdown;
})();
