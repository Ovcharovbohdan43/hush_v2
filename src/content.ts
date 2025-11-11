// Content script для инжекта на веб-страницы
(function() {
  'use strict';

  // Определяем email поля на странице
  function findEmailFields(): HTMLInputElement[] {
    const inputs = Array.from(document.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i], input[placeholder*="email" i]'));
    return inputs as HTMLInputElement[];
  }

  // Добавляем кнопку Hush рядом с email полями
  function addHushButtons() {
    const emailFields = findEmailFields();
    emailFields.forEach((field) => {
      if (field.dataset.hushButtonAdded) return;
      field.dataset.hushButtonAdded = 'true';

      const button = document.createElement('button');
      button.innerHTML = '🛡️ Hush';
      button.style.cssText = `
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        z-index: 10000;
      `;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position: relative; display: inline-block; width: 100%;';
      field.parentNode?.insertBefore(wrapper, field);
      wrapper.appendChild(field);
      wrapper.appendChild(button);

      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Проверяем, что расширение все еще активно
        if (!chrome.runtime?.id) {
          console.warn('Extension context invalidated. Please reload the page.');
          button.innerHTML = '⚠ Reload';
          button.disabled = false;
          setTimeout(() => {
            button.innerHTML = '🛡️ Hush';
          }, 2000);
          return;
        }
        
        // Визуальная обратная связь
        const originalText = button.innerHTML;
        button.innerHTML = '⏳...';
        button.disabled = true;
        
        try {
          // Запрашиваем создание алиаса у background script
          chrome.runtime.sendMessage({ action: 'createAlias' }, (response) => {
            // Проверяем наличие ошибок Chrome runtime
            if (chrome.runtime.lastError) {
              const error = chrome.runtime.lastError.message || '';
              console.error('Chrome runtime error:', chrome.runtime.lastError);
              
              // Если контекст недействителен, предлагаем перезагрузить страницу
              if (error.includes('Extension context invalidated') || error.includes('message port closed')) {
                button.innerHTML = '⚠ Reload Page';
                button.disabled = false;
                button.onclick = () => window.location.reload();
                return;
              }
              
              button.innerHTML = originalText;
              button.disabled = false;
              return;
            }
            
            if (response && response.error) {
              console.error('Alias creation error:', response.error);
              button.innerHTML = '❌ Error';
              button.disabled = false;
              setTimeout(() => {
                button.innerHTML = originalText;
              }, 2000);
              return;
            }
            
            if (response && response.alias) {
              field.value = response.alias;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              button.innerHTML = '✓ Done';
              setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
              }, 1000);
            } else {
              button.innerHTML = originalText;
              button.disabled = false;
            }
          });
        } catch (error: any) {
          console.error('Error in content script:', error);
          
          // Проверяем, не связана ли ошибка с недействительным контекстом
          if (error?.message?.includes('Extension context invalidated') || 
              error?.message?.includes('message port closed')) {
            button.innerHTML = '⚠ Reload Page';
            button.disabled = false;
            button.onclick = () => window.location.reload();
            return;
          }
          
          button.innerHTML = originalText;
          button.disabled = false;
        }
      });
    });
  }

  // Проверяем доступность расширения перед запуском
  if (!chrome.runtime?.id) {
    console.warn('Extension context invalidated. Content script will not run.');
    return;
  }

  // Наблюдаем за изменениями DOM
  const observer = new MutationObserver(() => {
    // Проверяем контекст перед добавлением кнопок
    if (!chrome.runtime?.id) {
      console.warn('Extension context invalidated during DOM observation.');
      observer.disconnect();
      return;
    }
    addHushButtons();
  });

  // Запускаем при загрузке
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (chrome.runtime?.id) {
        addHushButtons();
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
  } else {
    if (chrome.runtime?.id) {
      addHushButtons();
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  
  // Слушаем события перезагрузки расширения
  chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      console.warn('Extension disconnected. Please reload the page.');
    });
  });
})();

