// Initialize Socket.IO
const socket = io();

// Global state
let currentUserId = null;
let currentUsername = null;
let currentUserOnline = false;
let typingTimeout = null;

// Connect to Socket.IO
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Handle user status updates
socket.on('user_status', (data) => {
    updateUserStatus(data.user_id, data.is_online);
});

// Handle new messages
socket.on('new_message', (data) => {
    // If the message is for the current chat, display it
    if (currentUserId && 
        ((data.sender_id === currentUserId && data.receiver_id === getCurrentUserId()) ||
         (data.sender_id === getCurrentUserId() && data.receiver_id === currentUserId))) {
        displayMessage(data);
        scrollToBottom();
    }
});

// Handle typing indicator
socket.on('user_typing', (data) => {
    if (currentUserId && data.user_id === currentUserId && data.receiver_id === getCurrentUserId()) {
        const typingIndicator = document.getElementById('typing-indicator');
        if (data.is_typing) {
            typingIndicator.style.display = 'block';
        } else {
            typingIndicator.style.display = 'none';
        }
    }
});

// Get current user ID from the DOM
function getCurrentUserId() {
    const usersContainer = document.getElementById('users-container');
    return parseInt(usersContainer.dataset.currentUserId || '0');
}

// Select a user to chat with
function selectUser(userId, username) {
    currentUserId = userId;
    currentUsername = username;
    
    // Update active state in sidebar
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-user-id="${userId}"]`).classList.add('active');
    
    // Show chat interface
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('chat-header').style.display = 'flex';
    document.getElementById('messages-container').style.display = 'block';
    document.getElementById('message-input-container').style.display = 'block';
    
    // Update chat header
    document.getElementById('chat-avatar').textContent = username[0].toUpperCase();
    document.getElementById('chat-username').textContent = username;
    
    // Update online status
    const userItem = document.querySelector(`[data-user-id="${userId}"]`);
    const statusElement = userItem.querySelector('.user-status');
    currentUserOnline = statusElement.classList.contains('online');
    updateChatHeaderStatus();
    
    // Load messages
    loadMessages(userId);
    
    // Clear message input
    document.getElementById('message-input').value = '';
    document.getElementById('message-input').focus();
    
    // Hide typing indicator
    document.getElementById('typing-indicator').style.display = 'none';
}

// Update chat header status
function updateChatHeaderStatus() {
    const chatStatus = document.getElementById('chat-status');
    const statusText = document.getElementById('status-text');
    
    if (currentUserOnline) {
        chatStatus.classList.add('online');
        chatStatus.classList.remove('offline');
        statusText.textContent = 'Online';
    } else {
        chatStatus.classList.add('offline');
        chatStatus.classList.remove('online');
        statusText.textContent = 'Offline';
    }
}

// Update user status in sidebar
function updateUserStatus(userId, isOnline) {
    const userItem = document.querySelector(`[data-user-id="${userId}"]`);
    if (userItem) {
        const statusElement = userItem.querySelector('.user-status');
        if (isOnline) {
            statusElement.classList.add('online');
            statusElement.classList.remove('offline');
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Online';
        } else {
            statusElement.classList.add('offline');
            statusElement.classList.remove('online');
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Offline';
        }
        
        // Update chat header if this is the current user
        if (currentUserId === userId) {
            currentUserOnline = isOnline;
            updateChatHeaderStatus();
        }
    }
}

// Load messages for a user
async function loadMessages(userId) {
    try {
        const response = await fetch(`/api/messages/${userId}`);
        const messages = await response.json();
        
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => {
            displayMessage(msg);
        });
        
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display a message
function displayMessage(message) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    
    const isSent = message.sender_id === getCurrentUserId();
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message.content;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(message.timestamp);
    
    bubble.appendChild(content);
    bubble.appendChild(time);
    messageDiv.appendChild(bubble);
    
    messagesContainer.appendChild(messageDiv);
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    if (messageDate.getTime() === today.getTime()) {
        return timeStr;
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
        return `Yesterday ${timeStr}`;
    } else {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${timeStr}`;
    }
}

// Scroll to bottom of messages
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
function sendMessage(event) {
    event.preventDefault();
    
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    
    if (!content || !currentUserId) {
        return;
    }
    
    // Send message via Socket.IO
    socket.emit('send_message', {
        receiver_id: currentUserId,
        content: content
    });
    
    // Clear input
    messageInput.value = '';
    
    // Stop typing indicator
    socket.emit('typing', {
        receiver_id: currentUserId,
        is_typing: false
    });
    
    // Focus input
    messageInput.focus();
}

// Handle typing
function handleTyping() {
    if (!currentUserId) return;
    
    // Send typing indicator
    socket.emit('typing', {
        receiver_id: currentUserId,
        is_typing: true
    });
    
    // Clear previous timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Set timeout to stop typing indicator
    typingTimeout = setTimeout(() => {
        socket.emit('typing', {
            receiver_id: currentUserId,
            is_typing: false
        });
    }, 1000);
}

// Store current user ID in the container
document.addEventListener('DOMContentLoaded', () => {
    // Try to extract current user ID from the page
    const userAvatar = document.querySelector('.sidebar-header .user-avatar');
    if (userAvatar) {
        // We'll need to get this from the template or add it
        const usersContainer = document.getElementById('users-container');
        // The user ID will be determined by the backend session
    }
});

