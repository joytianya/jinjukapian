// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  chrome.contextMenus.create({
    id: 'create-quote-card',
    title: '生成金句卡片',
    contexts: ['selection']  // 只在选中文本时显示
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  if (info.menuItemId === 'create-quote-card') {
    // 保存选中的文本
    await chrome.storage.local.set({ selectedText: info.selectionText });
    console.log('Saved selected text:', info.selectionText);
    // 打开弹出窗口
    await openPopup(tab.id);
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.type === 'CREATE_QUOTE_CARD') {
    // 保存选中的文本
    chrome.storage.local.set({ selectedText: message.text });
    console.log('Creating quote card with text:', message.text);
    openPopup(sender.tab.id);
  }
  return true;
});

// 打开弹出窗口
async function openPopup(tabId) {
  // 获取当前窗口的位置和大小
  const window = await chrome.windows.getCurrent();
  
  // 计算弹出窗口的位置（居中显示）
  const width = 450;  // 弹出窗口宽度
  const height = 600; // 弹出窗口高度
  const left = Math.round(window.left + (window.width - width) / 2);
  const top = Math.round(window.top + (window.height - height) / 2);

  // 创建弹出窗口
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: width,
    height: height,
    left: left,
    top: top,
    focused: true
  });
}

// 处理扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 检查是否是可注入的页面
    if (!tab.url || !tab.url.startsWith('http')) {
      chrome.action.setTitle({
        tabId: tab.id,
        title: '此页面不支持选择文本'
      });
      return;
    }

    // 检查content script是否已加载
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTED_TEXT' });
      console.log('Response from content script:', response);
      if (response && response.text) {
        // 保存选中的文本
        await chrome.storage.local.set({ selectedText: response.text });
        await openPopup(tab.id);
      } else {
        // 如果没有选中文本，显示提示信息
        console.log('No text selected');
        chrome.action.setTitle({
          tabId: tab.id,
          title: '请先选择要生成卡片的文本'
        });
      }
    } catch (e) {
      console.log('Content script not loaded, trying to inject');
      // 如果content script未加载，尝试注入
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        // 等待content script加载完成
        await new Promise(resolve => setTimeout(resolve, 100));
        // 重试获取选中文本
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTED_TEXT' });
        if (response && response.text) {
          await chrome.storage.local.set({ selectedText: response.text });
          await openPopup(tab.id);
        } else {
          chrome.action.setTitle({
            tabId: tab.id,
            title: '请先选择要生成卡片的文本'
          });
        }
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        chrome.action.setTitle({
          tabId: tab.id,
          title: '插件加载失败，请刷新页面后重试'
        });
      }
    }

  } catch (error) {
    console.error('Error in action.onClicked:', error);
    // 如果是连接错误，可能是content script未加载
    if (error.message.includes('Receiving end does not exist')) {
      chrome.action.setTitle({
        tabId: tab.id,
        title: '请刷新页面后重试'
      });
    } else {
      chrome.action.setTitle({
        tabId: tab.id,
        title: '发生错误，请刷新页面后重试'
      });
    }
  }
}); 