document.addEventListener('DOMContentLoaded', () => {
    // --- 获取 DOM 元素 ---
    const gameBoard = document.getElementById('game-board');
    const movesCountSpan = document.getElementById('moves-count');
    const timerSpan = document.getElementById('timer');
    const scoreSpan = document.getElementById('score'); // 新增：获取积分显示元素
    const restartButton = document.getElementById('restart-button');
    const winMessageDiv = document.getElementById('win-message');
    const finalMovesSpan = document.getElementById('final-moves');
    const finalTimeSpan = document.getElementById('final-time');
    const finalScoreSpan = document.getElementById('final-score'); // 新增：获取最终得分显示元素
    const playAgainButton = document.getElementById('play-again-button');
    const matchInfoPopup = document.getElementById('match-info-popup');
    const popupTermName = document.getElementById('popup-term-name');
    const popupTermInfo = document.getElementById('popup-term-info');
    const difficultySelect = document.getElementById('difficulty');
    const finalDifficultySpan = document.getElementById('final-difficulty');

    // --- 游戏状态变量 ---
    let allSolarTerms = [];     // 存储从 JSON 加载的完整列表
    let firstCard = null;       // 存储翻开的第一张卡牌元素
    let secondCard = null;      // 存储翻开的第二张卡牌元素
    let lockBoard = false;      // 在检查/动画期间阻止点击
    let moves = 0;              // 记录玩家步数
    let matchedPairs = 0;       // 记录找到的配对数量
    let totalPairs = 8;         // 根据难度确定的配对总数（默认：普通）
    let timerInterval = null;   // 保存计时器的 interval ID
    let secondsElapsed = 0;     // 记录经过的秒数
    let popupTimeout = null;    // 保存信息弹窗的 timeout ID
    let score = 0;              // 新增：记录玩家得分
    let currentInteractiveAudio = null; // 保存当前播放的互动语音实例

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

        // （可选）监听播放结束事件，清除引用
        // currentInteractiveAudio.onended = () => {
        //     currentInteractiveAudio = null;
        // };
    }

    // --- 辅助函数：格式化时间（秒 转 MM:SS）---
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- 辅助函数：洗牌数组（Fisher-Yates 算法）---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // 交换元素
        }
        return array;
    }

    // --- 辅助函数：获取随机节气子集 ---
    function getRandomTerms(termsArray, count) {
        const shuffled = shuffleArray([...termsArray]); // 洗牌一个副本
        return shuffled.slice(0, count); // 取前 'count' 个元素
    }

    // --- 辅助函数：计算布局的网格列数 ---
    function calculateGridColumns(totalCards) {
        if (totalCards === 8) return 4; // 4 对 (8 cards) -> 4x2 grid
        if (totalCards <= 9) return 3; // Keep 3 for other small numbers if needed
        if (totalCards <= 12) return 4; // 6 对
        if (totalCards <= 16) return 4; // 8 对
        if (totalCards <= 20) return 5;
        if (totalCards <= 24) return 6; // 12 对
        return Math.ceil(Math.sqrt(totalCards)); // 其他数量的备用方案
    }

     // --- 辅助函数：启动计时器 ---
     function startTimer() {
        stopTimer(); // 清除任何现有的计时器
        timerInterval = setInterval(() => {
            secondsElapsed++;
            timerSpan.textContent = formatTime(secondsElapsed);
        }, 1000); // 每秒更新
    }

    // --- 辅助函数：停止计时器 ---
    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }


    // --- 核心游戏逻辑 ---

    // 初始化或重置游戏
    function initGame() {
        console.log("Initializing game...");
        // 读取选择的难度
        totalPairs = parseInt(difficultySelect.value, 10);

        // 重置游戏变量
        moves = 0;
        matchedPairs = 0;
        secondsElapsed = 0;
        score = 0; // 新增：重置积分
        firstCard = null;
        secondCard = null;
        lockBoard = false;
        stopTimer(); // 停止计时器
        timerSpan.textContent = formatTime(secondsElapsed); // 重置计时器显示
        movesCountSpan.textContent = moves; // 重置步数显示
        scoreSpan.textContent = score; // 新增：重置积分显示

        // 重置 UI 元素
        gameBoard.innerHTML = '<p class="loading-message">正在选择节气...</p>'; // 显示加载中
        winMessageDiv.classList.add('hidden'); // 隐藏胜利信息
        matchInfoPopup.classList.add('hidden'); // 隐藏信息弹窗
        clearTimeout(popupTimeout); // 清除任何残留的弹窗计时器

        // 如果数据尚未加载则获取数据，否则直接设置棋盘
        if (allSolarTerms.length === 0) {
            fetchSolarTerms();
        } else if (allSolarTerms.length < totalPairs) {
            // 处理先前加载的数据不足以满足新难度的情况
            console.warn("需要重新加载数据以满足新的难度级别。")
            fetchSolarTerms();
        }
        else {
            setupBoard(); // 使用已加载的数据
        }
    }

    // 从 JSON 获取节气数据
    function fetchSolarTerms() {
        console.log("Fetching solar terms data...");
        fetch('/static/data/solar_terms.json') // 确保此路径正确
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                allSolarTerms = data.solar_terms;
                if (!allSolarTerms || allSolarTerms.length < totalPairs) { // 检查是否有足够的数据用于所选难度
                    throw new Error('节气数据不足或格式错误，无法开始所选难度');
                }
                console.log(`节气数据加载成功，总数: ${allSolarTerms.length}`);
                setupBoard(); // 数据加载后设置棋盘
            })
            .catch(error => {
                console.error('无法加载节气数据:', error);
                gameBoard.innerHTML = `<p class="loading-message" style="color: red;">错误：${error.message}。请检查文件路径或刷新页面。</p>`;
            });
    }

    // 设置带卡牌的游戏棋盘
    function setupBoard() {
        console.log(`设置棋盘，难度: ${totalPairs} 对`);
        playAudio('/static/audio/欢迎来到二十四节气记忆挑战！看看你的眼力和记性如何？.wav'); // ++ 新增：游戏开始语音 ++
        // 1. 根据难度选择随机节气
        const selectedTerms = getRandomTerms(allSolarTerms, totalPairs);

        // 2. 创建卡牌数据对（图像路径、名称、ID 和额外信息）
        const gameCardsData = [];
        selectedTerms.forEach(term => {
            // 在原始完整列表中查找节气的索引以确定图像编号
            const termIndex = allSolarTerms.findIndex(t => t.id === term.id);
            const imageNumber = String(termIndex + 1).padStart(2, '0'); // 格式化为 01, 02 等
            const imagePath = `/static/images/${imageNumber}.png`; // 构建图像路径

            const cardInfo = {
                name: term.name,
                imagePath: imagePath, // 使用图像路径而不是图标
                matchId: term.id,
                description: term.description || '暂无详细描述。', // 为弹窗添加描述
                customs: term.customs || '', // 添加习俗以备将来使用
                phenology: term.phenology ? term.phenology.join(' ') : '', // 添加物候以备将来使用
                tagline: term.tagline || ''
            };
            // 为每个节气添加两张相同的卡牌以形成一对
            gameCardsData.push(cardInfo, { ...cardInfo });
        });

        // 3. Shuffle the card data
        const shuffledCardsData = shuffleArray(gameCardsData);

        // 4. 为每张卡牌创建 HTML 元素
        gameBoard.innerHTML = ''; // 清除之前的棋盘/加载消息
        const columns = calculateGridColumns(shuffledCardsData.length);
        gameBoard.style.gridTemplateColumns = `repeat(${columns}, auto)`; // 设置网格布局

        shuffledCardsData.forEach(cardData => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            // 使用 dataset 直接在元素上存储匹配和信息数据
            cardElement.dataset.matchId = cardData.matchId;
            cardElement.dataset.termName = cardData.name;
            cardElement.dataset.termDescription = cardData.description; // 存储描述
            cardElement.dataset.termCustoms = cardData.customs;       // 存储习俗
            cardElement.dataset.termPhenology = cardData.phenology;   // 存储物候
            cardElement.dataset.termTagline = cardData.tagline;

            // 创建卡牌正面（带图标和名称）
            const cardFaceFront = document.createElement('div');
            cardFaceFront.classList.add('card-face', 'card-front');
            // 为正面创建图像元素
            const cardImage = document.createElement('img');
            cardImage.classList.add('card-image'); // 添加样式类
            cardImage.src = cardData.imagePath;
            cardImage.alt = cardData.name; // 为可访问性设置 alt 文本
            // 可选地在图像下方添加名称
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('card-name');
            nameSpan.textContent = cardData.name;
            cardFaceFront.appendChild(cardImage);
            cardFaceFront.appendChild(nameSpan); // 在图像后附加名称

            // 创建卡牌背面
            const cardFaceBack = document.createElement('div');
            cardFaceBack.classList.add('card-face', 'card-back');
            // 背面的背景图像在 CSS 中设置

            cardElement.appendChild(cardFaceFront);
            cardElement.appendChild(cardFaceBack);

            // Add click listener to flip the card
            cardElement.addEventListener('click', handleCardClick);
            gameBoard.appendChild(cardElement);
        });

        // 5. Start the game timer
        startTimer();
    }

    // 处理卡牌点击事件
    function handleCardClick(event) {
        if (lockBoard) return; // 如果棋盘已锁定，则不执行任何操作
        const clickedCard = event.currentTarget;

        // Prevent clicking the same card twice or an already matched card
        if (clickedCard === firstCard || clickedCard.classList.contains('matched')) {
            return;
        }

        // Flip the clicked card
        clickedCard.classList.add('flipped');

        if (!firstCard) {
            // 这是本轮翻开的第一张卡牌
            firstCard = clickedCard;
        } else {
            // 这是翻开的第二张卡牌
            secondCard = clickedCard;
            lockBoard = true; // 锁定棋盘以防止更多点击
            incrementMoves(); // 增加步数计数器
            checkForMatch(); // 检查两张卡牌是否匹配
        }
    }

    // 增加步数计数器
    function incrementMoves() {
        moves++;
        movesCountSpan.textContent = moves;
    }

    // 检查两张翻开的卡牌是否匹配
    function checkForMatch() {
        const isMatch = firstCard.dataset.matchId === secondCard.dataset.matchId;

        if (isMatch) {
            // ++ 修改：随机播放成功语音 ++
            const successAudios = [
                '/static/audio/太棒了！继续前进，感受四时变化吧！.wav',
                '/static/audio/这个节气的知识掌握得不错！.wav'
            ];
            playAudio(successAudios[Math.floor(Math.random() * successAudios.length)]);
            showMatchInfo(firstCard); // 显示匹配节气的信息弹窗
            // 使用 setTimeout 以便在禁用卡牌前显示弹窗
            setTimeout(disableCards, 600); // 短暂延迟后禁用卡牌
        } else {
            // ++ 修改：随机播放失败语音 ++
             const failAudios = [
                '/static/audio/哎呀，好像有点偏差。没关系，看看提示或者再试一次？.wav',
                '/static/audio/嗯，这个答案很接近了，再想想？.wav'
            ];
            playAudio(failAudios[Math.floor(Math.random() * failAudios.length)]);
            score -= 2; // 新增：选择错误扣 2 分
            if (score < 0) { score = 0; } // 新增：确保分数不为负
            scoreSpan.textContent = score; // 新增：更新积分显示
            // ++ 新增：当分数过低时播放提示音 ++
            if (score < 5) { // 设定阈值为 5
                playAudio('/static/audio/哎呀，好像有点偏差。没关系，看看提示或者再试一次？.wav');
            }
            unflipCards(); // 如果不匹配则翻回卡牌
        }
    }

    // 显示匹配节气的信息弹窗
    function showMatchInfo(card) {
        const termName = card.dataset.termName;
        // 使用完整描述作为弹窗信息
        const termInfo = card.dataset.termDescription || '暂无详细描述。'; // Prioritize description

        popupTermName.textContent = termName;
        popupTermInfo.textContent = termInfo;
        matchInfoPopup.classList.remove('hidden'); // 显示弹窗

        // 清除之前为弹窗设置的任何超时
        clearTimeout(popupTimeout);

        // 设置超时以在几秒钟后自动隐藏弹窗
        popupTimeout = setTimeout(() => {
            matchInfoPopup.classList.add('hidden');
        }, 2500); // 显示 2.5 秒
    }


    // 禁用匹配的卡牌（使其不可点击并在视觉上区分）
    function disableCards() {
        firstCard.removeEventListener('click', handleCardClick);
        secondCard.removeEventListener('click', handleCardClick);
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchedPairs++; // 增加匹配对计数
        score += 10; // 新增：每次匹配成功加 10 分
        scoreSpan.textContent = score; // 新增：更新积分显示

        // ++ 新增：检查游戏进度并播放相应语音 ++
        if (matchedPairs === Math.ceil(totalPairs / 2)) { // 到达一半
            playAudio('/static/audio/干得不错，已经完成一半了！继续加油！.wav');
        } else if (matchedPairs === totalPairs - 1 && totalPairs > 1) { // 只剩最后一对 (且总数大于1)
             playAudio('/static/audio/胜利在望！找到它们，完成挑战！.wav');
        }

        resetBoardState(); // 为下一轮重置状态
        // 检查是否所有对都已找到
        if (matchedPairs === totalPairs) {
            winGame();
        }
    }

    // 将不匹配的卡牌翻回去
    function unflipCards() {
        // 稍等片刻再翻回去，以便玩家可以看到第二张卡牌
        setTimeout(() => {
            if (firstCard) firstCard.classList.remove('flipped');
            if (secondCard) secondCard.classList.remove('flipped');
            resetBoardState(); // 为下一轮重置状态
        }, 1200); // 延迟（1.2 秒）
    }

    // 一轮结束后重置卡牌状态（无论是否匹配）
    function resetBoardState() {
        [firstCard, secondCard, lockBoard] = [null, null, false];
    }

    // 处理游戏胜利条件
    function winGame() {
        playAudio('/static/audio/恭喜通关！你已掌握二十四节气的奥秘！.wav'); // 播放主要胜利语音
        // -- 移除：后续补充胜利语音，避免相互打断 --
        // setTimeout(() => playAudio('/static/audio/恭喜你完成了挑战！你对二十四节气的了解又加深了呢！.wav'), 1500);
        // setTimeout(() => playAudio('/static/audio/时间流转，四季轮回，这次节气之旅感觉如何？.wav'), 3500);
        // setTimeout(() => playAudio('/static/audio/虽然挑战结束了，但探索节气智慧的旅程永不停止。.wav'), 5500);

        console.log("游戏胜利!");
        stopTimer(); // 停止游戏计时器

        // 获取所选难度的文本
        const difficultyText = difficultySelect.options[difficultySelect.selectedIndex].text;

        // 更新并显示胜利信息
        finalDifficultySpan.textContent = difficultyText; // 显示难度级别
        finalMovesSpan.textContent = moves;
        finalTimeSpan.textContent = formatTime(secondsElapsed);
        finalScoreSpan.textContent = score; // 新增：显示最终得分
        winMessageDiv.classList.remove('hidden');

        // 确保显示胜利信息时隐藏信息弹窗
        matchInfoPopup.classList.add('hidden');
        clearTimeout(popupTimeout);
    }

    // --- 事件监听器 ---
    restartButton.addEventListener('click', initGame); // 重启按钮点击
    playAgainButton.addEventListener('click', initGame); // 再玩一次按钮点击（在胜利信息中）
    difficultySelect.addEventListener('change', initGame); // 难度更改会重新初始化游戏

    // --- 页面加载时启动游戏 ---
    initGame();

}); // DOMContentLoaded 监听器结束
