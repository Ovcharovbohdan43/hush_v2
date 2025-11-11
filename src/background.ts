// Background service worker для Chrome расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hush extension installed');
});

// Обработка сообщений от content script и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createAlias') {
    // Получаем токен из storage
    chrome.storage.local.get(['access_token'], async (result) => {
      if (!result.access_token) {
        sendResponse({ error: 'Not authenticated' });
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/v1/aliases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.access_token}`,
          },
          body: JSON.stringify({ alias_type: 'random' }),
        });

        if (!response.ok) {
          throw new Error('Failed to create alias');
        }

        const alias = await response.json();
        sendResponse({ success: true, alias: alias.address });
      } catch (error) {
        sendResponse({ error: 'Failed to create alias' });
      }
    });

    return true; // Асинхронный ответ
  }
});

// Обновление badge при создании алиаса
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.aliasesCount) {
    chrome.action.setBadgeText({
      text: changes.aliasesCount.newValue?.toString() || '',
    });
  }
});

