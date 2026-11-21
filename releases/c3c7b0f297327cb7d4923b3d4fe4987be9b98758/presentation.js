import { shops } from './shared/club.js';
const el = id => document.getElementById(id);
let frame = el('phone');
const slider = el('level-control');
const modes = ['Start', 'Growth', 'Pro'];
const explanations = ['Start · Магазин готовит первый товар и клип.', 'Growth · Есть товарный контент. Цель — привлечь покупателя к карточке и получить первый заказ.', 'Pro · Есть внутренний заказ. Цель — качественное исполнение и повторные продажи.'];
const entry = new URL('cabinet.html', document.baseURI);
entry.search = location.search;
entry.hash = location.hash;
let shop = entry.searchParams.get('shop') === 'home' ? 'home' : 'beauty';
const savedPages = new Map([[shop, entry.href]]);
let active = -1;
let signedIn = false;
let merchantStep = 0;

function openExample(step, selected = shop) {
  const partner = selected === 'home';
  step = partner ? 0 : step;
  if (!partner) merchantStep = step;
  if (step === active && selected === shop) return;
  if (active === 0 && signedIn) {
    const previous = frame.contentWindow.location.href;
    if (previous.startsWith(location.origin + '/')) savedPages.set(shop, previous);
  }
  const changedSeller = selected !== shop;
  shop = selected;
  active = step;
  const label = partner ? 'Brand Partner' : modes[step];
  const example = step === 0 ? '' : label;
  const target = new URL((!example && savedPages.get(shop)) || 'cabinet.html', document.baseURI);
  target.searchParams.set('shop', shop);
  if (partner && !target.hash) target.hash = 'partner';
  slider.hidden = partner;
  document.querySelector('.stops').hidden = partner;
  el('mode-title').textContent = partner ? 'Партнёрский кабинет' : 'Уровень продавца';
  document.querySelector('[data-hash="club"]').hidden = partner;
  document.querySelector('[data-hash="partner"]').hidden = !partner;
  el('metric-label').textContent = partner ? 'Заказов в CRM' : 'Выполнено заказов';
  el('reward-label').textContent = partner ? 'Каталог бренда' : 'Рекламный кредит';
  if (changedSeller) {
    const address = new URL(location.href);
    address.searchParams.set('shop', shop);
    address.hash = '';
    history.replaceState(null, '', address);
  }
  if (example) {
    for (const prefix of ['studio-v1/', 'vk-commerce-club-v1/']) sessionStorage.removeItem('preview/' + example + '/' + prefix + shop);
    target.searchParams.set('example', example);
  }
  document.body.dataset.shop = shop;
  el('scene').src = 'studio/media/' + shop + '-scene.webp';
  el('shop-name').textContent = shops[shop].name;
  el('category').textContent = shops[shop].category;
  el('mode').value = label;
  slider.value = step;
  slider.style.setProperty('--pct', (step * 100 / 2) + '%');
  slider.setAttribute('aria-valuetext',label);
  el('explain').textContent = partner ? 'Каталог и остатки поступают из системы бренда. Внутренние заказы передаются в CRM.' : explanations[step];
  document.querySelectorAll('[data-shop]').forEach(b => {if(b.tagName==='BUTTON') b.setAttribute('aria-pressed', b.dataset.shop === shop);});
  document.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.step) === step));
  document.querySelectorAll('[data-path]').forEach(button => { button.disabled = true; });
  const next = frame.cloneNode(false);
  next.dataset.example = example;
  next.addEventListener('load', fitPresentation);
  next.dataset.target = target.href;
  if (signedIn) next.src = target.href;
  frame.replaceWith(next);
  frame = next;
}
window.addEventListener('message', event => {
  const d = event.data;
  if (event.origin !== location.origin || event.source !== frame.contentWindow || d?.type !== 'club-screen' || d.shop !== shop) return;
  el('screen').textContent = d.screen;
  el('count').textContent = shop === 'home' ? d.orders : d.fulfilled;
  el('credit-state').textContent = shop === 'home' ? (d.ready ? 'Подключён' : 'Ожидает подключения') : d.credit;
  document.querySelectorAll('[data-path]').forEach(button => { button.disabled = button.id === 'buyer-path' && !d.ready; });
  el('ready-note').hidden = d.ready;
  document.querySelectorAll('[data-path]').forEach(b => b.setAttribute('aria-current', b.dataset.hash === d.route ? 'page' : 'false'));
});
slider.oninput = () => openExample(Number(slider.value));
document.querySelectorAll('button[data-shop]').forEach(b => b.onclick = () => openExample(merchantStep,b.dataset.shop));
document.querySelectorAll('[data-step]').forEach(b => b.onclick = () => openExample(Number(b.dataset.step)));
document.querySelectorAll('[data-path]').forEach(b => b.onclick = () => {
  const target = new URL(b.dataset.path, document.baseURI);
  target.searchParams.set('shop',shop);
  target.hash = b.dataset.hash;
  enter(target.href);
});
function enter(target = frame.dataset.target) {
  signedIn = true;
  el('login').hidden = true;
  frame.hidden = false;
  frame.src = target;
  frame.focus();
}
document.querySelectorAll('[data-login]').forEach(button => {
  button.onclick = () => {
    openExample(merchantStep, button.dataset.login);
    enter();
  };
});
openExample(0);

function fitPresentation() {
  const scale = Math.max(1, Math.min(window.innerWidth / 1470, window.innerHeight / 870, 2.4));
  document.body.style.setProperty('--stage-scale', String(scale));
  if (frame.contentDocument?.body) frame.contentDocument.body.style.zoom = window.innerWidth >= 1500 ? scale : 1;
}
fitPresentation();
window.addEventListener('resize', fitPresentation);
