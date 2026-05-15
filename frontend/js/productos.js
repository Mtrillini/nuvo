// ============================================================
// NÜVE — productos.js (hardcodeado)
// ============================================================

const PRODUCTOS = [
  {
    id: 1,
    nombre: 'La Bomba',
    marca: 'Carolina Herrera',
    tipo: 'Eau de Parfum',
    precio: 100000,
    img: '/nuvo/frontend/images/prod-labomba.webp',
    genero: 'femenino',
    descripcion: 'Fragancia floral y frutal con notas de frutos rojos y flores de ensueño. Una explosión de feminidad y sensualidad.',
  },
  {
    id: 2,
    nombre: 'Scandal Absolu',
    marca: 'Jean Paul Gaultier',
    tipo: 'Eau de Parfum',
    precio: 100000,
    img: '/nuvo/frontend/images/prod-scandal.jpg',
    genero: 'femenino',
    descripcion: 'Fragancia oriental y amaderada con notas de miel, jazmín y vainilla. Provocadora e irresistible.',
  },
  {
    id: 3,
    nombre: 'Phantom EDT',
    marca: 'Paco Rabanne',
    tipo: 'Eau de Toilette',
    precio: 100000,
    img: '/nuvo/frontend/images/prod-phantom.webp',
    genero: 'masculino',
    descripcion: 'Fragancia moderna y seductora con notas de lavanda, limón y vainilla. El futuro de la masculinidad.',
  },
  {
    id: 4,
    nombre: '212 VIP Black',
    marca: 'Carolina Herrera',
    tipo: 'Eau de Parfum',
    precio: 100000,
    img: '/nuvo/frontend/images/prod-212vip.jpg',
    genero: 'masculino',
    descripcion: 'Fragancia amaderada y aromática con notas de pimienta, cedro y ámbar. Exclusivo y sofisticado.',
  },
];

const fmt = n => '$ ' + n.toLocaleString('es-AR');

// ---- Render cards ----
function renderProductos(lista) {
  const container = document.getElementById('productos-grid');
  if (!container) return;

  const count = document.getElementById('result-count');
  if (count) count.textContent = `${lista.length} producto${lista.length !== 1 ? 's' : ''}`;

  if (!lista.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">◇</div>
        <div class="empty-state__title">No hay productos disponibles</div>
        <p class="empty-state__text">Pronto tendremos nuevas fragancias. Volvé pronto.</p>
      </div>`;
    return;
  }

  container.innerHTML = lista.map(p => `
    <div class="nuve-card" onclick="abrirModal(${p.id})">
      <span class="nuve-card__badge">#${p.id}</span>
      <div class="nuve-card__img-wrap">
        <img src="${p.img}" alt="${p.nombre}" loading="lazy">
      </div>
      <div class="nuve-card__body">
        <div class="nuve-card__nombre">${p.nombre}</div>
        <div class="nuve-card__marca">${p.marca}</div>
        <div class="nuve-card__tipo">${p.tipo}</div>
        <div class="nuve-card__precio">${fmt(p.precio)}</div>
        <button class="nuve-card__btn" onclick="event.stopPropagation(); abrirModal(${p.id})">AGREGAR AL CARRITO</button>
      </div>
    </div>
  `).join('');
}

// ---- Filtro + sort ----
function aplicarFiltros() {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();
  const sort   = document.getElementById('sort-select')?.value || 'recent';

  let lista = PRODUCTOS.filter(p =>
    p.nombre.toLowerCase().includes(search) ||
    p.marca.toLowerCase().includes(search)
  );

  if (sort === 'price-asc')  lista.sort((a, b) => a.precio - b.precio);
  if (sort === 'price-desc') lista.sort((a, b) => b.precio - a.precio);
  if (sort === 'name')       lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  renderProductos(lista);
}

// ---- Modal ----
let modalProductoActual = null;
let modalQty = 1;

function abrirModal(id) {
  const p = PRODUCTOS.find(x => x.id === id);
  if (!p) return;
  modalProductoActual = p;
  modalQty = 1;

  document.getElementById('modal-img').src       = p.img;
  document.getElementById('modal-img').alt       = p.nombre;
  document.getElementById('modal-marca').textContent  = p.marca;
  document.getElementById('modal-nombre').textContent = p.nombre;
  document.getElementById('modal-tipo').textContent   = p.tipo;
  document.getElementById('modal-desc').textContent   = p.descripcion;
  document.getElementById('modal-precio').textContent = fmt(p.precio);
  document.getElementById('modal-qty').textContent    = modalQty;

  const modal = document.getElementById('producto-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('producto-modal').style.display = 'none';
  document.body.style.overflow = '';
  modalProductoActual = null;
}

function cambiarQty(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById('modal-qty').textContent = modalQty;
}

function agregarDesdeModal() {
  if (!modalProductoActual) return;
  const p = { ...modalProductoActual, stock: 99 };
  if (typeof window.Carrito !== 'undefined') {
    window.Carrito.agregar(p, modalQty);
    window.showToast(`"${p.nombre}" agregado al carrito.`, 'success');
    cerrarModal();
  } else {
    window.showToast('Error: módulo de carrito no disponible.', 'error');
  }
}

window.abrirModal       = abrirModal;
window.cerrarModal      = cerrarModal;
window.cambiarQty       = cambiarQty;
window.agregarDesdeModal = agregarDesdeModal;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  aplicarFiltros();

  document.getElementById('search-input')?.addEventListener('input', () => aplicarFiltros());
  document.getElementById('sort-select')?.addEventListener('change', () => aplicarFiltros());

  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });
});

// ---- Featured (homepage) ----
window.loadFeaturedProductos = function () {};
