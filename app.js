(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menu && nav) menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '×' : '☰';
  });

  const form = document.getElementById('requestForm');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  if (['alla', 'alexandra'].includes(params.get('author'))) $('author').value = params.get('author');
  if (params.get('service')) $('service').value = params.get('service').replaceAll('%20', ' ');

  form.addEventListener('submit', event => {
    event.preventDefault();
    const key = $('author').value;
    if (!key) { $('author').focus(); return; }
    const name = key === 'alexandra' ? 'Александра · Темнолесье' : 'Алла';
    const lines = [
      'Здравствуйте! Хочу обратиться к вам.',
      'Автор: ' + name,
      'Услуга: ' + $('service').value.trim(),
      $('clientName').value.trim() ? 'Имя: ' + $('clientName').value.trim() : '',
      $('contact').value.trim() ? 'Контакт: ' + $('contact').value.trim() : '',
      $('message').value.trim() ? 'Мой запрос: ' + $('message').value.trim() : ''
    ].filter(Boolean);
    $('requestText').textContent = lines.join('\n\n');
    $('contactHint').textContent = key === 'alexandra' ? 'Откроется Telegram Александры. Проверьте сообщение и отправьте его самостоятельно.' : 'Откроется сообщество Аллы во VK. Проверьте сообщение и отправьте его самостоятельно.';
    $('contactLink').href = key === 'alexandra' ? 'https://t.me/witchwood' : 'https://vk.ru/soulmatetarot';
    $('contactLink').textContent = key === 'alexandra' ? 'Открыть Telegram Александры ↗' : 'Открыть VK Аллы ↗';
    $('requestResult').hidden = false;
    $('requestResult').scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  $('copyRequest').addEventListener('click', async () => {
    const button = $('copyRequest');
    try {
      await navigator.clipboard.writeText($('requestText').textContent);
      button.textContent = 'Скопировано ✓';
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('requestText'));
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      button.textContent = 'Выделено — скопируйте';
    }
  });
  form.addEventListener('reset', () => { $('requestResult').hidden = true; });
})();