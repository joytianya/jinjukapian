// 防止重复加载
if (window.quoteCardInitialized) {
  // 如果已经初始化过，直接退出
  console.log('Quote card already initialized');
  // 通知background script content script已加载
  chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' });
  // 退出脚本
  throw new Error('Quote card already initialized');
}

// 标记已初始化
window.quoteCardInitialized = true;

// 创建浮动图标元素
const createFloatingIcon = () => {
  const icon = document.createElement('div');
  icon.id = 'quote-card-icon';
  icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20,2H4C2.9,2,2,2.9,2,4v16c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M9,17H6c-0.6,0-1-0.4-1-1
        s0.4-1,1-1h3c0.6,0,1,0.4,1,1S9.6,17,9,17z M18,17h-6c-0.6,0-1-0.4-1-1s0.4-1,1-1h6c0.6,0,1,0.4,1,1S18.6,17,18,17z M18,13H6
        c-0.6,0-1-0.4-1-1s0.4-1,1-1h12c0.6,0,1,0.4,1,1S18.6,13,18,13z M18,9H6C5.4,9,5,8.6,5,8s0.4-1,1-1h12c0.6,0,1,0.4,1,1
        S18.6,9,18,9z"/>
    </svg>
  `;
  document.body.appendChild(icon);
  return icon;
};

// 获取选中文本的位置信息
const getSelectionPosition = () => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return null;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  };
};

// 显示浮动图标
const showFloatingIcon = (position) => {
  const icon = document.getElementById('quote-card-icon') || createFloatingIcon();
  icon.style.display = 'block';
  icon.style.top = `${position.top - 30}px`;
  icon.style.left = `${position.left + position.width / 2}px`;
};

// 隐藏浮动图标
const hideFloatingIcon = () => {
  const icon = document.getElementById('quote-card-icon');
  if (icon) {
    icon.style.display = 'none';
  }
};

// 处理选中文本事件
let selectionTimeout;
document.addEventListener('selectionchange', () => {
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('Text selected:', selectedText);
    if (selectedText) {
      const position = getSelectionPosition();
      if (position) {
        console.log('Showing floating icon at position:', position);
        showFloatingIcon(position);
      }
    } else {
      hideFloatingIcon();
    }
  }, 200);
});

// 处理点击事件
document.addEventListener('click', (e) => {
  const icon = document.getElementById('quote-card-icon');
  if (icon && e.target.closest('#quote-card-icon')) {
    const selectedText = window.getSelection().toString().trim();
    console.log('Icon clicked, sending message with text:', selectedText);
    // 发送消息给background script
    chrome.runtime.sendMessage({
      type: 'CREATE_QUOTE_CARD',
      text: selectedText
    });
  } else if (!e.target.closest('#quote-card-icon')) {
    hideFloatingIcon();
  }
});

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SELECTED_TEXT') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
    if (selectedText) {
      const position = getSelectionPosition();
      if (position) {
        showFloatingIcon(position);
      }
    }
  }
  // 必须返回true以支持异步响应
  return true;
});

// 通知background script content script已加载
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' }); 