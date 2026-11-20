// The presentation frame identifies isolated examples; ordinary visits keep the original storage.
export const example = window.frameElement?.dataset.example || '';
export const demoStorage = example ? sessionStorage : localStorage;
export const scopeKey = key => example ? 'preview/' + example + '/' + key : key;
// Shared by the buyer checkout, ShopReady and the seller dashboard.
export const shops = {
  beauty: { name: 'Тон', category: 'Декоративная косметика', sample: 'Помада · Розовое дерево' },
  home: { name: 'Тихий дом', category: 'Домашний текстиль', sample: 'Плед · Овсяный' }
};

function key(shop) {
  if (!Object.hasOwn(shops, shop)) throw new Error('Неизвестный магазин');
  return scopeKey('vk-commerce-club-v1/' + shop);
}

function initial(shop) {
  if (example) {
    const count = { Start: 0, Growth: 2, Pro: 5 }[example];
    const orders = Array.from({length: count}, (_, i) => ({
      id: 'DEMO-' + (1001 + i), item: shops[shop].sample,
      amount: shop === 'beauty' ? 1490 : 3490, status: 'fulfilled'
    }));
    return {ready: true, orders, creditActivated: false};
  }
  const orders = shop === 'beauty' ? [
    { id: 'VK-1042', item: shops.beauty.sample, status: 'pending' },
    { id: 'VK-1041', item: 'Румяна · Персик', status: 'fulfilled' }
  ] : [];
  return { ready: shop === 'beauty', orders, creditActivated: false };
}

export function getClub(shop) {
  const saved = demoStorage.getItem(key(shop));
  return saved ? JSON.parse(saved) : initial(shop);
}

function save(shop, state) {
  demoStorage.setItem(key(shop), JSON.stringify(state));
  window.dispatchEvent(new Event('club-change'));
}

export function setReady(shop, ready) {
  const state = getClub(shop);
  state.ready = Boolean(ready);
  save(shop, state);
}

// Use the same checkout ID when retrying a single purchase.
export function recordOrder(shop, { id, item, amount }) {
  const state = getClub(shop);
  if (!state.ready) throw new Error('Сначала завершите проверку ShopReady');
  if (typeof id !== 'string' || !id.trim() || typeof item !== 'string' || !item.trim())
    throw new Error('Нужны номер заказа и название варианта товара');
  if (state.orders.some(order => order.id === id)) return;
  state.orders.unshift({ id, item, amount, status: 'pending' });
  save(shop, state);
}

export function fulfillOrder(shop, id) {
  const state = getClub(shop);
  const order = state.orders.find(entry => entry.id === id);
  if (!order || order.status !== 'pending') return;
  order.status = 'fulfilled';
  save(shop, state);
}

export function progress(state) {
  const fulfilled = state.orders.filter(order => order.status === 'fulfilled').length;
  const growth = state.ready && fulfilled >= 2;
  const pro = growth && fulfilled >= 5;
  return { fulfilled, growth, pro, level: pro ? 'Pro' : growth ? 'Growth' : 'Start' };
}

export function activateCredit(shop) {
  const state = getClub(shop);
  if (!progress(state).growth || state.creditActivated) return;
  state.creditActivated = true;
  save(shop, state);
}

export function resetClub(shop) {
  demoStorage.removeItem(key(shop));
  window.dispatchEvent(new Event('club-change'));
}
