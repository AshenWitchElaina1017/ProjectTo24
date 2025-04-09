document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const termDisplay = document.getElementById('current-term');
    const poemOptionsContainer = document.getElementById('poem-options');
    const resultDisplay = document.getElementById('result-display');
    const resultMessage = document.getElementById('result-message');
    const correctPoemInfo = document.getElementById('correct-poem-info');
    const correctPoemTitle = document.getElementById('correct-poem-title');
    const correctPoemAuthor = document.getElementById('correct-poem-author');
    const correctPoemText = document.getElementById('correct-poem-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const scoreDisplay = document.getElementById('score');
    const gameSetupDiv = document.getElementById('game-setup');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameAreaDiv = document.getElementById('game-area');
    const questionCountRadios = document.querySelectorAll('input[name="question-count"]');

    // --- Game State Variables ---
    let poemsData = []; // All loaded poems
    let availablePoems = []; // Poems selected for the current game
    let currentCorrectPoem = null;
    let score = 0;
    let consecutiveCorrectAnswers = 0;
    let totalQuestions = 4; // Default
    let questionsAnswered = 0;
    let gameActive = false;
    const numberOfOptions = 4; // Number of choices per question
    let currentInteractiveAudio = null; // Currently playing audio instance

    // --- Helper Functions ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function getRandomItems(arr, num, excludeItem = null) {
        const filtered = arr.filter(item => item !== excludeItem);
        shuffleArray(filtered);
        return filtered.slice(0, num);
    }

    function playAudio(filePath) {
        if (currentInteractiveAudio && !currentInteractiveAudio.paused) {
            currentInteractiveAudio.pause();
            currentInteractiveAudio.currentTime = 0;
        }
        const newAudio = new Audio(filePath);
        newAudio.play().catch(error => {
            console.error(`无法播放音频 "${filePath}":`, error);
        });
        currentInteractiveAudio = newAudio;
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = score;
    }

    // --- Core Game Logic ---
    async function loadPoems() {
        try {
            const response = await fetch('/static/data/poems.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            poemsData = await response.json();
            if (poemsData.length >= numberOfOptions) {
                startGameBtn.disabled = false; // Enable start button once data is loaded
                startGameBtn.textContent = '开始游戏';
            } else {
                startGameBtn.textContent = '数据不足';
                console.error('诗词数据不足以开始游戏。');
                alert('错误：诗词数据不足，无法开始游戏。请检查 poems.json 文件。');
            }
        } catch (error) {
            console.error("加载诗词数据时出错:", error);
            startGameBtn.textContent = '加载失败';
             alert('错误：加载诗词数据失败。请检查控制台获取更多信息。');
        }
    }

    function startGame() {
        // Get selected number of questions
        const selectedCount = document.querySelector('input[name="question-count"]:checked');
        totalQuestions = selectedCount ? parseInt(selectedCount.value, 10) : 4;

        if (poemsData.length < totalQuestions) {
             alert(`错误：诗词数据不足以进行 ${totalQuestions} 题游戏。`);
             console.error(`诗词数据只有 ${poemsData.length} 首，需要 ${totalQuestions} 首。`);
             return;
        }

        // Reset game state
        score = 0;
        consecutiveCorrectAnswers = 0;
        questionsAnswered = 0;
        gameActive = true;
        updateScoreDisplay();

        // Select poems for this game round
        shuffleArray(poemsData);
        availablePoems = poemsData.slice(0, totalQuestions);

        // Update UI
        gameSetupDiv.style.display = 'none';
        gameAreaDiv.style.display = 'block';
        resultDisplay.style.display = 'none'; // Hide previous results if any
        nextQuestionBtn.textContent = '下一题'; // Reset button text

        displayQuestion();
    }

    function displayQuestion() {
        if (!gameActive || questionsAnswered >= totalQuestions) {
            endGame();
            return;
        }

        // Select the next poem from the available list
        currentCorrectPoem = availablePoems[questionsAnswered]; // Get poem based on index

        termDisplay.textContent = currentCorrectPoem.term;

        // Get incorrect options (exclude the correct one and already used ones if needed, though simpler to just exclude current correct)
        const incorrectPoems = getRandomItems(poemsData, numberOfOptions - 1, currentCorrectPoem);
        const options = [...incorrectPoems, currentCorrectPoem];
        shuffleArray(options);

        poemOptionsContainer.innerHTML = ''; // Clear previous options
        options.forEach(poem => {
            const button = document.createElement('button');
            button.classList.add('poem-option-btn');
            // Store the full poem object reference if needed, or just the text for comparison
            button.dataset.poemText = poem.poem;
            button.textContent = poem.poem;
            button.addEventListener('click', handleOptionClick);
            poemOptionsContainer.appendChild(button);
        });

        // Reset UI for the new question
        resultDisplay.style.display = 'none';
        resultDisplay.className = 'result-display'; // Remove correct/incorrect classes
        correctPoemInfo.style.display = 'none';
        nextQuestionBtn.style.display = 'none'; // Hide until answer is selected
    }

    function handleOptionClick(event) {
        if (!gameActive) return;

        const selectedPoemText = event.target.dataset.poemText;
        const buttons = poemOptionsContainer.querySelectorAll('.poem-option-btn');
        buttons.forEach(button => button.disabled = true); // Disable all options

        resultDisplay.style.display = 'block';
        questionsAnswered++;

        if (selectedPoemText === currentCorrectPoem.poem) {
            // Correct Answer
            consecutiveCorrectAnswers++;
            const pointsEarned = 10 + (consecutiveCorrectAnswers - 1) * 5; // Base score + bonus
            score += pointsEarned;
            playAudio('/static/audio/太棒了！继续前进，感受四时变化吧！.wav');
            resultMessage.textContent = `正确！ 🎉 +${pointsEarned}分`;
            resultDisplay.classList.add('correct');
            correctPoemInfo.style.display = 'none';
        } else {
            // Incorrect Answer
            consecutiveCorrectAnswers = 0;
            const pointsLost = 5;
            score = Math.max(0, score - pointsLost); // Score cannot be negative
            // ++ 修改：仅在分数低于阈值时播放提示音 ++
            if (score < 5) { // 设定阈值为 5
                 playAudio('/static/audio/哎呀，好像有点偏差。没关系，看看提示或者再试一次？.wav');
            }
            resultMessage.textContent = `错误。😟 -${pointsLost}分`;
            resultDisplay.classList.add('incorrect');
            // Display correct answer info
            correctPoemTitle.textContent = `《${currentCorrectPoem.title}》`;
            correctPoemAuthor.textContent = `— ${currentCorrectPoem.author}`;
            correctPoemText.textContent = currentCorrectPoem.poem;
            correctPoemInfo.style.display = 'block';
        }

        updateScoreDisplay();

        // Show next button or end game button
        if (questionsAnswered >= totalQuestions) {
            nextQuestionBtn.textContent = '查看结果';
        } else {
             nextQuestionBtn.textContent = '下一题';
        }
        nextQuestionBtn.style.display = 'inline-block';
    }

     function handleNextQuestionClick() {
        if (!gameActive) return;

        if (questionsAnswered >= totalQuestions) {
            endGame();
        } else {
            displayQuestion();
        }
    }


    function endGame() {
        gameActive = false;
        // 根据最终分数播放不同音频
        const scoreThreshold = totalQuestions * 5; // 设置阈值为基础总分的一半
        if (score < scoreThreshold) {
            playAudio('/static/audio/虽然挑战结束了，但探索节气智慧的旅程永不停止。.wav');
        } else {
            playAudio('/static/audio/恭喜通关！你已掌握二十四节气的奥秘！.wav'); // 分数达标则播放通关音频
        }

        // Hide question/options area, show final score message
        termDisplay.textContent = '游戏结束';
        poemOptionsContainer.innerHTML = '';
        resultDisplay.style.display = 'block';
        resultDisplay.className = 'result-display final-result'; // Style for final result
        correctPoemInfo.style.display = 'none';
        nextQuestionBtn.style.display = 'none'; // Hide next button

        resultMessage.innerHTML = `游戏结束！<br>你的最终得分是: <strong>${score}</strong> / ${totalQuestions * 10} (基础分)`; // Show final score

        // Show setup area again for restart
        gameSetupDiv.style.display = 'block';
        startGameBtn.textContent = '重新开始'; // Change button text
        startGameBtn.disabled = false; // Ensure it's enabled

        // Optionally hide the game area elements if needed, though hiding the container might suffice
        // gameAreaDiv.style.display = 'none';
    }


    // --- Event Listeners ---
    startGameBtn.addEventListener('click', startGame);
    nextQuestionBtn.addEventListener('click', handleNextQuestionClick);


    // --- Initial Setup ---
    startGameBtn.disabled = true; // Disable until poems are loaded
    startGameBtn.textContent = '加载中...';
    gameAreaDiv.style.display = 'none'; // Hide game area initially
    gameSetupDiv.style.display = 'block'; // Show setup area initially
    loadPoems(); // Load data when the page loads
});