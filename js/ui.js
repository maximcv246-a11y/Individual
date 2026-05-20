/**
 * ui.js — Модуль рендеринга DOM-элементов.
 * Отвечает за динамическое создание карточек блюд,
 * отрисовку корзины, детального модала и уведомлений.
 */

import { addToCart, removeFromCart, clearCart, getCartItems, getCartCount, getCartTotal } from './cart.js';

/* ─── Вспомогательные элементы DOM ─── */
const menuGrid   = document.getElementById('menuGrid');
const cartCount  = document.getElementById('cartCount');
const noResults  = document.getElementById('noResults');

/* ─── Счётчик анимации кнопки корзины ─── */
function bumpCartCount() {
  cartCount.textContent = getCartCount();
  cartCount.classList.remove('bump');
  // Перезапуск анимации через reflow
  void cartCount.offsetWidth;
  cartCount.classList.add('bump');
}

/* ─── Обновить счётчик без анимации ─── */
export function refreshCartCount() {
  cartCount.textContent = getCartCount();
}

/* ─── Значки (бейджи) карточки ─── */
function buildBadges(tags) {
  if (!tags.length) return '';
  return tags.map(tag => {
    const map = { popular: ['⭐ Популярное', 'badge--popular'], vegetarian: ['🥦 Вег', 'badge--veg'], spicy: ['🌶 Острое', 'badge--spicy'] };
    const [label, cls] = map[tag] || [tag, ''];
    return `<span class="badge ${cls}">${label}</span>`;
  }).join('');
}

/**
 * Отрисовать массив блюд в сетку.
 * @param {Array} items — отфильтрованный/отсортированный массив блюд
 */
export function renderMenu(items) {
  menuGrid.innerHTML = '';

  if (!items.length) {
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  items.forEach((dish, idx) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = dish.id;
    // Задержка для staggered-эффекта
    card.style.animationDelay = `${idx * 60}ms`;

    card.innerHTML = `
      <div class="card-img-wrap" data-id="${dish.id}" role="button" tabindex="0" aria-label="Подробнее: ${dish.name}">
        <div class="card-emoji-img" style="background:${dish.bgColor}">${dish.emoji}</div>
        <div class="card-badges">${buildBadges(dish.tags)}</div>
      </div>
      <div class="card-body">
        <div class="card-header">
          <h3 class="card-name" data-id="${dish.id}" tabindex="0">${dish.name}</h3>
          <span class="card-price">${dish.price} ₽</span>
        </div>
        <p class="card-desc">${dish.desc}</p>
        <div class="card-meta">
          <span>🔥 ${dish.calories} ккал</span>
          <span>⚖️ ${dish.weight} г</span>
        </div>
      </div>
      <div class="card-footer">
        <div class="qty-wrap">
          <button class="qty-btn" data-action="dec" data-id="${dish.id}" aria-label="Уменьшить">−</button>
          <span class="qty-val" id="qty-${dish.id}">1</span>
          <button class="qty-btn" data-action="inc" data-id="${dish.id}" aria-label="Увеличить">+</button>
        </div>
        <button class="add-btn" data-id="${dish.id}">В корзину</button>
      </div>
    `;

    menuGrid.appendChild(card);
  });
}

/* ─── Получить текущее qty на карточке ─── */
function getQty(id) {
  return parseInt(document.getElementById(`qty-${id}`)?.textContent || '1', 10);
}

/* ─── Обработчики кнопок +/− и «В корзину» ─── */
export function bindCardEvents(dishMap) {
  menuGrid.addEventListener('click', (e) => {
    const id = Number(e.target.dataset.id);
    const action = e.target.dataset.action;
    const dish = dishMap.get(id);

    // Кнопки +/−
    if (action === 'inc') {
      const el = document.getElementById(`qty-${id}`);
      if (el) el.textContent = Math.min(99, getQty(id) + 1);
      return;
    }
    if (action === 'dec') {
      const el = document.getElementById(`qty-${id}`);
      if (el) el.textContent = Math.max(1, getQty(id) - 1);
      return;
    }

    // «В корзину»
    if (e.target.classList.contains('add-btn') && dish) {
      const qty = getQty(id);
      addToCart(dish, qty);
      bumpCartCount();
      showToast(`«${dish.name}» добавлено в корзину!`);
      return;
    }

    // Клик по изображению или названию — детальный модал
    if ((e.target.closest('.card-img-wrap') || e.target.classList.contains('card-name')) && dish) {
      openDetailModal(dish);
    }
  });

  // Клавиатурная навигация по карточкам
  menuGrid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const id = Number(e.target.dataset.id);
      const dish = dishMap.get(id);
      if (dish && (e.target.classList.contains('card-name') || e.target.closest('.card-img-wrap'))) {
        openDetailModal(dish);
      }
    }
  });
}

