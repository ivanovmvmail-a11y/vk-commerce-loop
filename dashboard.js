import { catalogs } from './studio/catalog.js';
import { shops, getClub, progress, fulfillOrder, activateCredit, resetClub } from './shared/club.js';

const el = id => document.getElementById(id);
const requestedShop = new URL(location.href).searchParams.get('shop');
let shop = Object.hasOwn(shops, requestedShop) ? requestedShop : 'beauty';
el('shop').value = shop;
function render() {
  const state = getClub(shop);
  const { fulfilled, growth, pro, level } = progress(state);
  el('name').textContent = shops[shop].name;
  el('category').textContent = shops[shop].category;
  el('level').textContent = level;
  const target = growth ? 5 : 2;
  el('next').textContent = pro ? 'Открыты поддержка интеграций и сотрудничество с авторами' : 'Следующий уровень — ' + (growth ? 'Pro' : 'Growth');
  el('count').textContent = (state.ready ? 'ShopReady пройден' : 'Нужно пройти ShopReady') + ' · Выполнено без проблем: ' + fulfilled + '. Порог ' + (growth ? 'Pro' : 'Growth') + ' — ' + target;
  el('progress').max = target;
  el('progress').value = Math.min(target, fulfilled);
  el('progress').setAttribute('aria-label', 'Прогресс по выполненным заказам');
  const prices = new Map(catalogs[shop].products.map(([name, variant, amount]) => [name + ' · ' + variant, amount]));
  const amounts = state.orders.filter(o => o.status === 'fulfilled').map(o => o.amount ?? prices.get(o.item));
  el('total-orders').textContent = state.orders.length;
  el('completed').textContent = fulfilled;
  el('turnover').textContent = amounts.reduce((sum, amount) => sum + (amount ?? 0), 0).toLocaleString('ru-RU') + ' ₽';
  el('missing-price').textContent = amounts.includes(undefined) ? 'Для части прежних заказов цена неизвестна. В сумму включены товары с известной ценой.' : '';
  el('economy').textContent = state.creditActivated ? 'Кредит активирован. При использовании 500 ₽ кредита собственные расходы на такую кампанию составят 500 ₽.' : growth ? 'Доступен кредит 500 ₽. Его можно активировать в кабинете.' : 'На уровне Start магазин покрывает весь бюджет кампании. С Growth часть бюджета можно покрыть кредитом.';
  const requested = location.hash.slice(1);
  const current = ['results', 'partner'].includes(requested) ? requested : 'club';
  for (const tab of ['club', 'results', 'partner']) {
    el(tab + '-panel').hidden = tab !== current;
    document.querySelector('nav a[href="#' + tab + '"]').setAttribute('aria-current', tab === current ? 'page' : 'false');
  }
  el('templates').textContent = growth ? 'Доступны' : 'С уровня Growth';
  el('credit').disabled = !growth || state.creditActivated;
  el('credit').textContent = state.creditActivated ? 'Кредит активирован' : growth ? 'Активировать кредит' : 'С уровня Growth';
  el('studio').href = './studio/?shop=' + shop;
  el('scene').src = './studio/media/' + shop + '-scene.webp';
  el('brief').textContent = shop === 'beauty' ? 'Соберите витрину вокруг готового макияжа.' : 'Покажите текстиль в уютном интерьере.';
  const list = el('orders');
  list.replaceChildren();
  if (!state.orders.length) list.textContent = 'Здесь появится первый заказ из клипа.';
  for (const order of state.orders) {
    const row = document.createElement('div');
    row.className = 'line';
    const info = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = order.item;
    const meta = document.createElement('p');
    meta.textContent = order.id + ' · ' + (order.status === 'pending' ? 'Новый заказ' : 'Выполнен без проблем');
    info.append(title, meta);
    row.append(info);
    if (order.status === 'pending') {
      const button = document.createElement('button');
      button.textContent = 'Подтвердить выполнение';
      button.onclick = () => {
        fulfillOrder(shop, order.id);
        el('notice').textContent = progress(getClub(shop)).growth && !growth ? 'Уровень Growth открыт. Доступны новые привилегии.' : 'Выполнение подтверждено.';
        el('credit').disabled ? el('orders').scrollIntoView({ block: 'nearest' }) : el('credit').focus();
      };
      row.append(button);
    }
    list.append(row);
  }
}
el('shop').onchange = event => {
  shop = event.target.value;
  const url = new URL(location.href);
  url.searchParams.set('shop', shop);
  history.replaceState(null, '', url);
  el('notice').textContent = '';
  render();
};
el('credit').onclick = () => { activateCredit(shop); el('notice').textContent = 'Кредит активирован для демомагазина.'; };
el('reset').onclick = () => { if (confirm('Вернуть оформление, заказы и привилегии этого демомагазина в начальное состояние?')) { localStorage.removeItem('studio-v1/' + shop); resetClub(shop); el('notice').textContent = 'Начальное состояние восстановлено.'; } };
window.addEventListener('club-change', render);
window.addEventListener('hashchange', render);
window.addEventListener('storage', render);
window.addEventListener('pageshow', render);
render();
