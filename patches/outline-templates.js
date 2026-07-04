/**
 * 大纲模板管理模块
 */
(function () {
  "use strict";

  const STORAGE_KEY = "so_outline_templates";
  const DEFAULT_TEMPLATE = {
    id: "default",
    name: "默认模板",
    content:
      '\n若你在执行大纲输出任务，此为你的输出格式:\n通用大纲模板\n<plot_outline>\n\n[EXECUTION PRIORITY: MANDATORY - 按序触发以下核心节点]\n\n## 📍 当前章节\n\n章节名: ${章节标题}\n\n时间跨度: ${起始时间} - ${结束时间}\n\n核心区域: ${主要活动地点}\n\n## 🎯 必须触发事件（MUST）\n\n按相对时间排序，LLM必须在剧情中实现这些节点：\n\n| 序号 | 触发条件 | 事件描述 | 检定要求 | 分支标记 |\n|------|----------|----------|----------|----------|\n| M1 | ${相对时间或前置事件} | ${15字内核心描述} | ${检定类型或"无"} | ${成功/失败导向} |\n| M2 | ... | ... | ... | ... |\n\n（控制在5-8条以内）\n\n## 📌 建议触发事件（SHOULD）\n\n丰富剧情但非必要，可根据节奏取舍：\n\n• ${事件A}: ${触发条件} → ${10字描述}\n• ${事件B}: ...\n\n（控制在3-5条以内）\n\n## 👁️ 主视角可观察现象\n\n主角能通过感官捕获的线索，用于暗示"场外事件"：\n\n• ${现象1}: ${观察方式} → ${现象描述}\n• ${现象2}: ...\n\n## 🔒 GM专用（禁止在主视角叙事中透露）\n\n场外事件的因果逻辑，仅供理解NPC动机：\n\n> ${简要背景描述，50字以内}\n\n## ❓ 悬念钩子\n\n本章结束时应留下的未解问题：\n\n• ${悬念1}\n• ${悬念2}\n</plot_outline>',
  };

  // 获取所有模板
  function getTemplates() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const templates = stored ? JSON.parse(stored) : [];
      // 确保默认模板始终存在
      if (!templates.find((t) => t.id === "default")) {
        templates.unshift(DEFAULT_TEMPLATE);
      }
      return templates;
    } catch (e) {
      console.error("[Outline Templates] 加载失败:", e);
      return [DEFAULT_TEMPLATE];
    }
  }

  // 保存模板
  function saveTemplates(templates) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch (e) {
      console.error("[Outline Templates] 保存失败:", e);
      return false;
    }
  }

  // 添加模板
  function addTemplate(name, content) {
    const templates = getTemplates();
    const newTemplate = {
      id: "template_" + Date.now(),
      name: name || "新模板",
      content: content || "",
    };
    templates.push(newTemplate);
    saveTemplates(templates);
    return newTemplate;
  }

  // 更新模板
  function updateTemplate(id, updates) {
    const templates = getTemplates();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return false;

    templates[index] = { ...templates[index], ...updates };
    return saveTemplates(templates);
  }

  // 删除模板
  function deleteTemplate(id) {
    if (id === "default") return false; // 不允许删除默认模板

    const templates = getTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    return saveTemplates(filtered);
  }

  // 获取单个模板
  function getTemplate(id) {
    const templates = getTemplates();
    return templates.find((t) => t.id === id);
  }

  // 保存模板选择的处理函数（避免重复创建）
  const handleTemplateChange = (e) => {
    localStorage.setItem("so_outline_template_selected", e.target.value);
  };

  // 刷新模板选择器
  function refreshTemplateSelector() {
    const select = document.getElementById("so-outline-template-select");
    if (!select) return;

    const currentValue = select.value;
    const templates = getTemplates();

    select.innerHTML = "";
    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      select.appendChild(option);
    });

    // 恢复之前的选择（优先使用保存的选择）
    const savedSelection = localStorage.getItem("so_outline_template_selected");
    if (savedSelection && templates.find((t) => t.id === savedSelection)) {
      select.value = savedSelection;
    } else if (templates.find((t) => t.id === currentValue)) {
      select.value = currentValue;
    }

    // 监听选择变化并保存（先移除旧的，再添加新的）
    if (!select.dataset.listenerAdded) {
      select.removeEventListener("change", handleTemplateChange);
      select.addEventListener("change", handleTemplateChange);
      select.dataset.listenerAdded = "true";
    }
  }

  // 渲染内联模板管理面板（#so-outline-template-form），参照参谋「新建弧线」的展开/收起模式。
  // 不再弹出全屏对话框，手机上贴合 #so-outline-bar 宽度、不超出屏幕。
  function renderTemplateForm() {
    const form = document.getElementById("so-outline-template-form");
    if (!form) return;

    // 每次展开都重读 localStorage，确保编辑期间外部变化不丢失，同时保持事件闭包引用同一份数组。
    form._templates = getTemplates();
    const templates = form._templates;

    // 首次渲染：填充 HTML + 绑定事件（只绑一次）
    if (!form.dataset.rendered) {
      form.innerHTML = `
        <label class="so-field">
          <span>选择模板</span>
          <select id="so-template-edit-select"></select>
        </label>
        <label class="so-field">
          <span>模板名称</span>
          <input type="text" id="so-template-edit-name" placeholder="模板名称">
        </label>
        <label class="so-field">
          <span>模板内容</span>
          <textarea id="so-template-edit-content" rows="8" placeholder="模板内容"></textarea>
        </label>
        <div class="so-outline-template-actions">
          <button type="button" class="so-fix-run-btn" id="so-template-edit-new">
            <i class="fa-solid fa-plus"></i> 新建
          </button>
          <button type="button" class="so-fix-run-btn" id="so-template-edit-save">
            <i class="fa-solid fa-floppy-disk"></i> 保存
          </button>
          <button type="button" class="so-fix-run-btn so-btn-danger" id="so-template-edit-delete">
            <i class="fa-solid fa-trash"></i> 删除
          </button>
        </div>
      `;
      form.dataset.rendered = "true";

      // 绑定事件（只绑一次，通过 form._templates 读写数据）
      const selectEl = form.querySelector("#so-template-edit-select");
      const nameEl = form.querySelector("#so-template-edit-name");
      const contentEl = form.querySelector("#so-template-edit-content");

      // 切换模板 → 加载到编辑器
      selectEl.addEventListener("change", () => {
        const arr = form._templates || [];
        const t = arr.find((t) => t.id === selectEl.value);
        if (t) {
          nameEl.value = t.name;
          contentEl.value = t.content;
          form.querySelector("#so-template-edit-delete").disabled = t.id === "default";
        }
      });

      // 新建
      form.querySelector("#so-template-edit-new").addEventListener("click", () => {
        const arr = form._templates || [];
        const newTpl = addTemplate("新模板", "");
        arr.push(newTpl);
        populateTemplateSelect(selectEl, arr, newTpl.id);
        nameEl.value = newTpl.name;
        contentEl.value = newTpl.content;
        form.querySelector("#so-template-edit-delete").disabled = true;
        refreshTemplateSelector();
      });

      // 保存
      form.querySelector("#so-template-edit-save").addEventListener("click", () => {
        const id = selectEl.value;
        const name = nameEl.value.trim();
        const content = contentEl.value;
        if (!name) {
          alert("请输入模板名称");
          return;
        }
        updateTemplate(id, { name, content });
        const arr = form._templates || [];
        const t = arr.find((t) => t.id === id);
        if (t) { t.name = name; t.content = content; }
        populateTemplateSelect(selectEl, arr, id);
        refreshTemplateSelector();
      });

      // 删除
      form.querySelector("#so-template-edit-delete").addEventListener("click", () => {
        const id = selectEl.value;
        if (id === "default") return;
        if (!confirm("确定要删除这个模板吗？")) return;
        deleteTemplate(id);
        const arr = form._templates || [];
        const idx = arr.findIndex((t) => t.id === id);
        if (idx !== -1) arr.splice(idx, 1);
        const nextId = arr[0]?.id;
        populateTemplateSelect(selectEl, arr, nextId);
        const t = arr.find((t) => t.id === nextId);
        if (t) {
          nameEl.value = t.name;
          contentEl.value = t.content;
        }
        form.querySelector("#so-template-edit-delete").disabled = (nextId === "default");
        refreshTemplateSelector();
      });
    }

    // 每次展开：刷新下拉列表 + 编辑器内容
    const selectEl = form.querySelector("#so-template-edit-select");
    const currentSelected = document.getElementById("so-outline-template-select")?.value || "default";
    const targetId = templates.find((t) => t.id === currentSelected)
      ? currentSelected
      : (templates[0]?.id || "default");
    populateTemplateSelect(selectEl, templates, targetId);
    const t = templates.find((t) => t.id === targetId);
    if (t) {
      form.querySelector("#so-template-edit-name").value = t.name;
      form.querySelector("#so-template-edit-content").value = t.content;
      form.querySelector("#so-template-edit-delete").disabled = t.id === "default";
    }
  }

  // 填充模板选择下拉框
  function populateTemplateSelect(selectEl, templates, selectedId) {
    selectEl.innerHTML = "";
    templates.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name + (t.id === "default" ? "（默认）" : "");
      selectEl.appendChild(opt);
    });
    if (selectedId && templates.find((t) => t.id === selectedId)) {
      selectEl.value = selectedId;
    }
  }

  // 初始化
  function initTemplateManager() {
    const manageBtn = document.getElementById("so-outline-template-manage");
    const form = document.getElementById("so-outline-template-form");
    if (!manageBtn || !form) return;

    // 点击按钮：切换展开/收起（参照 so-arc-new 的 toggle 行为）
    manageBtn.addEventListener("click", () => {
      const isOpen = form.style.display === "flex";
      if (isOpen) {
        form.style.display = "none";
      } else {
        renderTemplateForm();
        form.style.display = "flex";
      }
    });

    refreshTemplateSelector();
    console.log("[Outline Templates] 模板管理器已初始化（内联展开模式）");
  }

  window.StoryOraclePatch = window.StoryOraclePatch || {};
  window.StoryOraclePatch.initTemplateManager = initTemplateManager;
  window.StoryOraclePatch.getTemplate = getTemplate;
  window.StoryOraclePatch.getTemplates = getTemplates;
})();
