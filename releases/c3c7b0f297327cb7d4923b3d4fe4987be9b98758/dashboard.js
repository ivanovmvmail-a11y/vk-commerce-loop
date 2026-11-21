import { sellerMenu } from './shared/navigation.js';
import { catalogs } from './studio/catalog.js';
import { demoStorage, scopeKey, shops, reportScreen, getClub, progress, fulfillOrder, activateCredit, setReady, resetClub } from './shared/club.js';

const el = id => document.getElementById(id);
const requestedShop = new URL(location.href).searchParams.get('shop');
const shop = Object.hasOwn(shops, requestedShop) ? requestedShop : 'beauty';

function render() {
  const state = getClub(shop);
  const { fulfilled, growth, pro, level } = progress(state);
  el('level').textContent = level;
  const {eligible} = progress(state);
  const studio = './studio/?shop=' + shop + '#edit';
  el('next').textContent = pro ? 'Исполняйте заказы и возвращайте покупателей' : growth ? 'Доведите зрителя клипа до первого заказа' : 'Подготовьте товар к первой публикации';
  el('count').textContent = growth && !pro && state.opens < 10 ? 'Меньше 10 открытий карточки. Попробуйте другой сценарий клипа.' : 'Внутренние заказы: ' + state.orders.length;
  el('next-action').href = pro ? '#orders' : studio;
  el('next-action').textContent = pro ? 'Открыть заказы' : growth ? 'Открыть Shop Studio' : 'Проверить товар в ShopReady';
  el('trust').textContent = fulfilled ? 'Выполнено без проблем: ' + fulfilled + ' из ' + state.orders.length : 'Данных пока недостаточно';
  el('orders-heading').textContent = state.partner ? 'Заказы в CRM бренда' : 'История заказов';
  el('order-hint').textContent = state.partner ? 'Передача из VK в систему бренда смоделирована в этом браузере.' : 'Подтвердите исполнение, чтобы получить привилегию клуба.';
  el('sync-status').textContent = state.ready ? 'Подключено · 3 варианта товара с ценами и остатками.' : '3 варианта товара готовы к импорту из каталога бренда.';
  el('sync').hidden = state.ready;
  el('partner-studio').hidden = !state.ready;
  el('partner-studio').href = studio;
  el('funnel').textContent = 'Просмотры клипа: ' + state.views + ' · Открытия из клипа: ' + state.opens + ' · Начала оформления из клипа: ' + state.starts;
  for (const id of ['budget-title', 'budget-note', 'economy']) el(id).hidden = state.partner;
  const prices = new Map(catalogs[shop].products.map(([name, variant, amount]) => [name + ' · ' + variant, amount]));
  const amounts = state.orders.filter(o => o.status === 'fulfilled').map(o => o.amount ?? prices.get(o.item));
  el('total-orders').textContent = state.orders.length;
  el('completed').textContent = fulfilled;
  el('turnover').textContent = amounts.reduce((sum, amount) => sum + (amount ?? 0), 0).toLocaleString('ru-RU') + ' ₽';
  el('missing-price').textContent = amounts.includes(undefined) ? 'Для части прежних заказов цена неизвестна. В сумму включены товары с известной ценой.' : '';
  el('economy').textContent = state.creditActivated ? 'Кредит активирован. При использовании 500 ₽ кредита собственные расходы на такую кампанию составят 500 ₽.' : eligible ? 'Доступен кредит 500 ₽. Его можно активировать в кабинете.' : 'Кредит открывается после первого подтверждённого исполнения заказа.';
  const requested = location.hash.slice(1);
  const current = ['orders', 'results'].includes(requested) ? requested : state.partner ? 'partner' : 'club';
  for (const tab of ['club', 'orders', 'results', 'partner']) {
    el(tab + '-panel').hidden = tab !== current;
  }
  const titles = { club: 'Обзор клуба', orders: 'Заказы', results: 'Результаты продаж', partner: 'Партнёрство с брендами' };
  reportScreen(shop, current, titles[current]);
  el('name').textContent = titles[current];
  el('context').textContent = 'Магазин «' + shops[shop].name + '»';
  document.title = titles[current] + ' · Кабинет продавца';
  el('menu').innerHTML = sellerMenu(shop, current);
  el('view-shop').href = './studio/?shop=' + shop + (state.ready ? '#store' : '#edit');
  if (state.partner && !state.ready) el('view-shop').href = '#partner';
  el('view-shop').textContent = state.ready ? 'Посмотреть как покупатель' : 'Подготовить сообщество';
  el('templates').textContent = growth ? 'Доступны' : 'С уровня Growth';
  el('credit').disabled = !eligible || state.creditActivated;
  el('credit').textContent = state.creditActivated ? 'Кредит активирован' : eligible ? 'Активировать кредит' : 'После исполнения заказа';
  const list = el('order-list');
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
        const updated = progress(getClub(shop));
        el('order-feedback').textContent = updated.level !== level ? 'Выполнение подтверждено. Открыт уровень ' + updated.level + '.' : 'Выполнение подтверждено.';
        const next = el('order-next');
        const creditAvailable = updated.eligible && !getClub(shop).creditActivated;
        next.href = creditAvailable ? '#privileges' : '#results';
        next.textContent = creditAvailable ? 'Перейти к рекламному кредиту' : 'Посмотреть результаты продаж';
        next.hidden = false;
        el('order-feedback').focus();
      };
      row.append(button);
    }
    list.append(row);
  }
}
el('sync').onclick = () => { setReady(shop,true); el('partner-studio').focus(); };
el('credit').onclick = () => { activateCredit(shop); el('notice').textContent = 'Кредит активирован для демомагазина.'; };
el('reset').onclick = () => { if (confirm('Вернуть оформление, заказы и привилегии этого демомагазина в начальное состояние?')) { demoStorage.removeItem(scopeKey('studio-v1/' + shop)); resetClub(shop); el('order-feedback').textContent = ''; el('order-next').hidden = true; el('notice').textContent = 'Начальное состояние восстановлено.'; } };
window.addEventListener('club-change', render);
window.addEventListener('hashchange', () => {
  render();
  if (location.hash === '#privileges') el('credit').focus();
});
window.addEventListener('storage', render);
window.addEventListener('pageshow', render);
render();
