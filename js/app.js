/**
 * app.js — Главный модуль приложения.
 * Инициализирует вкладки, поиск, фильтрацию, сортировку
 * и координирует взаимодействие между модулями data, cart, ui.
 */

import { menuItems } from './data.js';
import { renderMenu, bindCardEvents, refreshCartCount } from './ui.js';

/* ─── Построить Map для быстрого поиска блюда по id ─── */
const dishMap = new Map(menuItems.map(d => [d.id, d]));

/* ─── Состояние приложения ─── */
const state = {
  activeTab:    'hot',   // текущая вкладка
  activeFilter: 'all',   // текущий фильтр
  searchQuery:  '',      // строка поиска
  sortOrder:    'default', // текущая сортировка
};

/* ─── DOM-элементы управления ─── */
const tabBtns      = document.querySelectorAll('.tab');
const filterBtns   = document.querySelectorAll('.filter-btn');
const searchInput  = document.getElementById('searchInput');
const sortSelect   = document.getElementById('sortSelect');

/* ───────────────────────────────────────
   PIPELINE: фильтрация → поиск → сортировка → рендер
─────────────────────────────────────── */

/**
 * Применить фильтры к данным и перерисовать сетку.
 */
function applyAndRender() {
  let result = menuItems.filter(d => d.category === state.activeTab);

  // Фильтр по тегу
  if (state.activeFilter !== 'all') {
    result = result.filter(d => d.tags.includes(state.activeFilter));
  }

  // Поиск по названию и описанию
  const q = state.searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q)
    );
  }

  // Сортировка
  result = sortItems(result, state.sortOrder);

  renderMenu(result);
}

/**
 * Сортировать массив блюд.
 * @param {Array} items
 * @param {string} order — ключ сортировки
 * @returns {Array}
 */
function sortItems(items, order) {
  const copy = [...items];
  switch (order) {
    case 'price-asc':    return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':   return copy.sort((a, b) => b.price - a.price);
    case 'name-asc':     return copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    case 'calories-asc': return copy.sort((a, b) => a.calories - b.calories);
    default:             return copy;
  }
}

/* ───────────────────────────────────────
   ВКЛАДКИ
─────────────────────────────────────── */

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Снять active со всех, поставить на нажатую
    tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    state.activeTab = btn.dataset.tab;
    // Сброс фильтра при смене вкладки
    state.activeFilter = 'all';
    filterBtns.forEach(f => f.classList.toggle('active', f.dataset.filter === 'all'));

    applyAndRender();
  });
});

/* ───────────────────────────────────────
   ФИЛЬТРЫ
─────────────────────────────────────── */

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeFilter = btn.dataset.filter;
    applyAndRender();
  });
});

/* ───────────────────────────────────────
   ПОИСК
─────────────────────────────────────── */

/** Debounce — задержка перед обработкой ввода (300 мс) */
let searchDebounce = null;

searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.searchQuery = searchInput.value;
    applyAndRender();
  }, 300);
});

/* ───────────────────────────────────────
   СОРТИРОВКА
─────────────────────────────────────── */

sortSelect.addEventListener('change', () => {
  state.sortOrder = sortSelect.value;
  applyAndRender();
});

/* ───────────────────────────────────────
   ИНИЦИАЛИЗАЦИЯ
─────────────────────────────────────── */

// Навесить события на карточки
bindCardEvents(dishMap);

// Первоначальный рендер
applyAndRender();

// Синхронизировать счётчик корзины при загрузке
refreshCartCount();
