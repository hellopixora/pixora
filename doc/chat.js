/* ============================================================
   CHAT PAGE — Messaging interactions
   ============================================================ */

'use strict';

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Auto-remove typing indicator after a short delay on load
const typingIndicator = document.getElementById('typingIndicator');
if (typingIndicator) {
  setTimeout(() => typingIndicator.style.display = 'none', 3500);
}

// === SEND MESSAGE ===
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const msgGroup = document.createElement('div');
  msgGroup.className = 'msg-group sent';
  msgGroup.innerHTML = `
    <div class="msg-stack">
      <div class="msg-bubble sent">${escapeHtml(text)}</div>
      <span class="msg-time">Just now</span>
    </div>
  `;
  // Insert before typing indicator or at end
  chatMessages.appendChild(msgGroup);
  messageInput.value = '';
  messageInput.style.height = 'auto';
  scrollToBottom();

  // Simulate doctor typing then responding
  setTimeout(() => showTyping(), 800);
  setTimeout(() => receiveAutoReply(text), 3500);
}

const autoReplies = [
  "Thank you for reaching out. I'll review this and get back to you shortly.",
  "Noted — this is helpful context. I'll factor it into your care plan.",
  "I understand. Let's discuss this further at your upcoming appointment.",
  "Good question. As a general rule, please monitor any symptoms closely and contact us if they worsen.",
  "I've added this to your care notes. If anything changes, don't hesitate to message me.",
];

function receiveAutoReply(userMsg) {
  hideTyping();
  const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
  const msgGroup = document.createElement('div');
  msgGroup.className = 'msg-group received';
  const initials = document.getElementById('activeContactName')?.textContent.split(' ').map(w => w[0]).join('').slice(0, 1) || 'D';
  msgGroup.innerHTML = `
    <div class="msg-avatar">${initials}</div>
    <div class="msg-stack">
      <div class="msg-bubble received">${escapeHtml(reply)}</div>
      <span class="msg-time">Just now</span>
    </div>
  `;
  chatMessages.appendChild(msgGroup);
  scrollToBottom();
}

function showTyping() {
  if (typingIndicator) {
    typingIndicator.style.display = 'flex';
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
  }
}

function hideTyping() {
  if (typingIndicator) typingIndicator.style.display = 'none';
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Send on button click
if (sendBtn) sendBtn.addEventListener('click', sendMessage);

// Send on Enter (Shift+Enter for newline)
if (messageInput) {
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// === CONTACT SELECTION ===
const contactData = {
  'dr-chen': { name: 'Dr. Sarah Chen, MD', online: true, response: '4 hours' },
  'dr-williams': { name: 'Dr. Marcus Williams, DO', online: false, response: '1 business day' },
  'nurse-johnson': { name: 'Nurse Lisa Johnson, RN', online: true, response: '2 hours' },
  'front-desk': { name: 'Patient Services', online: false, response: '4 hours' },
  'dr-vasquez': { name: 'Dr. Elena Vasquez, MD', online: false, response: '1 business day' },
};

window.selectContact = function(btn, contactId) {
  document.querySelectorAll('.care-member').forEach(m => m.classList.remove('active'));
  btn.classList.add('active');

  const contact = contactData[contactId];
  if (!contact) return;

  // Update header
  const nameEl = document.getElementById('activeContactName');
  if (nameEl) nameEl.textContent = contact.name;

  const avatar = document.querySelector('.chat-header-avatar');
  if (avatar) {
    const initial = contact.name.split(' ').find(w => w.length > 1)?.[0] || 'D';
    avatar.textContent = initial;
    avatar.className = 'chat-header-avatar' + (contact.online ? ' online' : '');
  }

  const onlineIndicator = document.querySelector('.online-indicator');
  if (onlineIndicator) {
    onlineIndicator.innerHTML = contact.online
      ? `<span class="online-dot"></span> Online`
      : `<span style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);display:inline-block;"></span> Away`;
    onlineIndicator.style.color = contact.online ? 'var(--success)' : 'var(--text-muted)';
  }

  const responseTime = document.querySelector('.response-time');
  if (responseTime) responseTime.textContent = `· Typically responds within ${contact.response}`;

  // Update placeholder
  if (messageInput) {
    const firstName = contact.name.split(' ').slice(0, 2).join(' ');
    messageInput.placeholder = `Type a secure message to ${firstName}…`;
  }

  // Remove unread badge from this member
  const badge = btn.querySelector('.unread-badge');
  if (badge) badge.remove();

  // On mobile, hide sidebar and show chat
  const chatSidebar = document.querySelector('.chat-sidebar');
  if (chatSidebar && window.innerWidth <= 768) {
    chatSidebar.classList.add('hidden');
  }
};

window.mobileChatBack = function() {
  const chatSidebar = document.querySelector('.chat-sidebar');
  if (chatSidebar) chatSidebar.classList.remove('hidden');
};

// Scroll to bottom on load
scrollToBottom();
