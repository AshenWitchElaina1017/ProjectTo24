document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const chatLog = document.getElementById('chat-log');
    const qaForm = document.getElementById('qa-form');
    const userQuestionInput = document.getElementById('user-question');
    const submitButton = document.getElementById('submit-button');
    const buttonText = submitButton.querySelector('.button-text');
    const loadingIcon = submitButton.querySelector('.loading-icon');
    const promptChips = document.querySelectorAll('.prompt-chip');
    const aiAgentSelect = document.getElementById('ai-agent-select'); // ++ 新增：获取 AI 代理选择器 ++
    const clearChatButton = document.getElementById('clear-chat-button'); // ++ 新增：获取清空按钮 ++
    // --- Helper: Function to Add Message Bubble ---
    function addMessage(sender, text, options = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        if (options.isError) {
            messageDiv.classList.add('error-message');
            // 错误消息通常不需要 Markdown 解析
            messageDiv.textContent = text;
        } else if (options.isThinking) {
            messageDiv.classList.add('thinking');
            messageDiv.id = 'thinking-indicator';
            messageDiv.textContent = text; // 思考中提示也不需要 Markdown
        } else if (sender === 'ai') {
             // +++ 使用 marked 解析 Markdown 并用 DOMPurify 清理 +++
            console.log("原始 AI 文本:", text); // +++ 新增日志 +++
            try {
                // 配置 marked (可选，例如启用 GitHub Flavored Markdown)
                 marked.setOptions({
                     gfm: true, // 启用 GFM (表格、删除线等)
                     breaks: true, // 将换行符渲染为 <br>
                     // 其他选项...
                 });
                const rawHtml = marked.parse(text);
                console.log("Marked 解析后 (清理前):", rawHtml); // +++ 新增日志 +++
                const sanitizedHtml = DOMPurify.sanitize(rawHtml);
                console.log("DOMPurify 清理后:", sanitizedHtml); // +++ 新增日志 +++
                messageDiv.innerHTML = sanitizedHtml;
            } catch (e) {
                console.error("Markdown 解析或净化失败:", e); // +++ 确保错误清晰可见 +++
                console.error("失败时的原始文本:", text); // +++ 新增日志 +++
                messageDiv.textContent = text; // 解析失败则显示原始文本
            }
             // +++++++++++++++++++++++++++++++++++++++++++++++++++++++
             // After sanitizing, find code blocks and add copy buttons
             addCopyButtons(messageDiv);
        } else {
            // 用户消息或其他普通文本
            messageDiv.textContent = text;
        }

        chatLog.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv;
    }

    // --- Helper: Function to Scroll Chat Log ---
    function scrollToBottom() {
        // 稍微延迟滚动，确保DOM更新和渲染完成
        setTimeout(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
        }, 0);
    }

    // --- Helper: Function to Add Copy Buttons to Code Blocks ---
    function addCopyButtons(messageElement) {
        const codeBlocks = messageElement.querySelectorAll('pre > code'); // More specific selector
        codeBlocks.forEach(codeBlock => {
            const preElement = codeBlock.parentElement; // Get the <pre> element
            if (!preElement) return; // Should not happen with the selector, but good practice

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-button';
            copyButton.textContent = '复制代码'; // Text for the button
            copyButton.setAttribute('aria-label', '复制代码'); // Accessibility

            // Style the button container (optional, but helps positioning)
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'code-button-container';
            buttonContainer.appendChild(copyButton);

            // Insert the button container *before* the <pre> element
            // Or append inside pre but outside code? Let's try appending to pre's parent, before pre
            if (preElement.parentNode) {
                 // Make pre relative for absolute positioning of the button inside
                 preElement.style.position = 'relative';
                 preElement.appendChild(buttonContainer); // Append inside pre seems better for styling
            }


            copyButton.addEventListener('click', () => {
                const codeToCopy = codeBlock.textContent || ""; // Get text content of <code>
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    // Visual feedback: temporarily change button text
                    copyButton.textContent = '已复制!';
                    copyButton.disabled = true; // Disable briefly
                    setTimeout(() => {
                        copyButton.textContent = '复制代码';
                        copyButton.disabled = false;
                    }, 2000); // Reset after 2 seconds
                }).catch(err => {
                    console.error('无法复制到剪贴板:', err);
                    copyButton.textContent = '复制失败';
                     setTimeout(() => {
                        copyButton.textContent = '复制代码';
                    }, 2000);
                });
            });
        });
    }

    // --- Helper: Auto-resize Textarea ---
    function autoResizeTextarea() {
        const maxHeight = 100; // 与 CSS 中的 max-height 一致
        userQuestionInput.style.height = 'auto'; // Reset height
        const scrollHeight = userQuestionInput.scrollHeight;
        // Only apply scrollHeight if less than max, otherwise cap at max
        const newHeight = Math.min(scrollHeight, maxHeight);
        userQuestionInput.style.height = newHeight + 'px';
    }

    // --- Initial AI Greeting ---
    const initialGreeting = '你好！我是二十四节气小助手，你有什么关于节气的问题想问我吗？';
    // 假设初始问候语不是 Markdown
    addMessage('ai', initialGreeting);

    // --- Event Listener for Textarea Input (for auto-resize) ---
    userQuestionInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea(); // Initial check

     // --- Event Listener for Form Submission ---
    qaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const question = userQuestionInput.value.trim();

        if (!question) {
            userQuestionInput.focus();
            return;
        }

        // Add User's message (no markdown)
        addMessage('user', question);

        // Clear input & reset height
        userQuestionInput.value = '';
        autoResizeTextarea();
        userQuestionInput.focus();

        // UI updates: disable button, show loading
        submitButton.disabled = true;
        if (buttonText) buttonText.style.display = 'none';
        if (loadingIcon) loadingIcon.style.display = 'inline-block';

        // Add thinking indicator (no markdown)
        addMessage('ai', '正在思考中...', { isThinking: true });
        let thinkingIndicator = document.getElementById('thinking-indicator');

        try {
            // ++ 获取选定的 AI 代理 ++
            const selectedAgent = aiAgentSelect ? aiAgentSelect.value : 'default'; // 如果选择器不存在，默认为 'default'

            // Send request
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ++ 在请求体中包含问题和选定的代理 ++
                body: JSON.stringify({ question: question, ai_agent: selectedAgent }),
            });
            // Remove thinking indicator *before* processing
            if (thinkingIndicator) {
                thinkingIndicator.remove();
                thinkingIndicator = null;
            }

            // Handle response
            if (!response.ok) {
                let errorMsg = `请求失败 (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || `请求出错: ${response.statusText || response.status}`;
                } catch (parseError) { /* Ignore parse error */ }
                throw new Error(errorMsg);
            }

            const data = await response.json();

            // Add AI's answer (with markdown)
            addMessage('ai', data.answer || '抱歉，我暂时无法回答这个问题。');

        } catch (error) {
            console.error('请求处理过程中出错:', error);
            if (thinkingIndicator) { thinkingIndicator.remove(); }
            // Add error message (no markdown)
            addMessage('ai', `出现错误：${error.message}`, { isError: true });

        } finally {
            // Restore button state
            submitButton.disabled = false;
            if (buttonText) buttonText.style.display = 'inline';
            if (loadingIcon) loadingIcon.style.display = 'none';
            scrollToBottom(); // Final scroll check
        }
    });

    // Allow submitting with Enter key (Shift+Enter for newline)
    userQuestionInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            qaForm.requestSubmit();
        }
    });

    // --- Event Listener for Prompt Suggestions ---
    promptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.textContent;
            userQuestionInput.value = promptText;
            userQuestionInput.focus();
            autoResizeTextarea();
        });
    });

    // --- Event Listener for Clear Chat Button ---
    if (clearChatButton) {
        clearChatButton.addEventListener('click', async () => {
            // 1. Clear the chat log visually
            chatLog.innerHTML = '';

            // 2. Add the initial greeting back
            addMessage('ai', initialGreeting);

            // 3. (Optional) Notify the backend to clear context
            try {
                const response = await fetch('/api/clear_chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Optionally send session identifier if needed by backend
                    // body: JSON.stringify({ session_id: 'your_session_id' })
                });
                if (!response.ok) {
                    console.error('Failed to clear server-side chat context:', response.statusText);
                    // Optionally inform the user slightly differently, though clearing visually is the main goal
                } else {
                    console.log('Server-side chat context cleared.');
                }
            } catch (error) {
                console.error('Error sending clear chat request:', error);
            }

             // 4. Reset input and focus (optional, but good UX)
            userQuestionInput.value = '';
            autoResizeTextarea();
            userQuestionInput.focus();
        });
    }

}); // End of DOMContentLoaded listener

