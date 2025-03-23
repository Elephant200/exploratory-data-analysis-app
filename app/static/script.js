document.body.addEventListener('htmx:beforeRequest', function(event) {
    var message = document.getElementById('message-input').value;
    var chatContainer = document.getElementById('chat-container');
    
    var userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<p>${message}</p>`;
    chatContainer.appendChild(userMessage);
    
    userMessage.offsetHeight;
    
    userMessage.classList.add('show');
    
    document.getElementById('message-input').value = '';
    
    var typingIndicator = document.getElementById('typing-indicator').content.cloneNode(true);
    chatContainer.appendChild(typingIndicator);
});

document.body.addEventListener('htmx:afterSwap', function(event) {
    var chatContainer = document.getElementById('chat-container');
    
    var typingIndicator = chatContainer.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    var newMessage = chatContainer.lastElementChild;
    
    newMessage.offsetHeight;
    
    newMessage.classList.add('show');
});

function scrollToLastMessage() {
    const chatContainer = document.getElementById('chat-container');
    const lastMessage = chatContainer.lastElementChild;
    if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

const chatContainer = document.getElementById('chat-container');
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            scrollToLastMessage();
            break;
        }
    }
});

observer.observe(chatContainer, { childList: true });

document.addEventListener('DOMContentLoaded', scrollToLastMessage);