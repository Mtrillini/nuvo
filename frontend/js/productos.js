// ============================================================
// NÜVE — productos.js
// ============================================================

// ---- Fetch products from API ----
async function fetchProductos(tipo = null, search = null, categoria = null) {
  let url = API_URL + '/productos?';
  const params = new URLSearchParams();
  if (tipo)      params.append('tipo', tipo);
  if (search)    params.append('search', search);
  if (categoria) params.append('categoria', categoria);
  url += params.toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener productos');
  const json = await res.json();
  return json.data || [];
}

// ---- Render skeleton loaders ----
function renderSkeletons(container, count = 6) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card producto-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line medium" style="margin-top:8px;"></div>
        <div class="skeleton skeleton-line full" style="margin-top:8px;"></div>
        <div class="skeleton skeleton-line full"></div>
      </div>
    </div>
  `).join('');
}

// ---- Render product cards ----
function renderProductos(productos, container) {
  if (!container) return;

  if (!productos || productos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">◇</div>
        <div class="empty-state__title">No hay productos disponibles</div>
        <p class="empty-state__text">Pronto tendremos nuevas fragancias. Volvé pronto.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = productos.map(p => {
    const stockBadge = parseInt(p.stock) === 0
      ? `<div class="producto-card__out-of-stock">Sin stock</div>` : '';
    const tipoBadge = `<div class="producto-card__badge">${p.tipo === 'tester' ? 'Tester' : 'Original'}</div>`;
    const price = window.formatMoney
      ? window.formatMoney(p.precio)
      : '$' + parseFloat(p.precio).toLocaleString('es-AR');

    const canAdd = parseInt(p.stock) > 0;
    const imgSrc = p.imagen_url || 'https://via.placeholder.com/600x600/F2ECE6/0D0D0D?text=NUVE';

    return `
      <div class="producto-card">
        <div class="producto-card__img-wrap">
          <img
            class="producto-card__img"
            src="${imgSrc}"
            alt="${p.nombre}"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/600x600/F2ECE6/0D0D0D?text=NUVE'"
          >
          ${tipoBadge}
          ${stockBadge}
          ${canAdd ? `<div class="producto-card__add-overlay" onclick="agregarAlCarrito(${JSON.stringify(p).replace(/"/g, '&quot;')})">Agregar al carrito</div>` : ''}
        </div>
        <div class="producto-card__body">
          <div class="producto-card__category">${p.categoria_nombre || ''}</div>
          <div class="producto-card__name">${p.nombre}</div>
          <div class="producto-card__nota">${p.nota_olfativa || ''}</div>
          <div class="producto-card__footer">
            <span class="producto-card__price">${price}</span>
            ${canAdd
              ? `<button class="btn-agregar" onclick="agregarAlCarrito(${JSON.stringify(p).replace(/"/g, '&quot;')})">Agregar</button>`
              : `<button class="btn-agregar" disabled>Sin stock</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Add to cart ----
function agregarAlCarrito(producto) {
  if (typeof window.Carrito === 'undefined') {
    showToast('Error: módulo de carrito no disponible.', 'error');
    return;
  }
  if (parseInt(producto.stock) === 0) {
    showToast('Este producto no tiene stock disponible.', 'error');
    return;
  }
  window.Carrito.agregar(producto, 1);
  showToast(`"${producto.nombre}" agregado al carrito.`, 'success');
}

window.agregarAlCarrito = agregarAlCarrito;

// ---- Pagination ----
let allProductos = [];
let currentPage = 1;
const PER_PAGE = 9;

function renderPagination(total, container) {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  const totalPages = Math.ceil(total / PER_PAGE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) {
    html += `<button class="pagination__btn" onclick="goToPage(${currentPage - 1})">&#8592;</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (currentPage < totalPages) {
    html += `<button class="pagination__btn" onclick="goToPage(${currentPage + 1})">&#8594;</button>`;
  }
  paginationEl.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  const container = document.getElementById('productos-grid');
  if (!container) return;

  const start = (page - 1) * PER_PAGE;
  const slice = allProductos.slice(start, start + PER_PAGE);
  renderProductos(slice, container);
  renderPagination(allProductos.length, container);
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

window.goToPage = goToPage;

// ---- Main init ----
async function initProductos() {
  const container = document.getElementById('productos-grid');
  if (!container) return;

  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get('search') || '';
  const tipoParam   = document.body.dataset.tipo || null;  // set via data-tipo on body

  // Fill search input if present
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchParam) searchInput.value = searchParam;

  // Update result count display
  const resultCount = document.getElementById('result-count');

  try {
    renderSkeletons(container, 6);
    allProductos = await fetchProductos(tipoParam, searchParam || null);

    // Sort
    const sortSelect = document.getElementById('sort-select');
    applySortAndRender(sortSelect ? sortSelect.value : 'recent');

    if (resultCount) {
      resultCount.textContent = `${allProductos.length} producto${allProductos.length !== 1 ? 's' : ''}`;
    }
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">◇</div>
        <div class="empty-state__title">Error al cargar productos</div>
        <p class="empty-state__text">${err.message}</p>
      </div>
    `;
  }
}

function applySortAndRender(sortValue) {
  let sorted = [...allProductos];
  const container = document.getElementById('productos-grid');
  if (!container) return;

  switch (sortValue) {
    case 'price-asc':
      sorted.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
      break;
    case 'price-desc':
      sorted.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
      break;
    case 'name':
      sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      break;
    default: // 'recent'
      // keep original order (newest first from API)
      break;
  }

  currentPage = 1;
  const slice = sorted.slice(0, PER_PAGE);
  renderProductos(slice, container);
  renderPagination(sorted.length, container);
}

// ---- Setup event listeners ----
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const sortSelect  = document.getElementById('sort-select');

  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const container = document.getElementById('productos-grid');
        const tipoParam = document.body.dataset.tipo || null;
        try {
          renderSkeletons(container, 6);
          allProductos = await fetchProductos(tipoParam, searchInput.value || null);
          applySortAndRender(sortSelect ? sortSelect.value : 'recent');
          const resultCount = document.getElementById('result-count');
          if (resultCount) {
            resultCount.textContent = `${allProductos.length} producto${allProductos.length !== 1 ? 's' : ''}`;
          }
        } catch (err) {
          showToast('Error al buscar productos.', 'error');
        }
      }, 400);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applySortAndRender(sortSelect.value);
    });
  }

  initProductos();
});

// ---- Featured products (homepage) ----
async function loadFeaturedProductos() {
  const container = document.getElementById('featured-grid');
  if (!container) return;

  try {
    renderSkeletons(container, 4);
    const productos = await fetchProductos();
    const featured = productos.slice(0, 4);
    renderProductos(featured, container);
  } catch {
    container.innerHTML = '';
  }
}

// Export for homepage use
window.loadFeaturedProductos = loadFeaturedProductos;
