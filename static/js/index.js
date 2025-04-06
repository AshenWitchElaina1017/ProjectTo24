document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素选择 ---
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselSlide = document.querySelector('.carousel-slide');
    const carouselDotsContainer = document.querySelector('.carousel-dots');
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    const seasonTabs = document.querySelectorAll('.season-btn');
    const termsDisplay = document.querySelector('.terms-display');
    const termDetailsContainer = document.getElementById('term-details');

    // --- 状态变量 ---
    let allSolarTermsData = [];
    let currentCarouselIndex = 0;
    let carouselInterval;
    const totalImages = 24; // 图片总数（01.png 到 24.png）
    const imageBaseUrl = '/static/images/'; // 图片的基础路径
    const jsonUrl = '/static/data/solar_terms.json'; // JSON 数据的路径

    // --- 函数定义 ---

    /**
     * 从 JSON 文件获取节气数据。
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
                initializePage(); // 数据加载后初始化
            })
            .catch(error => {
                console.error('无法加载节气数据:', error);
                termsDisplay.innerHTML = '<p>无法加载节气信息，请刷新页面或联系管理员。</p>';
                termDetailsContainer.innerHTML = ''; // 出错时清除详情区域
                // 可选：如果数据加载失败则禁用轮播图？或者让它仅用图片运行。
                if (carouselSlide && carouselDotsContainer && prevButton && nextButton) {
                     setupCarousel(); // 即使数据加载失败，如果图片存在，也设置轮播图
                } else {
                    console.error("轮播图必需的HTML元素未找到！");
                }
            });
    }

    /**
     * 初始化页面：设置轮播图，显示初始节气和详情。
     */
    function initializePage() {
        if (!carouselSlide || !carouselDotsContainer || !prevButton || !nextButton) {
             console.error("轮播图必需的HTML元素未找到！无法初始化轮播图。");
             // 如果可能，继续初始化节气/详情
        } else {
             setupCarousel(); // 现在数据可能已准备好，设置轮播图
        }


        // 显示默认季节（春季）的节气
        displayTermsForSeason('Spring');

        // Display details for the first term of the default season
        if (allSolarTermsData.length > 0) {
            const defaultSeason = 'Spring'; // 或获取活动选项卡的季节
            const firstTermOfDefaultSeason = allSolarTermsData.find(term => term.season === defaultSeason);
            if (firstTermOfDefaultSeason) {
                displayTermDetails(firstTermOfDefaultSeason.id);
                // Highlight the corresponding term button after a brief delay
                 setTimeout(() => highlightSelectedTerm(firstTermOfDefaultSeason.id), 50); // 短暂延迟
            } else {
                termDetailsContainer.innerHTML = `<p>请选择一个节气查看详细介绍。</p>`;
            }
        } else {
             termDetailsContainer.innerHTML = `<p>未能加载节气数据。</p>`;
        }
    }

    /**
     * 设置图片轮播图，包括图片、指示点、控件和自动播放。
     */
    function setupCarousel() {
        carouselSlide.innerHTML = ''; // 清除先前内容
        carouselDotsContainer.innerHTML = ''; // 清除先前的指示点

        // 生成图片和指示点
        for (let i = 1; i <= totalImages; i++) {
            const img = document.createElement('img');
            const imageName = String(i).padStart(2, '0') + '.png';
            img.src = `${imageBaseUrl}${imageName}`;
            img.alt = `二十四节气图片 ${i}`;
            if (i === 1) img.classList.add('active'); // 默认第一张图片为活动状态
            carouselSlide.appendChild(img);

            const dot = document.createElement('span');
            dot.classList.add('carousel-dot');
            if (i === 1) dot.classList.add('active');
            dot.dataset.index = i - 1; // 存储索引（从 0 开始）
            carouselDotsContainer.appendChild(dot);
        }

        const images = carouselSlide.querySelectorAll('img');
        const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');

        // 按索引显示特定幻灯片的函数
        function showSlide(index) {
            index = (index + totalImages) % totalImages; // 确保索引在边界内
            images.forEach((img, i) => img.classList.toggle('active', i === index));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
            currentCarouselIndex = index;
        }

        // 自动播放功能
        function startCarousel() {
            stopCarousel(); // 首先清除现有的 interval
            carouselInterval = setInterval(() => {
                showSlide(currentCarouselIndex + 1);
            }, 3000); // 每 3 秒更换幻灯片
        }

        function stopCarousel() {
            clearInterval(carouselInterval);
        }

        // 控件和指示点的事件监听器
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                stopCarousel();
                showSlide(parseInt(e.target.dataset.index, 10));
                startCarousel(); // 手动交互后重新启动自动播放
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

        // 悬停时暂停
        carouselContainer.addEventListener('mouseenter', stopCarousel);
        carouselContainer.addEventListener('mouseleave', startCarousel);

        startCarousel(); // 初始启动自动播放
    }

    /**
     * 显示所选季节的节气列表。
     * @param {string} season - 季节标识符（'Spring', 'Summer' 等）。
     */
    function displayTermsForSeason(season) {
        const terms = allSolarTermsData.filter(term => term.season === season);
        termsDisplay.innerHTML = ''; // 清除先前的节气按钮

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
                    highlightSelectedTerm(term.id); // 高亮点击的节气
                });
                termsDisplay.appendChild(termButton);
            });
        } else {
            termsDisplay.innerHTML = `<p>暂无 ${season} 季节的节气信息。</p>`;
        }
    }

    /**
     * 高亮当前选中的节气按钮并移除其他按钮的高亮。
     * @param {string} termId - 要高亮的节气的 ID。
     */
    function highlightSelectedTerm(termId) {
        document.querySelectorAll('.term-item-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.termId === termId);
        });
    }

    /**
     * 显示特定节气的详细信息。
     * @param {string} termId - 节气的 ID。
     */
    function displayTermDetails(termId) {
        const term = allSolarTermsData.find(t => t.id === termId);
        if (term) {
            // 构建详情的 HTML 字符串
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

    // --- 事件监听器 ---

    // 季节选项卡点击
    seasonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            seasonTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const season = tab.dataset.season;
            displayTermsForSeason(season);

            // 显示新选定季节的第一个节气或提示
            const firstTermOfSeason = allSolarTermsData.find(term => term.season === season);
            if (firstTermOfSeason) {
                displayTermDetails(firstTermOfSeason.id);
                 // 短暂延迟后高亮第一个节气按钮
                 setTimeout(() => highlightSelectedTerm(firstTermOfSeason.id), 50);
            } else {
                termDetailsContainer.innerHTML = `<p>请选择一个节气查看详细介绍。</p>`;
            }
        });
    });

    // --- 初始加载 ---
    loadSolarTermData(); // 通过加载数据开始流程

}); // DOMContentLoaded 结束
