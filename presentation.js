let frame = document.getElementById('phone');
const slider = document.getElementById('level-control');
const modes = ['', 'Start', 'Growth', 'Pro'];
const explanations = [
  'Здесь сохраняются ваши заказы и оформление.',
  'Пример нового магазина. Доступны проверка готовности и базовые оформления.',
  'Пример с двумя выполненными заказами. Открыты рекламный кредит и оформление коллекции.',
  'Пример с пятью выполненными заказами. Добавлены поддержка интеграций и сотрудничество с авторами.'
];
const initial = new URL('cabinet.html', location.href);
initial.search = location.search;
initial.hash = location.hash;
let originalPage = initial.href;
let active = -1;


function selectMode(step) {
  if (step === active) return;
  if (active === 0) {
    const current = frame.contentWindow.location.href;
    if (current.startsWith(location.origin + '/')) originalPage = current;
  }
  const previous = new URL(frame.contentWindow.location.href);
  const shop = previous.searchParams.get('shop') || new URL(originalPage).searchParams.get('shop') || 'beauty';
  const example = modes[step];
  if (example) {
    for (const prefix of ['studio-v1/', 'vk-commerce-club-v1/']) {
      sessionStorage.removeItem('preview/' + example + '/' + prefix + shop);
    }
  }
  active = step;

  slider.value = step;
  const label = example || 'Мой магазин';
  slider.setAttribute('aria-valuetext', label);
  document.getElementById('mode').value = label;
  document.getElementById('explain').textContent = explanations[step];
  document.querySelectorAll('[data-step]').forEach(button => {
    button.setAttribute('aria-pressed', Number(button.dataset.step) === step);
  });
  const target = new URL(example ? 'cabinet.html' : originalPage, location.href);
  if (example) {
    target.searchParams.set('shop', shop);
    target.searchParams.set('example', example);
  }
  const nextFrame = frame.cloneNode(false);
  nextFrame.dataset.example = example;
  nextFrame.src = target.href;
  if (example) nextFrame.addEventListener('load', () => {
    nextFrame.contentDocument.querySelector('.hero')?.scrollIntoView({block:'center'});
  }, {once:true});
  frame.replaceWith(nextFrame);
  frame = nextFrame;
}
slider.addEventListener('input', () => selectMode(Number(slider.value)));
document.querySelectorAll('[data-step]').forEach(button => {
  button.addEventListener('click', () => selectMode(Number(button.dataset.step)));
});
selectMode(0);

