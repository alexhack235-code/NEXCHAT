/**
 * ChatGPT Integration Example for NEXCHAT
 * Add this code to your chat.js or chat interface
 * This shows how to use ChatGPT as your AI engine
 */

import { chronexAI } from './chronex-ai-service.js';

// ============ INITIALIZATION ============
// Call this when app starts
export async function initializeAI() {
  // Check if API key exists in localStorage
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    console.log(' No API key found. Prompting user...');
    // Option 1: Prompt user in console
    // const key = prompt('Enter your OpenAI API Key:');
    
    // Option 2: Redirect to setup page
    window.location.href = 'setup-chatgpt.html';
    return;
  }
  
  // Configure ChatGPT
  chronexAI.setOpenAIKey(apiKey);
  console.log(' ChatGPT initialized and ready!');
  return true;
}

// ============ SEND MESSAGE FUNCTION ============
// Replace your existing sendMessage function with this
export async function sendMessage(userMessage) {
  try {
    // Show loading indicator
    showLoadingIndicator(true);
    
    // Get AI response (uses ChatGPT with fallback to local model)
    const aiResponse = await chronexAI.getSmartResponse(userMessage);
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }
    
    // Display response in chat UI
    displayAIMessage(aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.error(' Error:', error);
    displayAIMessage(` Error: ${error.message}`);
  } finally {
    showLoadingIndicator(false);
  }
}

// ============ WITH CONVERSATION HISTORY ============
// Keep track of full conversation for better context
let conversationHistory = [];

export async function sendMessageWithHistory(userMessage) {
  try {
    showLoadingIndicator(true);
    
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });
    
    // Call ChatGPT with full history (better context)
    const aiResponse = await chronexAI.callChatGPT(
      userMessage,
      conversationHistory
    );
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }
    
    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse
    });
    
    // Display response
    displayAIMessage(aiResponse);
    
    // Save conversation to localStorage
    saveConversation(conversationHistory);
    
    return aiResponse;
  } catch (error) {
    console.error(' Error:', error);
    displayAIMessage(` Error: ${error.message}`);
  } finally {
    showLoadingIndicator(false);
  }
}

// ============ LOAD CONVERSATION HISTORY ============
export function loadConversationHistory() {
  const saved = localStorage.getItem('chat_history');
  if (saved) {
    try {
      conversationHistory = JSON.parse(saved);
      console.log(' Previous conversation loaded');
    } catch (e) {
      console.warn('Could not load conversation');
    }
  }
}

// ============ SAVE CONVERSATION ============
export function saveConversation(history) {
  try {
    localStorage.setItem('chat_history', JSON.stringify(history));
  } catch (e) {
    console.warn('Could not save conversation');
  }
}

// ============ CLEAR CONVERSATION ============
export function clearConversation() {
  conversationHistory = [];
  localStorage.removeItem('chat_history');
  console.log(' Conversation cleared');
}

// ============ UI HELPER FUNCTIONS ============
function showLoadingIndicator(show) {
  const loader = document.getElementById('loader') || 
                 document.querySelector('.loader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}

function displayAIMessage(message) {
  // Add message to chat UI
  const chatBox = document.getElementById('chatBox') || 
                  document.querySelector('.chat-box');
  
  if (chatBox) {
    const msgElement = document.createElement('div');
    msgElement.className = 'message ai-message';
    msgElement.innerHTML = message; // Use innerHTML for markdown support
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function displayUserMessage(message) {
  const chatBox = document.getElementById('chatBox') || 
                  document.querySelector('.chat-box');
  
  if (chatBox) {
    const msgElement = document.createElement('div');
    msgElement.className = 'message user-message';
    msgElement.textContent = message;
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// ============ CHAT INPUT HANDLER ============
// Add this to your chat input form
export function setupChatInput() {
  const input = document.getElementById('chatInput') || 
                document.querySelector('input[placeholder*="message"]');
  const sendBtn = document.getElementById('sendBtn') || 
                  document.querySelector('button[type="submit"]');
  
  if (!input || !sendBtn) {
    console.warn('Chat input elements not found');
    return;
  }
  
  // Handle Enter key
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  // Handle send button
  sendBtn.addEventListener('click', handleSendMessage);
  
  async function handleSendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
    // Display user message
    displayUserMessage(message);
    input.value = '';
    input.focus();
    
    // Get AI response with history
    await sendMessageWithHistory(message);
  }
}

// ============ SPECIAL COMMANDS ============
// Add slash commands for advanced features
export function handleSpecialCommands(message) {
  if (message.startsWith('/')) {
    const [command, ...args] = message.slice(1).split(' ');
    
    switch (command.toLowerCase()) {
      case 'reset':
        clearConversation();
        displayAIMessage(' Conversation cleared!');
        return true;
        
      case 'clear':
        clearConversation();
        displayAIMessage(' Chat cleared!');
        return true;
        
      case 'model':
        const modelName = chronexAI.config.model.name;
        displayAIMessage(` Current model: **${modelName}**`);
        return true;
        
      case 'tokens':
        const maxTokens = chronexAI.config.model.maxTokens;
        displayAIMessage(` Max tokens: **${maxTokens}**`);
        return true;
        
      case 'setup':
        window.location.href = 'setup-chatgpt.html';
        return true;
        
      case 'help':
        const help = `
**Available Commands:**
- /reset - Clear conversation
- /clear - Clear chat
- /model - Show AI model
- /tokens - Show max tokens
- /setup - Configure API key
- /help - Show this help
        `;
        displayAIMessage(help);
        return true;
        
      default:
        displayAIMessage(` Unknown command: /${command}`);
        return true;
    }
  }
  return false;
}

// ============ MAIN INITIALIZATION ============
// Call this when your page loads
export async function initializeChat() {
  console.log(' Initializing NEXCHAT with ChatGPT...');
  
  // Load AI engine
  await initializeAI();
  
  // Load conversation history
  loadConversationHistory();
  
  // Setup input handlers
  setupChatInput();
  
  console.log(' Chat initialized and ready!');
}

// Example usage in HTML:
/*
<script type="module">
  import { initializeChat, sendMessageWithHistory, handleSpecialCommands } from './chat-gpt-integration.js';
  
  // Initialize on page load
  window.addEventListener('load', initializeChat);
</script>
*/
