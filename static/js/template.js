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
        return; // Stop further processing for the button/window on this page
    }

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
});