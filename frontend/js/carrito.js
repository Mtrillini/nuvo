// ============================================================
// NÜVE — carrito.js
// Cart localStorage structure:
// { items: [{id, nombre, precio, imagen_url, cantidad, stock}], updatedAt }
// ============================================================

const CART_KEY = 'nuve_cart';

// ---- Helpers ----
function getCarrito() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [], updatedAt: null };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return { items: [], updatedAt: null };
    return parsed;
  } catch {
    return { items: [], updatedAt: null };
  }
}

function guardarCarrito(carrito) {
  carrito.updatedAt = new Date().toISOString();
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
  // Notify other components
  window.dispatchEvent(new Event('carrito-updated'));
  if (typeof window.updateCartBadge === 'function') {
    window.updateCartBadge();
  }
}

function agregarItem(producto, cantidad = 1) {
  const carrito = getCarrito();
  const existingIdx = carrito.items.findIndex(i => i.id === producto.id);

  if (existingIdx >= 0) {
    const nuevoQty = carrito.items[existingIdx].cantidad + cantidad;
    const maxStock = producto.stock ?? carrito.items[existingIdx].stock ?? 999;
    carrito.items[existingIdx].cantidad = Math.min(nuevoQty, maxStock);
  } else {
    carrito.items.push({
      id:         producto.id,
      nombre:     producto.nombre,
      precio:     parseFloat(producto.precio),
      imagen_url: producto.imagen_url || '',
      cantidad:   Math.min(cantidad, producto.stock ?? 999),
      stock:      producto.stock ?? 999,
    });
  }

  guardarCarrito(carrito);
  return carrito;
}

function quitarItem(id) {
  const carrito = getCarrito();
  carrito.items = carrito.items.filter(i => i.id !== parseInt(id));
  guardarCarrito(carrito);
  return carrito;
}

function cambiarCantidad(id, delta) {
  const carrito = getCarrito();
  const idx = carrito.items.findIndex(i => i.id === parseInt(id));
  if (idx < 0) return carrito;

  const item = carrito.items[idx];
  const newQty = item.cantidad + delta;

  if (newQty <= 0) {
    carrito.items.splice(idx, 1);
  } else {
    const maxStock = item.stock ?? 999;
    carrito.items[idx].cantidad = Math.min(newQty, maxStock);
  }

  guardarCarrito(carrito);
  return carrito;
}

function vaciarCarrito() {
  guardarCarrito({ items: [], updatedAt: null });
}

function getTotal() {
  const carrito = getCarrito();
  return carrito.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
}

function getTotalItems() {
  const carrito = getCarrito();
  return carrito.items.reduce((sum, item) => sum + item.cantidad, 0);
}

// ---- Expose globally ----
window.Carrito = {
  get:           getCarrito,
  guardar:       guardarCarrito,
  agregar:       agregarItem,
  quitar:        quitarItem,
  cambiarQty:    cambiarCantidad,
  vaciar:        vaciarCarrito,
  getTotal:      getTotal,
  getTotalItems: getTotalItems,
};

// ============================================================
// Render cart page (carrito.html)
// ============================================================
function renderCarrito() {
  const container = document.getElementById('cart-items-container');
  const summaryContainer = document.getElementById('cart-summary');
  if (!container) return;

  const carrito = getCarrito();

  if (carrito.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">◇</div>
        <div class="empty-state__title">Tu carrito está vacío</div>
        <p class="empty-state__text">Explorá nuestra colección y encontrá tu esencia.</p>
        <br>
        <a href="/nuve-ecommerce/frontend/productos.html" class="btn btn-primary" style="display:inline-flex;margin-top:1rem;">Ver productos</a>
      </div>
    `;
    if (summaryContainer) renderSummary(carrito);
    return;
  }

  const itemsHTML = carrito.items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img
        class="cart-item__img"
        src="${item.imagen_url || 'https://via.placeholder.com/80x80/F2ECE6/0D0D0D?text=NUVE'}"
        alt="${item.nombre}"
        onerror="this.src='https://via.placeholder.com/80x80/F2ECE6/0D0D0D?text=NUVE'"
      >
      <div class="cart-item__info">
        <div class="cart-item__name">${item.nombre}</div>
        <div class="cart-item__price">${window.formatMoney ? window.formatMoney(item.precio) : '$' + item.precio} c/u</div>
      </div>
      <div class="cart-item__right">
        <div class="qty-control">
          <button class="qty-control__btn" onclick="handleQtyChange(${item.id}, -1)" aria-label="Restar">−</button>
          <span class="qty-control__value">${item.cantidad}</span>
          <button class="qty-control__btn" onclick="handleQtyChange(${item.id}, 1)" aria-label="Sumar">+</button>
        </div>
        <div style="font-family:var(--font-secondary);font-size:0.9rem;font-weight:500;color:var(--negro);">
          ${window.formatMoney ? window.formatMoney(item.precio * item.cantidad) : '$' + (item.precio * item.cantidad)}
        </div>
        <button class="cart-item__remove" onclick="handleRemove(${item.id})">Eliminar</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="cart-items">${itemsHTML}</div>`;
  if (summaryContainer) renderSummary(carrito);
}

function renderSummary(carrito) {
  const container = document.getElementById('cart-summary');
  if (!container) return;

  const subtotal = getTotal();
  const envio = subtotal > 0 ? 0 : 0; // free shipping
  const total = subtotal + envio;
  const fmt = window.formatMoney || (v => '$' + v);

  const isEmpty = !carrito || carrito.items.length === 0;

  container.innerHTML = `
    <div class="order-summary">
      <div class="order-summary__title">Resumen del pedido</div>
      <div class="order-summary__row">
        <span>Subtotal</span>
        <span>${fmt(subtotal)}</span>
      </div>
      <div class="order-summary__row">
        <span>Envío</span>
        <span>${subtotal > 0 ? 'A calcular' : '—'}</span>
      </div>
      <div class="order-summary__row order-summary__row--total">
        <span>Total estimado</span>
        <span>${fmt(total)}</span>
      </div>
      <div class="order-summary__actions">
        <a href="/nuve-ecommerce/frontend/checkout.html"
           class="btn btn-primary"
           style="text-align:center;${isEmpty ? 'pointer-events:none;opacity:0.5;' : ''}">
          Proceder al pago
        </a>
        <a href="/nuve-ecommerce/frontend/productos.html" class="btn btn-secondary" style="text-align:center;">
          Seguir comprando
        </a>
        ${!isEmpty ? `<button onclick="handleVaciar()" class="cart-item__remove" style="text-align:center;margin-top:0.5rem;">Vaciar carrito</button>` : ''}
      </div>
    </div>
  `;
}

// ---- Event handlers ----
function handleQtyChange(id, delta) {
  cambiarCantidad(id, delta);
  renderCarrito();
}

function handleRemove(id) {
  quitarItem(id);
  renderCarrito();
  showToast('Producto eliminado del carrito.', 'info');
}

function handleVaciar() {
  if (confirm('¿Vaciar el carrito?')) {
    vaciarCarrito();
    renderCarrito();
    showToast('Carrito vaciado.', 'info');
  }
}

// ---- updateCounterBadge ----
function updateCounterBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const total = getTotalItems();
  badges.forEach(badge => {
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// ---- Init on carrito.html ----
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-items-container')) {
    renderCarrito();
  }
  updateCounterBadge();
  window.addEventListener('carrito-updated', updateCounterBadge);
});
