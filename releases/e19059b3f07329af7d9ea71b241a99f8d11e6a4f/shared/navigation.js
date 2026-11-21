import { shops } from './club.js';

const sections = [
  ['club', 'Обзор клуба'], ['orders', 'Заказы'], ['results', 'Результаты продаж'],
  ['edit', 'Shop Studio'], ['partner', 'Партнёрство с брендами']
];

export function sellerMenu(shop, current, inStudio = false) {
  const cabinet = (inStudio ? '../cabinet.html' : './cabinet.html') + '?shop=' + shop;
  const studio = (inStudio ? './' : './studio/') + '?shop=' + shop;
  return `<aside class="seller-menu">
    <div class="shop-id"><img src="${inStudio ? '' : './studio/'}media/${shop}-scene.webp" alt=""><div><b>${shops[shop].name}</b><small>${shops[shop].category}</small></div></div>
    <details class="menu-drawer"><summary>Разделы кабинета</summary><nav aria-label="Кабинет продавца">${sections.filter(([id]) => shop === 'home' ? id !== 'club' : id !== 'partner').map(([id,label]) => {
      const href = id === 'edit' ? studio + '#edit' : cabinet + '#' + id;
      return `<a href="${href}" ${id === current ? 'aria-current="page"' : ''}>${shop === 'home' && id === 'orders' ? 'Заказы в CRM' : label}</a>`;
    }).join('')}</nav></details></aside>`;
}
