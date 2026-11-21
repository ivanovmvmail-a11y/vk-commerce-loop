// The presentation frame identifies isolated examples; ordinary visits keep the original storage.
export const example = window.frameElement?.dataset.example || '';
export const demoStorage = example ? sessionStorage : localStorage;
export const scopeKey = key => example ? 'preview/' + example + '/' + key : key;
// Shared by the buyer checkout, ShopReady and the seller dashboard.
export const shops = {
  beauty: { name: 'Katelle', category: 'Декоративная косметика', sample: 'Помада · Розовое дерево' },
  home: { name: 'Happique', category: 'Домашний текстиль', sample: 'Плед · Овсяный' }
};

function key(shop) {
  if (!Object.hasOwn(shops, shop)) throw new Error('Неизвестный магазин');
  return scopeKey('vk-commerce-club-v1/' + shop);
}

function initial(shop) {
  const partner = shop === 'home';
  const level = partner ? 'Brand Partner' : example || 'Start';
  const orders = level === 'Pro' ? [
    {id:'VK-1041', item:shops[shop].sample, amount:1490, status:'fulfilled'}
  ] : [];
  const published = level === 'Growth' || level === 'Pro';
  return {
    ready: published, orders, creditActivated:false, partner,
    clip: published ? {sku:0, script:0} : null,
    views:published ? 1200 : 0, opens:published ? 2 : 0, starts:0
  };
}

export function getClub(shop) {
  const saved = demoStorage.getItem(key(shop));
  if (!saved) return initial(shop);
  const stored = JSON.parse(saved);
  const state = {...initial(shop), ...stored, partner:shop === 'home'};
  // Earlier demos displayed a prepared clip for every ready shop.
  if (!Object.hasOwn(stored, 'clip') && stored.ready) state.clip = {sku:0, script:0};
  return state;
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

export function publishClip(shop, sku, script) {
  const state = getClub(shop);
  if (!state.ready) return;
  state.clip = {sku, script};
  save(shop, state);
}

export function track(shop, metric) {
  const state = getClub(shop);
  state[metric] += 1;
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
  const pro = !state.partner && state.orders.length > 0;
  const growth = !state.partner && (Boolean(state.clip) || pro);
  const level = state.partner ? 'Brand Partner' : pro ? 'Pro' : growth ? 'Growth' : 'Start';
  return {fulfilled, growth, pro, level, eligible:pro && fulfilled > 0};
}

export function activateCredit(shop) {
  const state = getClub(shop);
  if (!progress(state).eligible || state.creditActivated) return;
  state.creditActivated = true;
  save(shop, state);
}

export function resetClub(shop) {
  demoStorage.removeItem(key(shop));
  window.dispatchEvent(new Event('club-change'));
}

export function reportScreen(shop, route, screen) {
  if (window.parent === window) return;
  const state = getClub(shop);
  const {fulfilled, eligible, level} = progress(state);
  const credit = state.creditActivated ? 'Активирован' : eligible ? 'Доступен · 500 ₽' : 'После исполнения заказа';
  window.parent.postMessage({type:'club-screen', shop, route, screen, level, orders:state.orders.length, fulfilled, ready:state.ready, published:Boolean(state.clip), credit}, location.origin);
}
