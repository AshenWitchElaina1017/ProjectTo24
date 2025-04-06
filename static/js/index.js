document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselSlide = document.querySelector('.carousel-slide');
    const carouselDotsContainer = document.querySelector('.carousel-dots');
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    const seasonTabs = document.querySelectorAll('.season-btn');
    const termsDisplay = document.querySelector('.terms-display');
    const termDetailsContainer = document.getElementById('term-details');

    // --- State Variables ---
    let allSolarTermsData = [];
    let currentCarouselIndex = 0;
    let carouselInterval;
    const totalImages = 24; // Total number of images (01.png to 24.png)
    const imageBaseUrl = '/static/images/'; // Base path for images
    const jsonUrl = '/static/data/solar_terms.json'; // Path to your JSON data

    // --- Function Definitions ---

    /**
     * Fetches solar term data from the JSON file.
     */
    function loadSolarTermData() {
        fetch(jsonUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                allSolarTermsData = data.solar_terms;
                console.log("节气数据加载成功:", allSolarTermsData);
                initializePage(); // Initialize after data is loaded
            })
            .catch(error => {
                console.error('无法加载节气数据:', error);
                termsDisplay.innerHTML = '<p>无法加载节气信息，请刷新页面或联系管理员。</p>';
                termDetailsContainer.innerHTML = ''; // Clear details area on error
                // Optionally disable carousel if data fails? Or let it run with images.
                if (carouselSlide && carouselDotsContainer && prevButton && nextButton) {
                     setupCarousel(); // Setup carousel even if data fails, if images exist
                } else {
                    console.error("轮播图必需的HTML元素未找到！");
                }
            });
    }

    /**
     * Initializes the page: sets up carousel, displays initial terms and details.
     */
    function initializePage() {
        if (!carouselSlide || !carouselDotsContainer || !prevButton || !nextButton) {
             console.error("轮播图必需的HTML元素未找到！无法初始化轮播图。");
             // Proceed with initializing terms/details if possible
        } else {
             setupCarousel(); // Setup carousel now that data is potentially ready
        }


        // Display terms for the default season (Spring)
        displayTermsForSeason('Spring');

        // Display details for the first term of the default season
        if (allSolarTermsData.length > 0) {
            const defaultSeason = 'Spring'; // Or get active tab's season
            const firstTermOfDefaultSeason = allSolarTermsData.find(term => term.season === defaultSeason);
            if (firstTermOfDefaultSeason) {
                displayTermDetails(firstTermOfDefaultSeason.id);
                // Highlight the corresponding term button after a brief delay
                 setTimeout(() => highlightSelectedTerm(firstTermOfDefaultSeason.id), 50); // Small delay
            } else {
                termDetailsContainer.innerHTML = `<p>请选择一个节气查看详细介绍。</p>`;
            }
        } else {
             termDetailsContainer.innerHTML = `<p>未能加载节气数据。</p>`;
        }
    }

    /**
     * Sets up the image carousel, including images, dots, controls, and auto-play.
     */
    function setupCarousel() {
        carouselSlide.innerHTML = ''; // Clear previous content
        carouselDotsContainer.innerHTML = ''; // Clear previous dots

        // Generate images and dots
        for (let i = 1; i <= totalImages; i++) {
            const img = document.createElement('img');
            const imageName = String(i).padStart(2, '0') + '.png';
            img.src = `${imageBaseUrl}${imageName}`;
            img.alt = `二十四节气图片 ${i}`;
            if (i === 1) img.classList.add('active'); // First image active by default
            carouselSlide.appendChild(img);

            const dot = document.createElement('span');
            dot.classList.add('carousel-dot');
            if (i === 1) dot.classList.add('active');
            dot.dataset.index = i - 1; // Store index (0-based)
            carouselDotsContainer.appendChild(dot);
        }

        const images = carouselSlide.querySelectorAll('img');
        const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');

        // Function to show a specific slide by index
        function showSlide(index) {
            index = (index + totalImages) % totalImages; // Ensure index is within bounds
            images.forEach((img, i) => img.classList.toggle('active', i === index));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
            currentCarouselIndex = index;
        }

        // Auto-play functionality
        function startCarousel() {
            stopCarousel(); // Clear existing interval first
            carouselInterval = setInterval(() => {
                showSlide(currentCarouselIndex + 1);
            }, 3000); // Change slide every 3 seconds
        }

        function stopCarousel() {
            clearInterval(carouselInterval);
        }

        // Event listeners for controls and dots
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                stopCarousel();
                showSlide(parseInt(e.target.dataset.index, 10));
                startCarousel(); // Restart auto-play after manual interaction
            });
        });

        prevButton.addEventListener('click', () => {
            stopCarousel();
            showSlide(currentCarouselIndex - 1);
            startCarousel();
        });

        nextButton.addEventListener('click', () => {
            stopCarousel();
            showSlide(currentCarouselIndex + 1);
            startCarousel();
        });

        // Pause on hover
        carouselContainer.addEventListener('mouseenter', stopCarousel);
        carouselContainer.addEventListener('mouseleave', startCarousel);

        startCarousel(); // Start the auto-play initially
    }

    /**
     * Displays the list of solar terms for the selected season.
     * @param {string} season - The season identifier ('Spring', 'Summer', etc.).
     */
    function displayTermsForSeason(season) {
        const terms = allSolarTermsData.filter(term => term.season === season);
        termsDisplay.innerHTML = ''; // Clear previous term buttons

        if (terms.length > 0) {
            terms.forEach(term => {
                const termButton = document.createElement('button');
                termButton.classList.add('term-item-btn');
                termButton.dataset.termId = term.id;
                termButton.innerHTML = `
                    ${term.icon ? `<span class="term-icon">${term.icon}</span>` : ''}
                    ${term.name}
                `;
                termButton.addEventListener('click', () => {
                    displayTermDetails(term.id);
                    highlightSelectedTerm(term.id); // Highlight clicked term
                });
                termsDisplay.appendChild(termButton);
            });
        } else {
            termsDisplay.innerHTML = `<p>暂无 ${season} 季节的节气信息。</p>`;
        }
    }

    /**
     * Highlights the currently selected term button and removes highlight from others.
     * @param {string} termId - The ID of the term to highlight.
     */
    function highlightSelectedTerm(termId) {
        document.querySelectorAll('.term-item-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.termId === termId);
        });
    }

    /**
     * Displays the detailed information for a specific solar term.
     * @param {string} termId - The ID of the solar term.
     */
    function displayTermDetails(termId) {
        const term = allSolarTermsData.find(t => t.id === termId);
        if (term) {
            // Build the HTML string for details
            let detailsHtml = `
                <h3>
                    ${term.icon ? `<span class="term-icon">${term.icon}</span>` : ''}
                    ${term.name} (${term.pinyin || ''})
                 </h3>
                <p><strong>日期:</strong> ${term.date_range || '未知'}</p>
                <p><strong>描述:</strong> ${term.description || '暂无描述'}</p>`;

            if (term.phenology && term.phenology.length > 0) {
                detailsHtml += `<p><strong>物候:</strong></p><ul>${term.phenology.map(p => `<li>${p}</li>`).join('')}</ul>`;
            }
            if (term.customs) {
                detailsHtml += `<p><strong>习俗:</strong> ${term.customs}</p>`;
            }
            if (term.farming) {
                detailsHtml += `<p><strong>农事:</strong> ${term.farming}</p>`;
            }
            if (term.health_tips) {
                detailsHtml += `<p><strong>养生:</strong> ${term.health_tips}</p>`;
            }
            if (term.tagline) {
                detailsHtml += `<p><em>${term.tagline}</em></p>`;
            }

            termDetailsContainer.innerHTML = detailsHtml;
        } else {
            termDetailsContainer.innerHTML = `<p>未能找到ID为 ${termId} 的节气信息。</p>`;
        }
    }

    // --- Event Listeners ---

    // Season Tab Clicks
    seasonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            seasonTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const season = tab.dataset.season;
            displayTermsForSeason(season);

            // Display first term of the newly selected season or a prompt
            const firstTermOfSeason = allSolarTermsData.find(term => term.season === season);
            if (firstTermOfSeason) {
                displayTermDetails(firstTermOfSeason.id);
                 // Highlight the first term button after a brief delay
                 setTimeout(() => highlightSelectedTerm(firstTermOfSeason.id), 50);
            } else {
                termDetailsContainer.innerHTML = `<p>请选择一个节气查看详细介绍。</p>`;
            }
        });
    });

    // --- Initial Load ---
    loadSolarTermData(); // Start the process by loading the data

}); // End of DOMContentLoaded
