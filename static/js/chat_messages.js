// Configure marked.js for markdown rendering
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (e) {}
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// Chat container reference
const chatContainer = document.getElementById('chat-container');

// Auto-scroll state management
let userScrolledAway = false;
const SCROLL_THRESHOLD = 100;

// Track scroll position to detect if user scrolled away
chatContainer.addEventListener('scroll', () => {
    userScrolledAway = !isNearBottom(chatContainer, SCROLL_THRESHOLD);
});

/**
 * Check if container is scrolled near the bottom
 */
function isNearBottom(container, threshold = 100) {
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}

/**
 * Smart auto-scroll that respects user intent
 */
function smartAutoScroll() {
    if (!userScrolledAway) {
        chatContainer.scrollTo({ 
            top: chatContainer.scrollHeight, 
            behavior: 'smooth' 
        });
    }
}

/**
 * Force scroll to bottom (used when new message starts)
 */
function scrollToBottom() {
    userScrolledAway = false;
    chatContainer.scrollTo({ 
        top: chatContainer.scrollHeight, 
        behavior: 'smooth' 
    });
}

/**
 * Add user message to chat
 */
function addUserMessage(message) {
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<p>${DOMPurify.sanitize(message)}</p>`;
    chatContainer.appendChild(userMessage);
    
    // Trigger reflow for animation
    userMessage.offsetHeight;
    userMessage.classList.add('show');
    
    scrollToBottom();
}

/**
 * Create bot message container for streaming with thinking indicator
 */
function createBotMessageContainer() {
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message card mb-3';
    botMessage.innerHTML = `
        <div class="card-body">
            <div class="message-content">
                <div class="thinking-indicator">
                    <div class="d-flex align-items-center text-muted">
                        <div class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">Thinking...</span>
                        </div>
                        <span>Thinking...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    chatContainer.appendChild(botMessage);
    
    // Trigger reflow for animation
    botMessage.offsetHeight;
    botMessage.classList.add('show');
    
    return botMessage.querySelector('.message-content');
}

/**
 * Remove thinking indicator from container
 */
function removeThinkingIndicator(container) {
    const indicator = container.querySelector('.thinking-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const typingTemplate = document.getElementById('typing-indicator');
    if (typingTemplate) {
        const typingIndicator = typingTemplate.content.cloneNode(true);
        chatContainer.appendChild(typingIndicator);
        scrollToBottom();
    }
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingIndicator = chatContainer.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Show code execution indicator
 */
function showCodeExecutionIndicator(container) {
    const indicator = document.createElement('div');
    indicator.className = 'code-execution-indicator';
    indicator.innerHTML = `
        <div class="d-flex align-items-center text-muted mt-2 mb-2">
            <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Running code...</span>
            </div>
            <span>Running code...</span>
        </div>
    `;
    container.appendChild(indicator);
    smartAutoScroll();
    return indicator;
}

/**
 * Remove code execution indicator
 */
function removeCodeExecutionIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.remove();
    }
}

/**
 * Render markdown content with syntax highlighting
 */
function renderMarkdown(content) {
    const html = marked.parse(content);
    return DOMPurify.sanitize(html, {
        ADD_TAGS: ['pre', 'code', 'span', 'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mroot', 'mover', 'munder', 'mtable', 'mtr', 'mtd', 'annotation'],
        ADD_ATTR: ['class', 'style', 'aria-hidden', 'encoding']
    });
}

/**
 * Render LaTeX in a container using KaTeX
 */
function renderLatex(container) {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(container, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\[', right: '\\]', display: true},
                {left: '\\(', right: '\\)', display: false}
            ],
            throwOnError: false,
            errorColor: '#cc0000'
        });
    }
}

/**
 * Render code block with syntax highlighting
 */
function renderCodeBlock(code, label = 'Python Code:') {
    const highlighted = hljs.highlight(code, { language: 'python' }).value;
    return `
        <div class="code-block mt-2 mb-2">
            <small class="text-muted">${label}</small>
            <pre><code class="hljs language-python">${highlighted}</code></pre>
        </div>
    `;
}

/**
 * Render code execution result (plain text, no syntax highlighting)
 */
function renderCodeResult(output) {
    return `
        <div class="code-result mt-2 mb-2">
            <small class="text-muted">Code Output:</small>
            <pre class="output-pre"><code class="output-code">${DOMPurify.sanitize(output)}</code></pre>
        </div>
    `;
}

/**
 * Render inline image
 */
function renderImage(base64Data) {
    return `<img src="data:image/png;base64,${base64Data}" alt="Generated Image" class="img-fluid mt-2 mb-2" style="max-width: 100%; height: auto;"/>`;
}

/**
 * Stream chat response using fetch with SSE
 */
