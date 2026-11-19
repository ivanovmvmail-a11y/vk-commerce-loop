import { shops, getClub, progress, fulfillOrder, activateCredit, resetClub } from './shared/club.js';

const el = id => document.getElementById(id);
const requestedShop = new URL(location.href).searchParams.get('shop');
let shop = Object.hasOwn(shops, requestedShop) ? requestedShop : 'beauty';
el('shop').value = shop;
function render() {
  const state = getClub(shop);
  const { fulfilled, growth } = progress(state);
  el('name').textContent = shops[shop].name;
  el('category').textContent = shops[shop].category;
  el('level').textContent = growth ? 'Growth' : 'Start';
  el('next').textContent = growth ? 'Рекламный кредит и шаблоны открыты' : 'Следующий уровень — Growth';
  el('count').textContent = (state.ready ? 'ShopReady пройден' : 'Требуется проверка ShopReady') + ' · Выполнено заказов: ' + fulfilled;
  el('progress').value = Math.min(2, fulfilled);
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
window.addEventListener('storage', render);
window.addEventListener('pageshow', render);
render();
