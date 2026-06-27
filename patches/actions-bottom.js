/**
 * 消息操作按钮移至底部 - 覆盖原始实现
 */
(function () {
    'use strict';

    let originalAddMessage = null;

    function hookAddMessage() {
        try {
            // 查找原始的 addMessage 函数
            const scriptContent = document.querySelector('script[src*="index.js"]');
            if (!scriptContent) {
                console.warn('[Story Oracle Patch] 未找到 index.js');
                return false;
            }

            // 由于无法直接访问函数，我们通过修改DOM结构来实现
            // 监听消息添加，然后重新排列DOM
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('so-msg')) {
                            moveActionsToBottom(node);
                        }
                    });
                });
            });

            const messagesEl = document.querySelector('#so-messages');
            if (messagesEl) {
                observer.observe(messagesEl, { childList: true });

                // 处理已存在的消息
                document.querySelectorAll('.so-msg').forEach(moveActionsToBottom);

                console.log('[Story Oracle Patch] 消息监听器已安装');
                return true;
            }

            return false;
        } catch (e) {
            console.error('[Story Oracle Patch] 钩子安装失败:', e);
            return false;
        }
    }

    function moveActionsToBottom(msgElement) {
        const bubble = msgElement.querySelector('.so-bubble');
        const actions = msgElement.querySelector('.so-actions');
        const content = msgElement.querySelector('.so-content');

        if (!bubble || !actions || !content) return;
        if (actions.hasAttribute('data-moved')) return;

        // 将 actions 从 so-role 中移出，放到 bubble 的最后
        actions.remove();
        bubble.appendChild(actions);
        actions.setAttribute('data-moved', 'true');
    }

    function addStyles() {
        const style = document.createElement('style');
        style.id = 'so-actions-bottom-styles';
        style.textContent = `
            /* 调整按钮样式 */
            .so-bubble > .so-actions {
                display: flex;
                gap: 4px;
                justify-content: flex-end;
                margin-top: 8px;
                opacity: 1 !important;
            }

            /* 移除原来 so-role 中的样式 */
            .so-role {
                justify-content: flex-start !important;
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        console.log('[Story Oracle Patch] 操作按钮底部模块初始化中...');

        addStyles();

        // 等待一段时间后再安装钩子，确保 Story Oracle 已加载
        setTimeout(() => {
            hookAddMessage();
        }, 1000);

        console.log('[Story Oracle Patch] 操作按钮底部模块初始化成功');
    }

    window.StoryOraclePatch = window.StoryOraclePatch || {};
    window.StoryOraclePatch.initActionsBottom = init;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
