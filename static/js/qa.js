document.addEventListener('DOMContentLoaded', () => {
    // --- 获取 DOM 元素 ---
    const chatLog = document.getElementById('chat-log');
    const qaForm = document.getElementById('qa-form');
    const userQuestionInput = document.getElementById('user-question');
    const submitButton = document.getElementById('submit-button');
    const buttonText = submitButton.querySelector('.button-text');
    const loadingIcon = submitButton.querySelector('.loading-icon');
    const promptChips = document.querySelectorAll('.prompt-chip');
    const aiAgentSelect = document.getElementById('ai-agent-select'); // ++ 新增：获取 AI 代理选择器 ++
    const clearChatButton = document.getElementById('clear-chat-button'); // ++ 新增：获取清空按钮 ++
    let currentInteractiveAudio = null; // ++ 新增：保存当前播放的互动语音实例 ++

    // --- 辅助函数：播放互动音频（带中断逻辑）---
    function playAudio(filePath) {
        // 如果有音频正在播放，则停止它
        if (currentInteractiveAudio && !currentInteractiveAudio.paused) {
            currentInteractiveAudio.pause();
            currentInteractiveAudio.currentTime = 0; // 重置播放位置
        }

        // 创建新的音频实例并播放
        const newAudio = new Audio(filePath);
        newAudio.play().catch(error => {
            console.error(`无法播放音频 "${filePath}":`, error);
        });

        // 更新当前播放的音频实例引用
        currentInteractiveAudio = newAudio;
    }

    // --- 辅助函数：添加消息气泡 ---
    function addMessage(sender, text, options = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        if (options.isError) {
            messageDiv.classList.add('error-message');
            messageDiv.textContent = text;
        } else if (options.isThinking) {
            messageDiv.classList.add('thinking');
            messageDiv.id = 'thinking-indicator';
            messageDiv.textContent = text;
        } else if (options.isStreaming) { // ++ 新增：处理初始流式消息 ++
            messageDiv.classList.add('streaming'); // 添加标记类，用于标识正在流式输出
            messageDiv.id = 'streaming-ai-message'; // 给它一个 ID 以便查找和更新
            messageDiv.innerHTML = ''; // 初始为空，内容将通过流更新
        } else if (sender === 'ai') {
             // 处理非流式、完整的 AI 消息
            try {
                 marked.setOptions({ gfm: true, breaks: true });
                 const rawHtml = marked.parse(text);
                 const sanitizedHtml = DOMPurify.sanitize(rawHtml);
                 messageDiv.innerHTML = sanitizedHtml;
            } catch (e) {
                console.error("Markdown 解析或净化失败:", e);
                messageDiv.textContent = text; // Fallback
            }
            // 为完整的 AI 消息添加复制按钮
            addCopyButtons(messageDiv);
        } else {
            // 用户消息
            messageDiv.textContent = text;
        }

        chatLog.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv; // 返回创建的元素，以便流式更新时引用
    }

    // --- 辅助函数：滚动聊天记录 ---
    function scrollToBottom() {
        // 稍微延迟滚动，确保DOM更新和渲染完成
        setTimeout(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
        }, 0);
    }

    // --- 辅助函数：为代码块添加复制按钮 ---
    function addCopyButtons(messageElement) {
        const codeBlocks = messageElement.querySelectorAll('pre > code'); // 更具体的选择器
        codeBlocks.forEach(codeBlock => {
            const preElement = codeBlock.parentElement; // 获取 <pre> 元素
            if (!preElement) return; // 使用此选择器不应发生，但这是好习惯

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-button';
            copyButton.textContent = '复制代码'; // 按钮文本
            copyButton.setAttribute('aria-label', '复制代码'); // 可访问性

            // 设置按钮容器样式（可选，但有助于定位）
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'code-button-container';
            buttonContainer.appendChild(copyButton);

            // 将按钮容器插入到 <pre> 元素 *之前*
            // 或者附加在 pre 内部但在 code 外部？ 尝试附加到 pre 的父元素，在 pre 之前
            if (preElement.parentNode) {
                 // 使 pre 相对定位，以便内部按钮绝对定位
                 preElement.style.position = 'relative';
                 preElement.appendChild(buttonContainer); // 附加到 pre 内部似乎更便于样式设置
            }


            copyButton.addEventListener('click', () => {
                const codeToCopy = codeBlock.textContent || ""; // 获取 <code> 的文本内容
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    // 视觉反馈：临时更改按钮文本
                    copyButton.textContent = '已复制!';
                    copyButton.disabled = true; // 短暂禁用
                    setTimeout(() => {
                        copyButton.textContent = '复制代码';
                        copyButton.disabled = false;
                    }, 2000); // 2 秒后重置
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

    // --- 辅助函数：自动调整 Textarea 大小 ---
    function autoResizeTextarea() {
        const maxHeight = 100; // 与 CSS 中的 max-height 一致
        userQuestionInput.style.height = 'auto'; // 重置高度
        const scrollHeight = userQuestionInput.scrollHeight;
        // 仅当 scrollHeight 小于最大值时应用，否则限制为最大值
        const newHeight = Math.min(scrollHeight, maxHeight);
        userQuestionInput.style.height = newHeight + 'px';
    }

    // --- 初始 AI 问候语 ---
    const initialGreeting = '你好！我是二十四节气小助手，你有什么关于节气的问题想问我吗？';
    // 假设初始问候语不是 Markdown
    addMessage('ai', initialGreeting);
    // ++ 修改：仅在顶层窗口（非 iframe）播放初始问候语音 ++
    if (window.self === window.top) {
        playAudio('/static/audio/你好！我是二十四节气小助手，你有什么关于节气的问题想问我吗？.wav');
    }

    // --- Textarea 输入事件监听器（用于自动调整大小）---
    userQuestionInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea(); // 初始检查

     // --- 表单提交事件监听器 ---
     qaForm.addEventListener('submit', async (event) => {
         let thinkingIndicator = null; // ++ 声明变量在函数作用域顶部 ++
         event.preventDefault();
        const question = userQuestionInput.value.trim();

        if (!question) {
            userQuestionInput.focus();
            return;
        }

        // 添加用户消息
        addMessage('user', question);

        // 清除输入并重置高度
        userQuestionInput.value = '';
        autoResizeTextarea();
        userQuestionInput.focus();

        // UI 更新：禁用按钮，显示加载中
        submitButton.disabled = true;
        if (buttonText) buttonText.style.display = 'none';
        if (loadingIcon) loadingIcon.style.display = 'inline-block';

        // 移除可能存在的旧的思考指示器或流式消息
        const oldThinkingIndicator = document.getElementById('thinking-indicator'); // ++ 使用不同的变量名查找旧的 ++
        if (oldThinkingIndicator) oldThinkingIndicator.remove();
        let existingStreamingMessage = document.getElementById('streaming-ai-message');
        if (existingStreamingMessage) existingStreamingMessage.remove();

        // ++ 新增：添加“正在思考中”提示 ++
        thinkingIndicator = addMessage('ai', '正在思考中...', { isThinking: true }); // ++ 赋值给已声明的变量 ++
        playAudio('/static/audio/让我想一想....wav'); // ++ 新增：播放思考中语音 ++


        // ++ 创建一个空的 AI 消息气泡用于流式更新 (将在 fetch 成功后使用) ++
        let aiMessageDiv; // 延迟创建
        let typingContentSpan; // 延迟创建 span
        let accumulatedAnswer = ''; // 用于累积 AI 回答
        let characterQueue = []; // 存储待打字的字符
        let typewriterIntervalId = null;
        const typingSpeed = 1; // 打字速度 (毫秒/字符)，可调整
        let isTyping = false;

        // --- 打字机效果函数 ---
        function processTypewriterQueue() {
            if (characterQueue.length === 0) {
                clearInterval(typewriterIntervalId);
                typewriterIntervalId = null;
                isTyping = false;
                // 检查流是否真的结束了，如果结束了，在这里触发最终渲染可能更及时
                // 但现在我们依赖外面的 'done' 逻辑来做最终渲染
                return;
            }
            const char = characterQueue.shift();
            typingContentSpan.textContent += char; // 追加字符
            scrollToBottom(); // 每次追加都滚动
        }

        function startTypewriter() {
            if (!isTyping && characterQueue.length > 0) {
                isTyping = true;
                if (typewriterIntervalId) clearInterval(typewriterIntervalId); // 清除旧的（理论上不应有）
                typewriterIntervalId = setInterval(processTypewriterQueue, typingSpeed);
            }
        }
        // --- 结束打字机效果函数 ---

        try {
            const selectedAgent = aiAgentSelect ? aiAgentSelect.value : 'default';
            // +++ 新增：获取选定的模式 +++
            const selectedModeInput = document.querySelector('input[name="chat_mode"]:checked');
            const selectedMode = selectedModeInput ? selectedModeInput.value : 'chat'; // 默认为 'chat'
            // ++++++++++++++++++++++++++

            // ++ 修改：发送请求并处理流式响应 ++
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream' // 明确要求 SSE
                },
                // +++ 修改：在请求体中包含模式 +++
                body: JSON.stringify({ question: question, ai_agent: selectedAgent, mode: selectedMode }),
            });

            // 检查初始响应是否 OK 且有 body
            if (!response.ok || !response.body) {
                let errorMsg = `请求失败 (${response.status})`;
                try {
                     // 尝试从非流式响应中读取错误信息
                    const errorData = await response.json();
                    errorMsg = errorData.error || `请求出错: ${response.statusText || response.status}`;
                } catch (parseError) {
                    errorMsg = `请求出错: ${response.statusText || response.status}. 无法解析错误详情。`;
                }
                 // 更新流式气泡为错误信息
                 aiMessageDiv.textContent = errorMsg;
                 aiMessageDiv.classList.add('error-message');
                 aiMessageDiv.classList.remove('streaming');
                 throw new Error(errorMsg); // 抛出错误以进入 catch 块
            }

            // ++ 新增：如果请求成功，移除“正在思考中”提示，并创建流式气泡 ++
            if (thinkingIndicator) {
                thinkingIndicator.remove();
                thinkingIndicator = null; // 清除引用
            }
            aiMessageDiv = addMessage('ai', '', { isStreaming: true }); // 在这里创建流式气泡
            // playAudio('/static/audio/找到了！请看....wav'); // -- 移除：开始回答语音，由打字机效果代替提示 --
            // ++ 在创建 aiMessageDiv 后创建并附加 span ++
            typingContentSpan = document.createElement('span'); // 创建用于打字的元素
            aiMessageDiv.appendChild(typingContentSpan);

            // 处理流式响应体
            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let buffer = ''; // 用于处理跨块的 SSE 消息

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    console.log('Stream finished.');
                    break; // 流结束
                }

                buffer += value;
                // SSE 消息以两个换行符分隔，但服务器可能只发送一个，所以处理单个换行符作为分隔符更健壮
                // 同时要处理可能存在的多个消息在同一个 chunk 的情况
                let endOfMessagePos;
                while ((endOfMessagePos = buffer.indexOf('\n\n')) >= 0) { // 查找 SSE 消息分隔符
                     const message = buffer.substring(0, endOfMessagePos).trim();
                     buffer = buffer.substring(endOfMessagePos + 2); // 移除已处理的消息和分隔符

                     if (message.startsWith('data:')) {
                         const jsonDataStr = message.substring(5).trim();
                         if (jsonDataStr === '[DONE]') {
                             console.log('Received [DONE] marker.');
                             // 流结束标记，可以继续处理 buffer 中剩余的非 data 行（如果有）
                             continue;
                         }
                         try {
                             if (!jsonDataStr) continue; // 跳过空的 data 行

                             const dataChunk = JSON.parse(jsonDataStr);

                             // 检查从流中返回的错误
                             if (dataChunk.error) {
                                 console.error('Stream error:', dataChunk.error);
                                 aiMessageDiv.textContent = `错误: ${dataChunk.error}`;
                                 aiMessageDiv.classList.add('error-message');
                                 aiMessageDiv.classList.remove('streaming');
                                 reader.cancel('Received error from stream'); // 取消读取流
                                 throw new Error(dataChunk.error); // 抛出错误以停止
                             }

                             // 提取内容
                             if (dataChunk.choices && dataChunk.choices.length > 0) {
                                 const delta = dataChunk.choices[0].delta;
                                 if (delta && delta.content) {
                                     accumulatedAnswer += delta.content;
                                     // 将新字符添加到队列
                                     characterQueue.push(...delta.content.split(''));
                                     // 启动打字机（如果尚未运行）
                                     startTypewriter();
                                 }
                             }
                         } catch (e) {
                             console.error('Error parsing SSE data chunk:', jsonDataStr, e);
                             // 可以选择忽略这个块或显示提示
                         }
                     }
                }
                 // 如果 buffer 中还有内容但不是完整的消息，会在下一次 read 时处理
            }

             // 处理最后可能残留在 buffer 中的非 data 行（例如注释行）
             if (buffer.trim()) {
                 console.log("Remaining buffer content after stream:", buffer);
             }


            // 流正常结束后处理
            // 确保所有字符都已打出
            if (typewriterIntervalId) {
                clearInterval(typewriterIntervalId);
                typewriterIntervalId = null;
            }
            // 将队列中剩余的字符立即显示
            if (characterQueue.length > 0) {
                typingContentSpan.textContent += characterQueue.join('');
                characterQueue = [];
                scrollToBottom();
            }
            isTyping = false;

            aiMessageDiv.classList.remove('streaming');
            aiMessageDiv.removeAttribute('id'); // 移除临时 ID

            // 进行最终的 Markdown 渲染
            if (!aiMessageDiv.classList.contains('error-message')) {
                try {
                    marked.setOptions({ gfm: true, breaks: true });
                    const rawHtml = marked.parse(accumulatedAnswer);
                    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target'] });
                    aiMessageDiv.innerHTML = sanitizedHtml; // 用渲染后的 HTML 替换纯文本打字内容
                    addCopyButtons(aiMessageDiv); // 添加复制代码按钮
                } catch (e) {
                     console.error("Final Markdown rendering failed:", e);
                     aiMessageDiv.textContent = accumulatedAnswer; // Fallback to plain text
                }
            }
            // ++ 新增：播放回答结束提示音 ++
            setTimeout(() => playAudio('/static/audio/如果需要更详细的信息，可以继续追问哦。.wav'), 500); // 稍作延迟


        } catch (error) {
            console.error('请求或流处理过程中出错:', error);
            // 清除打字机定时器
            if (typewriterIntervalId) {
                clearInterval(typewriterIntervalId);
                typewriterIntervalId = null;
            }
            isTyping = false;
            characterQueue = []; // 清空队列
            // ++ 修改：如果出错时“正在思考中”提示还存在，则移除它 ++
            if (thinkingIndicator) {
                thinkingIndicator.remove();
                thinkingIndicator = null;
            }
            // 如果 aiMessageDiv 存在且不是错误消息，将其更新为错误
            if (aiMessageDiv && !aiMessageDiv.classList.contains('error-message')) {
                 aiMessageDiv.textContent = `出现错误：${error.message}`; // 更新为错误文本
                 aiMessageDiv.classList.add('error-message');
                 aiMessageDiv.classList.remove('streaming');
                 aiMessageDiv.removeAttribute('id'); // 移除 ID
            } else if (!aiMessageDiv) { // 如果连流式气泡都没创建就出错了（比如 fetch 失败）
                 // 确保添加错误消息
                 addMessage('ai', `出现错误：${error.message}`, { isError: true });
                 playAudio('/static/audio/哎呀，好像出了一点小问题，请稍后再试或者换个问题问问看？.wav'); // ++ 新增：播放错误提示音 ++
            }
            // 如果 aiMessageDiv 已经是错误消息，则什么都不做

        } finally {
            // 恢复按钮状态
            // 清除可能残留的打字机定时器
            if (typewriterIntervalId) {
                clearInterval(typewriterIntervalId);
                typewriterIntervalId = null;
            }
            isTyping = false;
            // 恢复按钮状态
            submitButton.disabled = false;
            if (buttonText) buttonText.style.display = 'inline';
            if (loadingIcon) loadingIcon.style.display = 'none';
            scrollToBottom(); // 最后滚动检查
        }
    });

    // 允许使用 Enter 键提交（Shift+Enter 换行）
    userQuestionInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            qaForm.requestSubmit();
        }
    });

    // --- 提示建议事件监听器 ---
    promptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.textContent;
            userQuestionInput.value = promptText;
            userQuestionInput.focus();
            autoResizeTextarea();
            // playAudio('/static/audio/这是一个常见的问题，让我为你解释一下。.wav'); // -- 移除：点击提示语时的语音 --
        });
    });

    // --- 清空聊天按钮事件监听器 ---
    if (clearChatButton) {
        clearChatButton.addEventListener('click', async () => {
            // 1. 在视觉上清除聊天记录
            chatLog.innerHTML = '';

            // 2. 重新添加初始问候语
            addMessage('ai', initialGreeting);
            playAudio('/static/audio/好的，让我们重新开始对话吧！.wav'); // ++ 新增：播放清空聊天语音 ++

            // 3. （可选）通知后端清除上下文
            try {
                const response = await fetch('/api/clear_chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // 如果后端需要，可选地发送会话标识符
                    // body: JSON.stringify({ session_id: 'your_session_id' })
                });
                if (!response.ok) {
                    console.error('Failed to clear server-side chat context:', response.statusText);
                    // 可选地以稍微不同的方式通知用户，尽管主要目标是视觉清除
                } else {
                    console.log('Server-side chat context cleared.');
                }
            } catch (error) {
                console.error('Error sending clear chat request:', error);
            }

             // 4. 重置输入并聚焦（可选，但用户体验好）
            userQuestionInput.value = '';
            autoResizeTextarea();
            userQuestionInput.focus();
        });
    }

    // --- 背景音乐控制 ---
    const bgMusic = document.getElementById('bg-music');
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const playIcon = musicToggleBtn ? musicToggleBtn.querySelector('.play-icon') : null;
    const pauseIcon = musicToggleBtn ? musicToggleBtn.querySelector('.pause-icon') : null;

    if (bgMusic && musicToggleBtn && playIcon && pauseIcon) {
        musicToggleBtn.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play().catch(error => {
                    console.error("音乐播放失败:", error);
                    // 可以在这里给用户一些反馈
                });
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline'; // 或 'block'
            } else {
                bgMusic.pause();
                playIcon.style.display = 'inline'; // 或 'block'
                pauseIcon.style.display = 'none';
            }
        });

        // 尝试自动播放并更新按钮状态
        bgMusic.play().then(() => {
             // 自动播放成功
             playIcon.style.display = 'none';
             pauseIcon.style.display = 'inline';
        }).catch(error => {
            console.log("音乐自动播放被阻止或失败 (qa.js):", error);
            // 自动播放失败，保持播放按钮可见
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
        });
    } else {
        console.warn("未能找到 QA 页面背景音乐控制所需的部分或全部元素。");
        // 检查具体哪个元素未找到
        if (!bgMusic) console.warn("元素 'bg-music' 未找到。");
        if (!musicToggleBtn) console.warn("元素 'music-toggle-btn' 未找到。");
        if (!playIcon) console.warn("元素 '.play-icon' 未找到。");
        if (!pauseIcon) console.warn("元素 '.pause-icon' 未找到。");
    }

}); // DOMContentLoaded 监听器结束