/* ───────────────────────────────────────
   КОРЗИНА
─────────────────────────────────────── */

const cartModal  = document.getElementById('cartModal');
const cartItemsEl = document.getElementById('cartItems');
const cartFooterEl = document.getElementById('cartFooter');
const cartBtn    = document.getElementById('cartBtn');
const modalClose = document.getElementById('modalClose');

/** Открыть корзину */
export function openCart() {
  renderCartModal();
  cartModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/** Закрыть корзину */
function closeCart() {
  cartModal.classList.add('hidden');
  document.body.style.overflow = '';
}

/** Рендер содержимого корзины */
function renderCartModal() {
  const items = getCartItems();

  if (!items.length) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <p>🛒</p>
        <p>Корзина пуста</p>
      </div>`;
    cartFooterEl.innerHTML = '';
    return;
  }

  cartItemsEl.innerHTML = items.map(({ item, qty }) => `
    <div class="cart-item">
      <span class="cart-item-emoji">${item.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-sub">${qty} × ${item.price} ₽</div>
      </div>
      <span class="cart-item-price">${qty * item.price} ₽</span>
      <button class="cart-item-remove" data-remove="${item.id}" aria-label="Удалить ${item.name}">✕</button>
    </div>
  `).join('');

  const total = getCartTotal();
  cartFooterEl.innerHTML = `
    <div class="cart-total-row">
      <span>Итого:</span>
      <span class="cart-total-price">${total} ₽</span>
    </div>
    <button class="order-btn" id="orderBtn">Оформить заказ</button>
    <button class="clear-btn" id="clearBtn">Очистить корзину</button>
  `;

  // Удаление позиции
  cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(Number(btn.dataset.remove));
      refreshCartCount();
      renderCartModal();
    });
  });

  // Оформить заказ
  document.getElementById('orderBtn').addEventListener('click', () => {
    clearCart();
    refreshCartCount();
    closeCart();
    showToast('🎉 Заказ оформлен! Ожидайте подтверждения.');
  });

  // Очистить
  document.getElementById('clearBtn').addEventListener('click', () => {
    clearCart();
    refreshCartCount();
    renderCartModal();
  });
}

// Навесить события на кнопку и оверлей
cartBtn.addEventListener('click', openCart);
modalClose.addEventListener('click', closeCart);
cartModal.addEventListener('click', (e) => {
  if (e.target === cartModal) closeCart();
});

/* ───────────────────────────────────────
   ДЕТАЛЬНЫЙ МОДАЛ
─────────────────────────────────────── */

const detailModal   = document.getElementById('detailModal');
const detailContent = document.getElementById('detailContent');

/** Открыть детальный просмотр блюда */
export function openDetailModal(dish) {
  detailContent.innerHTML = `
    <button class="modal-close" id="detailClose" aria-label="Закрыть">✕</button>
    <div class="detail-emoji-bg" style="background:${dish.bgColor}">
      <span style="font-size:7rem">${dish.emoji}</span>
    </div>
    <div class="detail-body">
      <div class="card-badges" style="margin-bottom:12px">${buildBadges(dish.tags)}</div>
      <h2 class="detail-title">${dish.name}</h2>
      <p class="detail-desc">${dish.desc}</p>
      <div class="detail-meta">
        <span>🔥 ${dish.calories} ккал</span>
        <span>⚖️ ${dish.weight} г</span>
        <span>🏷️ ${dish.price} ₽</span>
      </div>
      <div class="detail-price-row">
        <span class="detail-price">${dish.price} ₽</span>
        <button class="detail-add-btn" id="detailAddBtn">В корзину</button>
      </div>
    </div>
  `;

  detailModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  document.getElementById('detailClose').addEventListener('click', closeDetailModal);
  document.getElementById('detailAddBtn').addEventListener('click', () => {
    addToCart(dish, 1);
    bumpCartCount();
    showToast(`«${dish.name}» добавлено в корзину!`);
    closeDetailModal();
  });
}

function closeDetailModal() {
  detailModal.classList.add('hidden');
  document.body.style.overflow = '';
}

detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) closeDetailModal();
});

// Закрытие модалов по Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    closeDetailModal();
  }
});

/* ───────────────────────────────────────
   TOAST-УВЕДОМЛЕНИЕ
─────────────────────────────────────── */

let toastTimer = null;
const toastEl = document.getElementById('toast');

/**
 * Показать всплывающее уведомление.
 * @param {string} message — текст сообщения
 * @param {number} duration — время показа (мс)
 */
export function showToast(message, duration = 2500) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), duration);
}
