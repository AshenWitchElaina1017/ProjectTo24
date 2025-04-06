document.addEventListener('DOMContentLoaded', () => {
    const termDisplay = document.getElementById('current-term');
    const poemOptionsContainer = document.getElementById('poem-options');
    const resultDisplay = document.getElementById('result-display');
    const resultMessage = document.getElementById('result-message');
    const correctPoemInfo = document.getElementById('correct-poem-info');
    const correctPoemTitle = document.getElementById('correct-poem-title');
    const correctPoemAuthor = document.getElementById('correct-poem-author');
    const correctPoemText = document.getElementById('correct-poem-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    let poemsData = [];
    let currentCorrectPoem = null;
    const numberOfOptions = 4; 
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; 
        }
    }
    function getRandomItems(arr, num, excludeItem = null) {
        const shuffled = arr.filter(item => item !== excludeItem);
        shuffleArray(shuffled);
        return shuffled.slice(0, num);
    }
    async function loadPoems() {
        try {
            const response = await fetch('/static/data/poems.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            poemsData = await response.json();
            if (poemsData.length > 0) {
                displayQuestion();
            } else {
                resultMessage.textContent = '无法加载诗词数据。';
                resultDisplay.style.display = 'block';
            }
        } catch (error) {
            console.error("Error loading poems:", error);
            resultMessage.textContent = '加载诗词数据失败，请检查文件路径或网络连接。';
            resultDisplay.style.display = 'block';
        }
    }
    function displayQuestion() {
        if (poemsData.length < numberOfOptions) {
             resultMessage.textContent = '诗词数据不足以开始游戏。';
             resultDisplay.style.display = 'block';
             return;
        }
        currentCorrectPoem = poemsData[Math.floor(Math.random() * poemsData.length)];
        termDisplay.textContent = currentCorrectPoem.term;
        const incorrectPoems = getRandomItems(poemsData, numberOfOptions - 1, currentCorrectPoem);
        const options = [...incorrectPoems, currentCorrectPoem];
        shuffleArray(options);
        poemOptionsContainer.innerHTML = '';
        options.forEach(poem => {
            const button = document.createElement('button');
            button.classList.add('poem-option-btn');
            button.dataset.poemText = poem.poem;
            button.textContent = poem.poem; 
            button.addEventListener('click', handleOptionClick);
            poemOptionsContainer.appendChild(button);
        });
        resultDisplay.style.display = 'none';
        resultDisplay.className = 'result-display';
        correctPoemInfo.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
    }
    function handleOptionClick(event) {
        const selectedPoemText = event.target.dataset.poemText;
        const buttons = poemOptionsContainer.querySelectorAll('.poem-option-btn');
        buttons.forEach(button => button.disabled = true);
        resultDisplay.style.display = 'block';
        if (selectedPoemText === currentCorrectPoem.poem) {
            resultMessage.textContent = '正确！ 🎉';
            resultDisplay.classList.add('correct');
            correctPoemInfo.style.display = 'none';
        } else {
            resultMessage.textContent = '错误。😟 正确的诗词是：';
            resultDisplay.classList.add('incorrect');
            correctPoemTitle.textContent = `《${currentCorrectPoem.title}》`;
            correctPoemAuthor.textContent = `— ${currentCorrectPoem.author}`;
            correctPoemText.textContent = currentCorrectPoem.poem;
            correctPoemInfo.style.display = 'block';
        }
        nextQuestionBtn.style.display = 'inline-block';
    }
    nextQuestionBtn.addEventListener('click', displayQuestion);
    loadPoems();
});