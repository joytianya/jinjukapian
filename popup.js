// 当前卡片状态
let cardState = {
  theme: 'simple',
  background: '#F8F9FA',
  font: "'Noto Serif SC'",
  align: 'center',
  text: ''
};

// 主题配置
const themes = {
  simple: {
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  retro: {
    padding: '40px',
    borderRadius: '0',
    border: '4px double #000',
    boxShadow: '8px 8px 0 rgba(0, 0, 0, 0.2)'
  },
  modern: {
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)'
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 从storage中获取保存的文本
  const result = await chrome.storage.local.get('selectedText');
  if (result.selectedText) {
    cardState.text = result.selectedText;
    updatePreview();
  }

  // 绑定事件监听
  bindEventListeners();
});

// 绑定事件监听器
function bindEventListeners() {
  // 主题切换
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cardState.theme = btn.dataset.theme;
      updatePreview();
      updateActiveButtons();
    });
  });

  // 背景颜色
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cardState.background = btn.dataset.color || btn.dataset.gradient;
      updatePreview();
      updateActiveButtons();
    });
  });

  // 字体切换
  document.querySelectorAll('.font-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cardState.font = btn.dataset.font;
      updatePreview();
      updateActiveButtons();
    });
  });

  // 对齐方式
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cardState.align = btn.dataset.align;
      updatePreview();
      updateActiveButtons();
    });
  });

  // 导出按钮
  document.getElementById('exportBtn').addEventListener('click', exportCard);
}

// 更新预览
function updatePreview() {
  const preview = document.getElementById('cardPreview');
  const content = document.getElementById('cardContent');
  
  // 应用主题样式
  Object.assign(preview.style, themes[cardState.theme]);
  preview.style.background = cardState.background;
  
  // 应用内容样式
  content.style.fontFamily = cardState.font.replace(/['"]/g, '');
  content.style.textAlign = cardState.align;
  content.textContent = cardState.text;
}

// 更新按钮激活状态
function updateActiveButtons() {
  // 主题按钮
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === cardState.theme);
  });

  // 字体按钮
  document.querySelectorAll('.font-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.font === cardState.font);
  });

  // 对齐按钮
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.align === cardState.align);
  });
}

// 导出卡片
async function exportCard() {
  const preview = document.getElementById('cardPreview');
  const format = document.getElementById('formatSelect').value;
  const quality = parseFloat(document.getElementById('qualitySelect').value);

  // 创建canvas
  const canvas = await html2canvas(preview, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
  });

  // 转换为图片
  const dataUrl = canvas.toDataURL(`image/${format}`, quality);
  
  // 下载图片
  const link = document.createElement('a');
  link.download = `金句卡片_${new Date().getTime()}.${format}`;
  link.href = dataUrl;
  link.click();
} 