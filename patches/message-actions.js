/**
 * 消息操作模块 - 扩展原有消息按钮
 */
(function () {
  "use strict";

  // 为消息添加额外的操作按钮（隐藏楼层、注入大纲、编辑）
  function addMessageActions() {
    const win = document.getElementById("so-window");
    if (!win) return;

    const messages = win.querySelectorAll(".so-msg");
    messages.forEach((msg) => {
      const actionsBar = msg.querySelector(".so-actions");
      if (!actionsBar) return;

      // 检查是否已添加
      if (actionsBar.querySelector(".so-hide-btn")) return;

      // 在现有按钮之前插入"隐藏楼层"按钮
      const hideBtn = document.createElement("button");
      hideBtn.className = "so-msg-btn so-hide-btn";
      hideBtn.type = "button";
      hideBtn.title = "隐藏楼层";
      hideBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

      // 插入到第一个位置
      actionsBar.insertBefore(hideBtn, actionsBar.firstChild);

      // 绑定事件
      hideBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMessageHide(msg, hideBtn);
      });

      // 如果是AI消息，添加编辑按钮（在重新生成按钮后）
      if (msg.classList.contains("so-assistant")) {
        const editBtn = document.createElement("button");
        editBtn.className = "so-msg-btn so-edit-btn";
        editBtn.type = "button";
        editBtn.title = "编辑";
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';

        // 找到重新生成按钮，插入在其后
        const regenBtn = actionsBar.querySelector(".so-regen-btn");
        if (regenBtn) {
          regenBtn.parentNode.insertBefore(editBtn, regenBtn.nextSibling);
        } else {
          actionsBar.appendChild(editBtn);
        }

        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          editAssistantMessage(msg);
        });

        // 添加"注入大纲"按钮
        const injectBtn = document.createElement("button");
        injectBtn.className = "so-msg-btn so-inject-btn";
        injectBtn.type = "button";
        injectBtn.title = "注入剧情大纲";
        injectBtn.innerHTML = '<i class="fa-solid fa-file-import"></i>';

        actionsBar.insertBefore(injectBtn, actionsBar.firstChild);

        injectBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          injectOutlineFromMessage(msg);
        });
      }
    });

    // 恢复隐藏状态
    restoreHiddenStates();
  }

  // 切换消息隐藏状态
  function toggleMessageHide(msg, btn) {
    const isHidden = msg.classList.toggle("so-msg-hidden");

    // 更新按钮图标
    const icon = btn.querySelector("i");
    icon.className = isHidden ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
    btn.title = isHidden ? "显示楼层" : "隐藏楼层";

    // 保存状态
    const cid = msg.dataset.cid;
    if (cid) {
      saveHiddenState(cid, isHidden);
    }

    showToast(isHidden ? "已隐藏" : "已显示");
  }

  // 保存隐藏状态
  function saveHiddenState(cid, isHidden) {
    const key = "so_hidden_messages";
    let hiddenMessages = {};

    try {
      const stored = localStorage.getItem(key);
      if (stored) hiddenMessages = JSON.parse(stored);
    } catch (e) {}

    if (isHidden) {
      hiddenMessages[cid] = true;
    } else {
      delete hiddenMessages[cid];
    }

    try {
      localStorage.setItem(key, JSON.stringify(hiddenMessages));
    } catch (e) {}
  }

  // 恢复隐藏状态
  function restoreHiddenStates() {
    const key = "so_hidden_messages";
    let hiddenMessages = {};

    try {
      const stored = localStorage.getItem(key);
      if (stored) hiddenMessages = JSON.parse(stored);
    } catch (e) {
      return;
    }

    const messages = document.querySelectorAll(".so-msg[data-cid]");
    messages.forEach((msg) => {
      const cid = msg.dataset.cid;
      if (hiddenMessages[cid]) {
        msg.classList.add("so-msg-hidden");
        const hideBtn = msg.querySelector(".so-hide-btn");
        if (hideBtn) {
          const icon = hideBtn.querySelector("i");
          icon.className = "fa-solid fa-eye";
          hideBtn.title = "显示楼层";
        }
      }
    });
  }

  // 从消息中提取并注入剧情大纲
  function injectOutlineFromMessage(msg) {
    const content = msg.querySelector(".so-content")?.textContent || "";

    if (!content.trim()) {
      showToast("消息内容为空");
      return;
    }

    // 注入到世界书（使用Story Oracle的剧情注入逻辑）
    if (
      typeof window.StoryOraclePatch?.injectOutlineToWorldInfo === "function"
    ) {
      window.StoryOraclePatch.injectOutlineToWorldInfo(content);
    } else {
      // 简单实现：复制到剪贴板
      navigator.clipboard.writeText(content).then(() => {
        showToast("大纲已复制到剪贴板");
      });
    }
  }

  // 编辑AI消息
  function editAssistantMessage(msg) {
    const contentEl = msg.querySelector(".so-content");
    if (!contentEl) return;

    const currentText = contentEl.textContent;

    // 创建编辑区域
    const textarea = document.createElement("textarea");
    textarea.className = "so-msg-edit-area";
    textarea.value = currentText;
    textarea.style.cssText = `
            width: 100%;
            min-height: 100px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            border-radius: 8px;
            color: var(--SmartThemeBodyColor, #e6e6e6);
            font-family: inherit;
            font-size: inherit;
            line-height: 1.5;
            resize: vertical;
        `;

    // 替换内容区域
    contentEl.style.display = "none";
    contentEl.parentNode.insertBefore(textarea, contentEl);

    // 创建操作按钮
    const btnBar = document.createElement("div");
    btnBar.className = "so-msg-edit-btns";
    btnBar.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 8px;
        `;

    const saveBtn = document.createElement("button");
    saveBtn.className = "so-btn-secondary";
    saveBtn.textContent = "保存";
    saveBtn.style.padding = "6px 12px";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "so-btn-secondary";
    cancelBtn.textContent = "取消";
    cancelBtn.style.padding = "6px 12px";

    btnBar.appendChild(saveBtn);
    btnBar.appendChild(cancelBtn);
    textarea.parentNode.insertBefore(btnBar, textarea.nextSibling);

    // 聚焦并选中文本
    textarea.focus();

    // 保存按钮
    saveBtn.addEventListener("click", () => {
      contentEl.textContent = textarea.value;
      contentEl.style.display = "";
      textarea.remove();
      btnBar.remove();
      showToast("已保存修改");
    });

    // 取消按钮
    cancelBtn.addEventListener("click", () => {
      contentEl.style.display = "";
      textarea.remove();
      btnBar.remove();
    });
  }

  // 显示提示
  function showToast(message) {
    if (window.toastr) {
      window.toastr.success(message);
      return;
    }

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(74, 222, 128, 0.9);
            color: #000;
            border-radius: 8px;
            z-index: 10001;
            font-size: 14px;
        `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.3s";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  window.StoryOraclePatch = window.StoryOraclePatch || {};
  window.StoryOraclePatch.addMessageActions = function () {
    addMessageActions();
  };
})();
