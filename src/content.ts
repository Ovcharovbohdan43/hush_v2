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
        
        // Запрашиваем создание алиаса у background script
        chrome.runtime.sendMessage({ action: 'createAlias' }, (response) => {
          if (response && response.alias) {
            field.value = response.alias;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    });
  }

  // Наблюдаем за изменениями DOM
  const observer = new MutationObserver(() => {
    addHushButtons();
  });

  // Запускаем при загрузке
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addHushButtons();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    addHushButtons();
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();

