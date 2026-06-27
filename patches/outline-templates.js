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
      'n若你在执行大纲输出任务，此为你的输出格式:\n通用大纲模板\n<plot_outline>\n\n[EXECUTION PRIORITY: MANDATORY - 按序触发以下核心节点]\n\n## 📍 当前章节\n\n章节名: ${章节标题}\n\n时间跨度: ${起始时间} - ${结束时间}\n\n核心区域: ${主要活动地点}\n\n## 🎯 必须触发事件（MUST）\n\n按相对时间排序，LLM必须在剧情中实现这些节点：\n\n| 序号 | 触发条件 | 事件描述 | 检定要求 | 分支标记 |\n|------|----------|----------|----------|----------|\n| M1 | ${相对时间或前置事件} | ${15字内核心描述} | ${检定类型或"无"} | ${成功/失败导向} |\n| M2 | ... | ... | ... | ... |\n\n（控制在5-8条以内）\n\n## 📌 建议触发事件（SHOULD）\n\n丰富剧情但非必要，可根据节奏取舍：\n\n• ${事件A}: ${触发条件} → ${10字描述}\n• ${事件B}: ...\n\n（控制在3-5条以内）\n\n## 👁️ 主视角可观察现象\n\n主角能通过感官捕获的线索，用于暗示"场外事件"：\n\n• ${现象1}: ${观察方式} → ${现象描述}\n• ${现象2}: ...\n\n## 🔒 GM专用（禁止在主视角叙事中透露）\n\n场外事件的因果逻辑，仅供理解NPC动机：\n\n> ${简要背景描述，50字以内}\n\n## ❓ 悬念钩子\n\n本章结束时应留下的未解问题：\n\n• ${悬念1}\n• ${悬念2}\n</plot_outline>',
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

    // 恢复之前的选择
    if (templates.find((t) => t.id === currentValue)) {
      select.value = currentValue;
    }
  }

  // 打开模板管理对话框
  function openTemplateManager() {
    const templates = getTemplates();

    const dialog = document.createElement("div");
    dialog.className = "so-template-manager-overlay";
    dialog.innerHTML = `
            <div class="so-template-manager">
                <div class="so-template-manager-header">
                    <h3>管理大纲模板</h3>
                    <button type="button" class="so-iconbtn" id="so-template-close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="so-template-manager-body">
                    <div class="so-template-list">
                        <div class="so-template-list-header">
                            <span>模板列表</span>
                            <button type="button" class="so-btn-secondary" id="so-template-add">
                                <i class="fa-solid fa-plus"></i> 新建
                            </button>
                        </div>
                        <div id="so-template-items"></div>
                    </div>
                    <div class="so-template-editor">
                        <div class="so-template-editor-header">
                            <input type="text" id="so-template-name" placeholder="模板名称" />
                        </div>
                        <textarea id="so-template-content" placeholder="模板内容"></textarea>
                        <div class="so-template-editor-actions">
                            <button type="button" class="so-btn-secondary" id="so-template-save">
                                <i class="fa-solid fa-floppy-disk"></i> 保存
                            </button>
                            <button type="button" class="so-btn-secondary so-btn-danger" id="so-template-delete">
                                <i class="fa-solid fa-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(dialog);

    let currentTemplateId = templates[0]?.id;

    // 渲染模板列表
    function renderTemplateList() {
      const container = dialog.querySelector("#so-template-items");
      container.innerHTML = "";

      templates.forEach((template) => {
        const item = document.createElement("div");
        item.className = "so-template-item";
        if (template.id === currentTemplateId) {
          item.classList.add("active");
        }
        item.innerHTML = `
                    <span>${template.name}</span>
                    ${template.id === "default" ? '<span class="so-template-badge">默认</span>' : ""}
                `;
        item.addEventListener("click", () => {
          currentTemplateId = template.id;
          renderTemplateList();
          loadTemplateToEditor(template);
        });
        container.appendChild(item);
      });
    }

    // 加载模板到编辑器
    function loadTemplateToEditor(template) {
      dialog.querySelector("#so-template-name").value = template.name;
      dialog.querySelector("#so-template-content").value = template.content;

      const deleteBtn = dialog.querySelector("#so-template-delete");
      deleteBtn.disabled = template.id === "default";
    }

    renderTemplateList();
    if (templates[0]) {
      loadTemplateToEditor(templates[0]);
    }

    // 关闭对话框
    dialog.querySelector("#so-template-close").addEventListener("click", () => {
      dialog.remove();
    });

    // 点击遮罩关闭
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });

    // 新建模板
    dialog.querySelector("#so-template-add").addEventListener("click", () => {
      const newTemplate = addTemplate("新模板", "");
      templates.push(newTemplate);
      currentTemplateId = newTemplate.id;
      renderTemplateList();
      loadTemplateToEditor(newTemplate);
      refreshTemplateSelector();
    });

    // 保存模板
    dialog.querySelector("#so-template-save").addEventListener("click", () => {
      const name = dialog.querySelector("#so-template-name").value.trim();
      const content = dialog.querySelector("#so-template-content").value;

      if (!name) {
        alert("请输入模板名称");
        return;
      }

      updateTemplate(currentTemplateId, { name, content });

      const template = templates.find((t) => t.id === currentTemplateId);
      if (template) {
        template.name = name;
        template.content = content;
      }

      renderTemplateList();
      refreshTemplateSelector();
      console.log("[Outline Templates] 模板已保存");
    });

    // 删除模板
    dialog
      .querySelector("#so-template-delete")
      .addEventListener("click", () => {
        if (currentTemplateId === "default") return;

        if (!confirm("确定要删除这个模板吗？")) return;

        deleteTemplate(currentTemplateId);
        const index = templates.findIndex((t) => t.id === currentTemplateId);
        if (index !== -1) {
          templates.splice(index, 1);
        }

        currentTemplateId = templates[0]?.id;
        renderTemplateList();
        if (templates[0]) {
          loadTemplateToEditor(templates[0]);
        }
        refreshTemplateSelector();
      });
  }

  // 初始化
  function initTemplateManager() {
    const manageBtn = document.getElementById("so-outline-template-manage");
    if (manageBtn) {
      manageBtn.addEventListener("click", openTemplateManager);
    }

    refreshTemplateSelector();
    console.log("[Outline Templates] 模板管理器已初始化");
  }

  window.StoryOraclePatch = window.StoryOraclePatch || {};
  window.StoryOraclePatch.initTemplateManager = initTemplateManager;
  window.StoryOraclePatch.getTemplate = getTemplate;
  window.StoryOraclePatch.getTemplates = getTemplates;
})();
