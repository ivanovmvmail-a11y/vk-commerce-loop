import { shops } from './club.js';

const sections = [
  ['club', 'Обзор клуба'], ['orders', 'Заказы'], ['results', 'Результаты продаж'],
  ['edit', 'Студия оформления'], ['partner', 'Партнёрство с брендами']
];

export function sellerMenu(shop, current, inStudio = false) {
  const cabinet = (inStudio ? '../index.html' : './index.html') + '?shop=' + shop;
  const studio = (inStudio ? './' : './studio/') + '?shop=' + shop;
  return `<aside class="seller-menu">
    <div class="shop-id"><img src="${inStudio ? '' : './studio/'}media/${shop}-scene.webp" alt=""><div><b>${shops[shop].name}</b><small>${shops[shop].category}</small></div></div>
    <nav aria-label="Кабинет продавца">${sections.map(([id,label]) => {
      const href = id === 'edit' ? studio + '#edit' : cabinet + '#' + id;
      return `<a href="${href}" ${id === current ? 'aria-current="page"' : ''}>${label}</a>`;
    }).join('')}</nav></aside>`;
}
