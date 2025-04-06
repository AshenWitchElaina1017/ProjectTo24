document.addEventListener('DOMContentLoaded', () => {
    const assistantButton = document.getElementById('ai-assistant-button');
    const chatWindow = document.getElementById('ai-chat-window');
    const closeChatButton = document.getElementById('close-chat-button');

    // Check if we are on the main QA page
    if (window.location.pathname === '/qa') {
        if (assistantButton) {
            assistantButton.style.display = 'none'; // Hide the button on the /qa page
        }
        // Optionally hide the chat window as well if it shouldn't appear on /qa
        // if (chatWindow) {
        //     chatWindow.style.display = 'none';
        // }
        // return; // REMOVED: Allow script to continue for menu toggle logic
    }

    // AI Assistant Logic
    if (assistantButton && chatWindow && closeChatButton) {
        // Toggle chat window visibility when assistant button is clicked
        assistantButton.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
        });

        // Hide chat window when close button is clicked
        closeChatButton.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
        });

        // Optional: Hide chat window if clicked outside of it
        // document.addEventListener('click', (event) => {
        //     if (!chatWindow.contains(event.target) && !assistantButton.contains(event.target)) {
        //         chatWindow.classList.add('hidden');
        //     }
        // });
    } else {
        console.error("AI Assistant elements not found on a non-QA page!");
    }

    // Hamburger Menu Toggle Logic
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            // Toggle the 'active' class on the button for styling (X icon)
            menuToggle.classList.toggle('active');

            // Toggle the 'nav-active' class on the nav links to show/hide
            navLinks.classList.toggle('nav-active');

            // Update aria-expanded attribute for accessibility
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Optional: Close menu when a link is clicked (useful for single-page apps or smooth scrolling)
        // navLinks.querySelectorAll('a').forEach(link => {
        //     link.addEventListener('click', () => {
        //         if (navLinks.classList.contains('nav-active')) {
        //             menuToggle.classList.remove('active');
        //             navLinks.classList.remove('nav-active');
        //             menuToggle.setAttribute('aria-expanded', 'false');
        //         }
        //     });
        // });

        // Optional: Close menu if clicked outside of it
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
         // Only log error if menu toggle is expected (i.e., not on specific pages if needed)
         // console.error("Menu toggle or nav links element not found!");
    }
}); // End of DOMContentLoaded