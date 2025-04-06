document.addEventListener('DOMContentLoaded', () => {
    const assistantButton = document.getElementById('ai-assistant-button');
    const chatWindow = document.getElementById('ai-chat-window');
    const closeChatButton = document.getElementById('close-chat-button');

    // 检查当前是否在主 QA 页面
    if (window.location.pathname === '/qa') {
        if (assistantButton) {
            assistantButton.style.display = 'none'; // 在 /qa 页面隐藏按钮
        }
        // 可选：如果聊天窗口也不应出现在 /qa 上，则隐藏它
        // if (chatWindow) {
        //     chatWindow.style.display = 'none';
        // }
        // return; // 已移除: 允许脚本继续执行菜单切换逻辑
    }

    // AI 助手逻辑
    if (assistantButton && chatWindow && closeChatButton) {
        // 点击助手按钮时切换聊天窗口的可见性
        assistantButton.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
        });

        // 点击关闭按钮时隐藏聊天窗口
        closeChatButton.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
        });

        // 可选：如果点击聊天窗口外部则隐藏它
        // document.addEventListener('click', (event) => {
        //     if (!chatWindow.contains(event.target) && !assistantButton.contains(event.target)) {
        //         chatWindow.classList.add('hidden');
        //     }
        // });
    } else {
        console.error("AI Assistant elements not found on a non-QA page!");
    }

    // 汉堡菜单切换逻辑
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            // 切换按钮上的 'active' 类以进行样式设置（X 图标）
            menuToggle.classList.toggle('active');

            // 切换导航链接上的 'nav-active' 类以显示/隐藏
            navLinks.classList.toggle('nav-active');

            // 更新 aria-expanded 属性以提高可访问性
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // 可选：点击链接时关闭菜单（对单页应用或平滑滚动有用）
        // navLinks.querySelectorAll('a').forEach(link => {
        //     link.addEventListener('click', () => {
        //         if (navLinks.classList.contains('nav-active')) {
        //             menuToggle.classList.remove('active');
        //             navLinks.classList.remove('nav-active');
        //             menuToggle.setAttribute('aria-expanded', 'false');
        //         }
        //     });
        // });

        // 可选：如果点击菜单外部则关闭它
        // document.addEventListener('click', (event) => {
        //     const isClickInsideNav = navLinks.contains(event.target);
        //     const isClickOnToggle = menuToggle.contains(event.target);
        //
        //     if (!isClickInsideNav && !isClickOnToggle && navLinks.classList.contains('nav-active')) {
        //         menuToggle.classList.remove('active');
        //         navLinks.classList.remove('nav-active');
        //         menuToggle.setAttribute('aria-expanded', 'false');
        //     }
        // });

    } else {
         // 仅在预期菜单切换时记录错误（即，如果需要，不在特定页面上）
         // console.error("未找到菜单切换或导航链接元素!");
    }
}); // DOMContentLoaded 结束