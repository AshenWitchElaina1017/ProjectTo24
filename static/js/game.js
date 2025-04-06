document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const gameBoard = document.getElementById('game-board');
    const movesCountSpan = document.getElementById('moves-count');
    const timerSpan = document.getElementById('timer');
    const restartButton = document.getElementById('restart-button');
    const winMessageDiv = document.getElementById('win-message');
    const finalMovesSpan = document.getElementById('final-moves');
    const finalTimeSpan = document.getElementById('final-time');
    const playAgainButton = document.getElementById('play-again-button');
    const matchInfoPopup = document.getElementById('match-info-popup');
    const popupTermName = document.getElementById('popup-term-name');
    const popupTermInfo = document.getElementById('popup-term-info');
    const difficultySelect = document.getElementById('difficulty');
    const finalDifficultySpan = document.getElementById('final-difficulty');

    // --- Game State Variables ---
    let allSolarTerms = [];     // Stores the full list from JSON
    let firstCard = null;       // Stores the first flipped card element
    let secondCard = null;      // Stores the second flipped card element
    let lockBoard = false;      // Prevents clicking during checks/animations
    let moves = 0;              // Counts player moves
    let matchedPairs = 0;       // Counts found pairs
    let totalPairs = 8;         // Number of pairs based on difficulty (default: Normal)
    let timerInterval = null;   // Holds the interval ID for the timer
    let secondsElapsed = 0;     // Counts seconds passed
    let popupTimeout = null;    // Holds the timeout ID for the info popup

    // --- Helper Function: Format Time (Seconds to MM:SS) ---
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- Helper Function: Shuffle Array (Fisher-Yates Algorithm) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    // --- Helper Function: Get Random Subset of Terms ---
    function getRandomTerms(termsArray, count) {
        const shuffled = shuffleArray([...termsArray]); // Shuffle a copy
        return shuffled.slice(0, count); // Take the first 'count' elements
    }

    // --- Helper Function: Calculate Grid Columns for Layout ---
    function calculateGridColumns(totalCards) {
        if (totalCards <= 9) return 3;
        if (totalCards <= 12) return 4; // For 6 pairs
        if (totalCards <= 16) return 4; // For 8 pairs
        if (totalCards <= 20) return 5;
        if (totalCards <= 24) return 6; // For 12 pairs
        return Math.ceil(Math.sqrt(totalCards)); // Fallback for other numbers
    }

     // --- Helper Function: Start Timer ---
     function startTimer() {
        stopTimer(); // Clear any existing timer
        timerInterval = setInterval(() => {
            secondsElapsed++;
            timerSpan.textContent = formatTime(secondsElapsed);
        }, 1000); // Update every second
    }

    // --- Helper Function: Stop Timer ---
    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }


    // --- Core Game Logic ---

    // Initialize or Reset the Game
    function initGame() {
        console.log("Initializing game...");
        // Read selected difficulty
        totalPairs = parseInt(difficultySelect.value, 10);

        // Reset game variables
        moves = 0;
        matchedPairs = 0;
        secondsElapsed = 0;
        firstCard = null;
        secondCard = null;
        lockBoard = false;
        stopTimer(); // Stop timer
        timerSpan.textContent = formatTime(secondsElapsed); // Reset timer display
        movesCountSpan.textContent = moves; // Reset moves display

        // Reset UI elements
        gameBoard.innerHTML = '<p class="loading-message">正在选择节气...</p>'; // Show loading
        winMessageDiv.classList.add('hidden'); // Hide win message
        matchInfoPopup.classList.add('hidden'); // Hide info popup
        clearTimeout(popupTimeout); // Clear any lingering popup timer

        // Fetch data if not already loaded, otherwise setup board directly
        if (allSolarTerms.length === 0) {
            fetchSolarTerms();
        } else if (allSolarTerms.length < totalPairs) {
            // Handle case where previously loaded data is insufficient for new difficulty
            console.warn("需要重新加载数据以满足新的难度级别。")
            fetchSolarTerms();
        }
        else {
            setupBoard(); // Use already loaded data
        }
    }

    // Fetch Solar Terms Data from JSON
    function fetchSolarTerms() {
        console.log("Fetching solar terms data...");
        fetch('/static/data/solar_terms.json') // Ensure this path is correct
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                allSolarTerms = data.solar_terms;
                if (!allSolarTerms || allSolarTerms.length < totalPairs) { // Check if enough data for selected difficulty
                    throw new Error('节气数据不足或格式错误，无法开始所选难度');
                }
                console.log(`节气数据加载成功，总数: ${allSolarTerms.length}`);
                setupBoard(); // Setup board after data is loaded
            })
            .catch(error => {
                console.error('无法加载节气数据:', error);
                gameBoard.innerHTML = `<p class="loading-message" style="color: red;">错误：${error.message}。请检查文件路径或刷新页面。</p>`;
            });
    }

    // Setup the Game Board with Cards
    function setupBoard() {
        console.log(`设置棋盘，难度: ${totalPairs} 对`);
        // 1. Select random terms based on difficulty
        const selectedTerms = getRandomTerms(allSolarTerms, totalPairs);

        // 2. Create card data pairs (image path, name, id, and extra info)
        const gameCardsData = [];
        selectedTerms.forEach(term => {
            // Find the index of the term in the original full list to determine the image number
            const termIndex = allSolarTerms.findIndex(t => t.id === term.id);
            const imageNumber = String(termIndex + 1).padStart(2, '0'); // Format as 01, 02, etc.
            const imagePath = `/static/images/${imageNumber}.png`; // Construct image path

            const cardInfo = {
                name: term.name,
                imagePath: imagePath, // Use image path instead of icon
                matchId: term.id,
                description: term.description || '暂无详细描述。', // Add description for popup
                customs: term.customs || '', // Add customs for potential future use
                phenology: term.phenology ? term.phenology.join(' ') : '', // Add phenology for potential future use
                tagline: term.tagline || ''
            };
            // Add two identical cards for each term to form a pair
            gameCardsData.push(cardInfo, { ...cardInfo });
        });

        // 3. Shuffle the card data
        const shuffledCardsData = shuffleArray(gameCardsData);

        // 4. Create HTML elements for each card
        gameBoard.innerHTML = ''; // Clear previous board/loading message
        const columns = calculateGridColumns(shuffledCardsData.length);
        gameBoard.style.gridTemplateColumns = `repeat(${columns}, auto)`; // Set grid layout

        shuffledCardsData.forEach(cardData => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            // Store matching and info data directly on the element using dataset
            cardElement.dataset.matchId = cardData.matchId;
            cardElement.dataset.termName = cardData.name;
            cardElement.dataset.termDescription = cardData.description; // Store description
            cardElement.dataset.termCustoms = cardData.customs;       // Store customs
            cardElement.dataset.termPhenology = cardData.phenology;   // Store phenology
            cardElement.dataset.termTagline = cardData.tagline;

            // Create Card Front (with icon and name)
            const cardFaceFront = document.createElement('div');
            cardFaceFront.classList.add('card-face', 'card-front');
            // Create image element for the front face
            const cardImage = document.createElement('img');
            cardImage.classList.add('card-image'); // Add class for styling
            cardImage.src = cardData.imagePath;
            cardImage.alt = cardData.name; // Set alt text for accessibility
            // Optionally add the name below the image
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('card-name');
            nameSpan.textContent = cardData.name;
            cardFaceFront.appendChild(cardImage);
            cardFaceFront.appendChild(nameSpan); // Append name after image

            // Create Card Back
            const cardFaceBack = document.createElement('div');
            cardFaceBack.classList.add('card-face', 'card-back');
            // Background image for back is set in CSS

            cardElement.appendChild(cardFaceFront);
            cardElement.appendChild(cardFaceBack);

            // Add click listener to flip the card
            cardElement.addEventListener('click', handleCardClick);
            gameBoard.appendChild(cardElement);
        });

        // 5. Start the game timer
        startTimer();
    }

    // Handle Click on a Card
    function handleCardClick(event) {
        if (lockBoard) return; // Do nothing if board is locked
        const clickedCard = event.currentTarget;

        // Prevent clicking the same card twice or an already matched card
        if (clickedCard === firstCard || clickedCard.classList.contains('matched')) {
            return;
        }

        // Flip the clicked card
        clickedCard.classList.add('flipped');

        if (!firstCard) {
            // This is the first card flipped in a turn
            firstCard = clickedCard;
        } else {
            // This is the second card flipped
            secondCard = clickedCard;
            lockBoard = true; // Lock the board to prevent more clicks
            incrementMoves(); // Increment move counter
            checkForMatch(); // Check if the two cards match
        }
    }

    // Increment Moves Counter
    function incrementMoves() {
        moves++;
        movesCountSpan.textContent = moves;
    }

    // Check if the Two Flipped Cards Match
    function checkForMatch() {
        const isMatch = firstCard.dataset.matchId === secondCard.dataset.matchId;

        if (isMatch) {
            showMatchInfo(firstCard); // Show info popup for the matched term
            // Use setTimeout to allow popup to show before disabling
            setTimeout(disableCards, 600); // Disable cards after a short delay
        } else {
            unflipCards(); // Flip cards back if they don't match
        }
    }

    // Show Info Popup for Matched Term
    function showMatchInfo(card) {
        const termName = card.dataset.termName;
        // Use the full description for the popup info
        const termInfo = card.dataset.termDescription || '暂无详细描述。'; // Prioritize description

        popupTermName.textContent = termName;
        popupTermInfo.textContent = termInfo;
        matchInfoPopup.classList.remove('hidden'); // Show the popup

        // Clear any previous timeout for the popup
        clearTimeout(popupTimeout);

        // Set a timeout to automatically hide the popup after a few seconds
        popupTimeout = setTimeout(() => {
            matchInfoPopup.classList.add('hidden');
        }, 2500); // Display for 2.5 seconds
    }


    // Disable Matched Cards (Make them unclickable and visually distinct)
    function disableCards() {
        firstCard.removeEventListener('click', handleCardClick);
        secondCard.removeEventListener('click', handleCardClick);
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchedPairs++; // Increment matched pair count
        resetBoardState(); // Reset for the next turn

        // Check if all pairs have been found
        if (matchedPairs === totalPairs) {
            winGame();
        }
    }

    // Flip Non-Matching Cards Back Over
    function unflipCards() {
        // Wait a bit before flipping back so the player can see the second card
        setTimeout(() => {
            if (firstCard) firstCard.classList.remove('flipped');
            if (secondCard) secondCard.classList.remove('flipped');
            resetBoardState(); // Reset for the next turn
        }, 1200); // Delay (1.2 seconds)
    }

    // Reset Card State After a Turn (Match or No Match)
    function resetBoardState() {
        [firstCard, secondCard, lockBoard] = [null, null, false];
    }

    // Handle Game Win Condition
    function winGame() {
        console.log("游戏胜利!");
        stopTimer(); // Stop the game timer

        // Get the text of the selected difficulty
        const difficultyText = difficultySelect.options[difficultySelect.selectedIndex].text;

        // Update and display the win message
        finalDifficultySpan.textContent = difficultyText; // Show difficulty level
        finalMovesSpan.textContent = moves;
        finalTimeSpan.textContent = formatTime(secondsElapsed);
        winMessageDiv.classList.remove('hidden');

        // Ensure info popup is hidden when win message shows
        matchInfoPopup.classList.add('hidden');
        clearTimeout(popupTimeout);
    }

    // --- Event Listeners ---
    restartButton.addEventListener('click', initGame); // Restart button click
    playAgainButton.addEventListener('click', initGame); // Play Again button click (in win message)
    difficultySelect.addEventListener('change', initGame); // Difficulty change re-initializes game

    // --- Start the Game on Page Load ---
    initGame();

}); // End of DOMContentLoaded listener
