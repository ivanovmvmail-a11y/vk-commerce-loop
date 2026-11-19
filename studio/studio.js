import { getClub, progress, recordOrder, setReady } from '../shared/club.js';
import { catalogs, layouts } from './catalog.js';
const params = new URLSearchParams(location.search);
const shop = params.get('shop') === 'home' ? 'home' : 'beauty';
const data = catalogs[shop];
const clubUrl = '../index.html?shop=' + shop;
const key = 'studio-v1/' + shop;
const saved = () => JSON.parse(localStorage.getItem(key) || '{}');
const persist = fields => localStorage.setItem(key, JSON.stringify({...saved(), ...fields}));
const app = document.getElementById('app');
document.getElementById('club').href = clubUrl;
document.body.className = shop;
const media = name => `media/${shop}-${name}.webp`;
const price = amount => amount.toLocaleString('ru-RU') + ' ₽';
const availableLayouts = () => progress(getClub(shop)).growth ? layouts.length : 3;
let wish = data.wishes[saved().wish] ? saved().wish : 0;
let layout = saved().layout >= 0 && saved().layout < availableLayouts() ? saved().layout : 0;
const link = (hash,label) => `<a class="action" href="#${hash}">${label}</a>`;
const image = role => `<img src="${media(role)}" alt="${data[role + 'Alt']}">`;
const productName = p => p[0] + ' · ' + p[1];
const items = () => data.products.map((p,i) => `<a class="product" href="#product/${i}"><span><b>${p[0]}</b><small>${p[1]}</small></span><strong>${price(p[2])}</strong></a>`).join('');
function cover(n) {
  const [ , title, intro] = data.wishes[wish];
  const titles = [data.products[0][0] + ' · ' + data.products[0][1],data.collection,'Знакомьтесь, ' + data.name,'Сезонная подборка'];
  const description = [data.products[0][3],intro,data.story,intro][n];
  return `<div class="cover view-${n}">${image(n === 0 || n === 3 ? 'detail' : 'scene')}<div><span class="monogram">${data.initials}</span><p>${data.name} / ${title}</p><h2>${titles[n]}</h2><p>${description}</p></div></div>`;
}
function editor() {
  const ready = getClub(shop).ready;
  return `<p class="eyebrow">SHOP STUDIO</p><h1>${data.name}</h1><p>${data.tagline}</p>
    <section><h2>Готовность к продаже</h2><p>ShopReady проверяет каталог перед запуском.</p><div class="checks"><span>✓ Цена и описание</span><span>✓ Варианты товаров</span><span>✓ Доставка и оформление</span></div>
    ${ready ? `<strong>✓ Остатки подтверждены</strong>` : `<form id="stock"><label>Остаток · ${data.products[0][0]}, ${data.products[0][1]}<input name="stock" type="number" required min="1" max="9999" step="1" inputmode="numeric" placeholder="Количество, шт."></label><button>Сохранить остаток</button></form>`}</section>
    <section><h2>Как представить магазин?</h2><label>Пожелание владельца <select id="wish">${data.wishes.map(([label],i)=>`<option value="${i}" ${wish === i ? 'selected':''}>${label}</option>`).join('')}</select></label>
    <h3>Оформление сообщества</h3><div class="choices">${layouts.slice(0,availableLayouts()).map(([label,desc],i)=>`<button data-layout="${i}" aria-pressed="${layout === i}"><b>${label}</b><small>${desc}</small></button>`).join('')}</div>
    <div id="preview">${cover(layout)}</div><button id="apply" ${ready ? '' : 'disabled'}>Применить оформление</button>${ready ? '' : '<p>Для запуска укажите остаток в ShopReady.</p>'}</section>
    <section><h2>Что снять для VK Клипов</h2>${data.ideas.map((text,i)=>`<p><b>Идея ${i+1}.</b> ${text}</p>`).join('')}</section>`;
}
function storefront() {
  const clip = `<section class="clipcard">${image('scene')}<div><p class="eyebrow">VK КЛИПЫ</p><h2>${data.clip}</h2>${link('clip','Смотреть клип')}</div></section>`;
  const catalog = `<section><h2>${layout === 1 || layout === 3 ? data.collection : 'Каталог'}</h2>${items()}</section>`;
  const lead = layout === 0 ? `<section><h2>Товар в центре образа</h2>${link('product/0','Открыть ' + data.products[0][0].toLowerCase().replace('помада','помаду'))}</section>` : '';
  return `<a href="#edit">← Вернуться в редактор</a><h1>${data.name}</h1>${cover(layout)}${lead}${layout === 1 || layout === 3 ? catalog + clip : clip + catalog}`;
}
function product(i, fromClip) {
  const p = data.products[i];
  return `<a href="#${fromClip ? 'clip':'store'}">← ${fromClip ? 'К клипу':'В сообщество'}</a><section class="item">${image('detail')}<div><p class="eyebrow">${data.name}</p><h1>${p[0]}</h1><p>${p[1]}</p><p>${p[3]}</p><h2>${price(p[2])}</h2>${link('checkout/'+i,'Оформить внутри VK')}</div></section>`;
}
function page() {
  const [route, rawIndex, source] = location.hash.slice(1).split('/');
  const number = Number(rawIndex);
  const i = Number.isInteger(number) && data.products[number] ? number : 0;
  const p = data.products[i];
  let content;
  if (!getClub(shop).ready && route && route !== 'edit') { location.replace('#edit'); return; }
  switch(route) {
    case 'store': content = storefront(); break;
    case 'clip':
      content = `<a href="#store">← В сообщество</a><div class="clip"><video controls playsinline preload="metadata" poster="${media('scene')}" aria-label="${data.clip}"><source src="media/${shop}.mp4" type="video/mp4"></video><section><p class="eyebrow">VK КЛИПЫ · ${data.name}</p><h1>${data.clip}</h1><p>${data.wishes[wish][2]}</p><h2>Товары из клипа</h2>${data.products.slice(0,2).map((p,j)=>`<a class="product" href="#product/${j}/clip"><span><b>${p[0]}</b><small>${p[1]}</small></span><strong>${price(p[2])}</strong></a>`).join('')}</section></div>`; break;
    case 'product': content=product(i,source==='clip'); break;
    case 'checkout':
      content=`<a href="#product/${i}">← К товару</a><section><p class="eyebrow">ДЕМОЗАКАЗ ВНУТРИ VK</p><h1>Оформление</h1><div class="product"><span><b>${p[0]}</b><small>${p[1]} · 1 шт.</small></span><strong>${price(p[2])}</strong></div><p>Доставка в демонстрационный пункт выдачи. Оплата в прототипе не требуется.</p><button id="order">Подтвердить демозаказ</button></section>`; break;
    case 'done': content=`<section><p class="eyebrow">ДЕМОЗАКАЗ</p><h1>Заказ оформлен</h1><p>${productName(p)} появится в заказах магазина «${data.name}».</p><a class="action" href="${clubUrl}">Посмотреть в кабинете продавца</a> ${link('store','В сообщество')}</section>`; break;
    default: content=editor();
  }
  app.innerHTML = content;
  const stockForm = document.getElementById('stock');
  if (stockForm) stockForm.onsubmit = event => {
    event.preventDefault();
    persist({stock:Number(stockForm.elements.stock.value)});
    setReady(shop,true);
    page();
    document.getElementById('wish').focus();
  };
  const wishSelect=document.getElementById('wish');
  if (wishSelect) wishSelect.onchange=()=>{ wish=Number(wishSelect.value); persist({wish}); page(); document.getElementById('wish').focus(); };
  app.querySelectorAll('[data-layout]').forEach(button=>button.onclick=()=>{
    layout=Number(button.dataset.layout); persist({layout}); page();
    app.querySelector(`[data-layout="${layout}"]`).focus();
  });
  const apply=document.getElementById('apply');
  if (apply) apply.onclick=()=>{persist({layout,wish}); location.hash='store';};
  const order=document.getElementById('order');
  if (order) {
    const id='VK-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5);
    order.onclick=()=>{order.disabled=true; recordOrder(shop,{id,item:productName(p)}); location.replace('#done/'+i);};
  }
}
window.addEventListener('hashchange',()=>{page(); window.scrollTo(0,0); const title=app.querySelector('h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}});
window.addEventListener('pageshow',page);
page();
