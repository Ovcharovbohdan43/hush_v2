// Background service worker для Chrome расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hush extension installed');
});

// Обработка сообщений от content script и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background: Received message', request);
  
  if (request.action === 'createAlias') {
    console.log('Background: Creating alias...');
    
    // Получаем токен и API URL из storage
    chrome.storage.local.get(['access_token'], async (result) => {
      console.log('Background: Got access_token from storage', !!result.access_token);
      
      // Также получаем apiUrl из sync storage (настройки)
      chrome.storage.sync.get(['apiUrl'], async (syncResult) => {
        try {
          if (!result.access_token) {
            console.error('Background: No access token');
            sendResponse({ error: 'Not authenticated. Please sign in first.' });
            return;
          }

          const apiUrl = syncResult.apiUrl || 'http://localhost:3001';
          console.log('Background: Using API URL', apiUrl);
          
          const url = `${apiUrl}/api/v1/aliases`;
          console.log('Background: Fetching', url);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.access_token}`,
            },
            body: JSON.stringify({ alias_type: 'random' }),
          });

          console.log('Background: Response status', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
            console.error('Background: Error creating alias', errorMessage);
            sendResponse({ error: errorMessage });
            return;
          }

          const alias = await response.json();
          console.log('Background: Alias created successfully', alias.address);
          sendResponse({ success: true, alias: alias.address });
        } catch (error: any) {
          console.error('Background: Exception creating alias', error);
          sendResponse({ 
            error: error.message || 'Failed to create alias. Check your connection.' 
          });
        }
      });
    });

    return true; // Асинхронный ответ
  }
  
  return false; // Синхронный ответ не используется
});

// Обновление badge при создании алиаса
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log('Background: Storage changed', areaName, changes);
  if (areaName === 'local' && changes.aliasesCount) {
    chrome.action.setBadgeText({
      text: changes.aliasesCount.newValue?.toString() || '',
    });
  }
});