async function streamChatResponse(message, csrfToken) {
    // Create message container
    const contentContainer = createBotMessageContainer();
    
    // State for building the response
    // We maintain separate arrays for different content types to properly order them
    let contentParts = []; // Array of {type: 'text'|'code'|'result'|'image', content: string}
    let currentTextContent = ''; // Accumulator for streaming text
    let codeExecutionIndicator = null;
    let hasReceivedContent = false; // Track if we've received any content yet
    let seenImageData = new Set(); // Track seen images to prevent duplicates
    
    // Function to rebuild the entire content from parts
    function rebuildContent() {
        // Remove thinking indicator on first content
        if (!hasReceivedContent) {
            removeThinkingIndicator(contentContainer);
            hasReceivedContent = true;
        }
        
        let html = '';
        for (const part of contentParts) {
            switch (part.type) {
                case 'text':
                    html += renderMarkdown(part.content);
                    break;
                case 'code':
                    html += renderCodeBlock(part.content);
                    break;
                case 'result':
                    html += renderCodeResult(part.content);
                    break;
                case 'image':
                    html += renderImage(part.content);
                    break;
            }
        }
        // Add current streaming text if any
        if (currentTextContent) {
            html += renderMarkdown(currentTextContent);
        }
        contentContainer.innerHTML = html;
        
        // Render LaTeX expressions
        renderLatex(contentContainer);
    }
    
    try {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('csrfmiddlewaretoken', csrfToken);
        
        const response = await fetch('/api/chat/stream/', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            // Remove thinking indicator before showing error
            removeThinkingIndicator(contentContainer);
            hasReceivedContent = true;
            
            let errorMessage = `Server error (${response.status})`;
            if (response.status === 503) {
                errorMessage = 'The model is currently unavailable. Please try again in a moment.';
            } else if (response.status === 429) {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (response.status === 500) {
                errorMessage = 'An internal server error occurred. Please try again.';
            }
            
            contentContainer.innerHTML = `<p class="text-danger"><strong>Error:</strong> ${errorMessage}</p>`;
            return;
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        switch (data.type) {
                            case 'text':
                                // Remove code execution indicator if present
                                removeCodeExecutionIndicator(codeExecutionIndicator);
                                codeExecutionIndicator = null;
                                
                                // Accumulate text and re-render
                                currentTextContent += data.content;
                                rebuildContent();
                                smartAutoScroll();
                                break;
                                
                            case 'code':
                                // Finalize any current text as a part
                                if (currentTextContent) {
                                    contentParts.push({ type: 'text', content: currentTextContent });
                                    currentTextContent = '';
                                }
                                
                                // Add code block
                                contentParts.push({ type: 'code', content: data.content });
                                rebuildContent();
                                
                                // Show code execution indicator
                                codeExecutionIndicator = showCodeExecutionIndicator(contentContainer);
                                break;
                                
                            case 'result':
                                // Remove code execution indicator
                                removeCodeExecutionIndicator(codeExecutionIndicator);
                                codeExecutionIndicator = null;
                                
                                // Add result
                                contentParts.push({ type: 'result', content: data.content });
                                rebuildContent();
                                smartAutoScroll();
                                break;
                                
                            case 'image':
                                // Remove code execution indicator if present
                                removeCodeExecutionIndicator(codeExecutionIndicator);
                                codeExecutionIndicator = null;
                                
                                // Finalize any current text
                                if (currentTextContent) {
                                    contentParts.push({ type: 'text', content: currentTextContent });
                                    currentTextContent = '';
                                }
                                if (data.content && seenImageData.has(data.content)) {
                                    break;
                                } else {
                                    if (data.content) {
                                        seenImageData.add(data.content);
                                    }
                                    
                                    // Add image
                                    contentParts.push({ type: 'image', content: data.content });
                                    rebuildContent();
                                    smartAutoScroll();
                                }
                                break;
                                
                            case 'error':
                                contentContainer.innerHTML += `<p class="text-danger"><strong>Error:</strong> ${DOMPurify.sanitize(data.content)}</p>`;
                                smartAutoScroll();
                                break;
                                
                            case 'done':
                                // Finalize any remaining text
                                if (currentTextContent) {
                                    contentParts.push({ type: 'text', content: currentTextContent });
                                    currentTextContent = '';
                                    rebuildContent();
                                }
                                
                                // Apply final syntax highlighting to code blocks (but not output blocks)
                                contentContainer.querySelectorAll('pre code:not(.hljs):not(.output-code)').forEach((block) => {
                                    hljs.highlightElement(block);
                                });
                                break;
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e, line);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Streaming error:', error);
        // Remove thinking indicator if still present
        removeThinkingIndicator(contentContainer);
        contentContainer.innerHTML += `<p class="text-danger"><strong>Error:</strong> ${DOMPurify.sanitize(error.message)}</p>`;
    } finally {
        // Always clean up indicators regardless of success/failure
        removeThinkingIndicator(contentContainer);
        removeCodeExecutionIndicator(codeExecutionIndicator);
        smartAutoScroll();
    }
}

/**
 * Handle form submission for streaming
 */
async function handleStreamSubmit(event) {
    event.preventDefault();
    
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Get CSRF token
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    
    // Add user message to chat
    addUserMessage(message);
    
    // Clear input
    messageInput.value = '';
    
    // Start streaming response (thinking indicator is shown in the message container)
    await streamChatResponse(message, csrfToken);
}

// File validation function
function validateFileSize() {
    const fileInput = document.querySelector("input[name='file']");
    const file = fileInput.files[0];
    const maxSize = 2 * 1024 * 1024; // 2 MB

    if (file && file.size > maxSize) {
        alert('File size exceeds 2 MB. Please upload a smaller file.');
        return false;
    }
    return true;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    scrollToBottom();
});
