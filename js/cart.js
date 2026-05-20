/**
 * cart.js — Модуль управления корзиной заказов.
 * Хранит состояние корзины и предоставляет методы
 * добавления, удаления позиций и вычисления итоговой суммы.
 */

/** @type {Map<number, {item: object, qty: number}>} */
const cartMap = new Map();

/**
 * Добавить блюдо в корзину.
 * @param {object} item  — объект блюда из data.js
 * @param {number} qty   — количество (по умолчанию 1)
 */
export function addToCart(item, qty = 1) {
  if (cartMap.has(item.id)) {
    cartMap.get(item.id).qty += qty;
  } else {
    cartMap.set(item.id, { item, qty });
  }
}

/**
 * Удалить блюдо из корзины полностью.
 * @param {number} id — идентификатор блюда
 */
export function removeFromCart(id) {
  cartMap.delete(id);
}

/**
 * Очистить корзину.
 */
export function clearCart() {
  cartMap.clear();
}

/**
 * Получить текущее содержимое корзины.
 * @returns {Array<{item: object, qty: number}>}
 */
export function getCartItems() {
  return [...cartMap.values()];
}

/**
 * Получить общее количество позиций (сумму qty).
 * @returns {number}
 */
export function getCartCount() {
  let count = 0;
  for (const entry of cartMap.values()) count += entry.qty;
  return count;
}

/**
 * Посчитать итоговую сумму заказа.
 * @returns {number}
 */
export function getCartTotal() {
  let total = 0;
  for (const { item, qty } of cartMap.values()) total += item.price * qty;
  return total;
}
