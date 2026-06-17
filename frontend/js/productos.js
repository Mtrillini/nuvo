// ============================================================
// NÜVE — productos.js
// ============================================================

let PRODUCTOS = [];

const fmt        = n => '$ ' + n.toLocaleString('es-AR');
const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

function mapProducto(p) {
  return {
    id:          p.id,
    marca:       p.marca || '',
    nombre:      p.nombre,
    tipo:        capitalize(p.tipo),
    precio:      parseFloat(p.precio),
    img:         p.imagen_url || '',
    imagenes:    (p.imagenes || []).map(i => i.url),
    descripcion: p.descripcion || '',
    nota:        p.nota_olfativa || '',
    stock:       parseInt(p.stock_disponible ?? p.stock) || 0,
    genero:      p.tipo,
  };
}

// ---- Slider de imágenes dentro de cada card (flechas a los costados) ----
function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

function cardSliderHTML(imgs, alt, fallback) {
  const list  = (imgs && imgs.length) ? imgs : (fallback ? [fallback] : []);
  const first = list[0] || '';
  // JSON dentro de atributo: lo guardamos con comillas simples escapadas
  const dataImgs = JSON.stringify(list).replace(/'/g, '&#39;');
  const arrows = list.length > 1 ? `
      <button type="button" class="card-slider__arrow card-slider__arrow--prev" aria-label="Imagen anterior">&#8249;</button>
      <button type="button" class="card-slider__arrow card-slider__arrow--next" aria-label="Imagen siguiente">&#8250;</button>` : '';
  return `<div class="card-slider" data-idx="0" data-imgs='${dataImgs}'>
      <img class="card-slider__img" src="${first}" alt="${escAttr(alt)}" loading="lazy">${arrows}
    </div>`;
}

// Navegación de las flechas (delegada, una sola vez para todas las cards)
document.addEventListener('click', e => {
  const arrow = e.target.closest('.card-slider__arrow');
  if (!arrow) return;
  e.preventDefault();
  e.stopPropagation();              // no abrir el modal al tocar la flecha
  const slider = arrow.closest('.card-slider');
  if (!slider) return;
  let imgs;
  try { imgs = JSON.parse(slider.dataset.imgs); } catch (_) { imgs = []; }
  if (imgs.length < 2) return;
  let idx = parseInt(slider.dataset.idx, 10) || 0;
  idx = arrow.classList.contains('card-slider__arrow--next')
    ? (idx + 1) % imgs.length
    : (idx - 1 + imgs.length) % imgs.length;
  slider.dataset.idx = idx;
  const img = slider.querySelector('.card-slider__img');
  if (img) img.src = imgs[idx];
});

// ---- Fetch all products ----
async function fetchAllProductos() {
  try {
    const res  = await fetch(API_URL + '/productos');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    PRODUCTOS = (json.data || []).map(mapProducto);
  } catch (e) {
    console.error('Error cargando productos:', e);
    PRODUCTOS = [];
  }
}

// ---- Render cards (productos.html) ----
function renderProductos(lista) {
  const container = document.getElementById('productos-grid');
  if (!container) return;

  const count = document.getElementById('result-count');
  if (count) count.textContent = `${lista.length} producto${lista.length !== 1 ? 's' : ''}`;

  if (!lista.length) {
    container.innerHTML = `
      <div class="empty-state">
<div class="empty-state__title">No hay productos disponibles</div>
        <p class="empty-state__text">Pronto tendremos nuevas fragancias. Volvé pronto.</p>
      </div>`;
    return;
  }

  container.innerHTML = lista.map(p => {
    const imgs = (p.imagenes && p.imagenes.length) ? p.imagenes : (p.img ? [p.img] : []);
    return `
    <div class="nuve-card" onclick="${p.stock > 0 ? `abrirModal(${p.id})` : ''}">
      <div class="nuve-card__img-wrap">
        ${cardSliderHTML(imgs, p.nombre, p.img)}
      </div>
      <div class="nuve-card__body">
        <div class="nuve-card__nombre">${p.nombre}</div>
        <div class="nuve-card__marca">${p.marca}</div>
        <div class="nuve-card__tipo">${p.nota ? p.nota.slice(0, 60) : ''}</div>
        <div class="nuve-card__precio">${fmt(p.precio)}</div>
        <button
          class="nuve-card__btn${p.stock === 0 ? ' nuve-card__btn--agotado' : ''}"
          ${p.stock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : `onclick="event.stopPropagation(); abrirModal(${p.id})"`}>
          ${p.stock === 0 ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
        </button>
      </div>
    </div>
  `;
  }).join('');
}

// ---- Filtro + sort ----
let generoActivo = '';

function aplicarFiltros() {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();
  const sort   = document.getElementById('sort-select')?.value || 'recent';

  let lista = PRODUCTOS.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search) || p.tipo.toLowerCase().includes(search);
    const matchGenero = !generoActivo || p.genero === generoActivo;
    return matchSearch && matchGenero;
  });

  if (sort === 'price-asc')  lista.sort((a, b) => a.precio - b.precio);
  if (sort === 'price-desc') lista.sort((a, b) => b.precio - a.precio);
  if (sort === 'name')       lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  renderProductos(lista);
}

// ---- Modal ----
let modalProductoActual = null;
let modalQty = 1;
let modalImgs = [];
let modalImgIdx = 0;

function modalGoTo(i) {
  if (!modalImgs.length) return;
  modalImgIdx = (i + modalImgs.length) % modalImgs.length;
  const main = document.getElementById('modal-img');
  if (main) main.src = modalImgs[modalImgIdx];
  document.querySelectorAll('#modal-thumbs img').forEach((t, ti) => {
    t.style.border = '2px solid ' + (ti === modalImgIdx ? '#1a1a1a' : 'transparent');
  });
}

function modalSlide(delta) { modalGoTo(modalImgIdx + delta); }
window.modalGoTo = modalGoTo;
window.modalSlide = modalSlide;

function abrirModal(id) {
  const p = PRODUCTOS.find(x => x.id === id);
  if (!p) return;
  modalProductoActual = p;
  modalQty = 1;

  const imgs = p.imagenes && p.imagenes.length ? p.imagenes : (p.img ? [p.img] : []);
  modalImgs = imgs;
  modalImgIdx = 0;
  const mainImg = document.getElementById('modal-img');
  mainImg.src = imgs[0] || '';
  mainImg.alt = p.nombre;

  // Flechas de navegación dentro del modal (se inyectan una vez por apertura)
  const imgWrap = document.querySelector('#producto-modal .prod-modal__img-wrap');
  if (imgWrap) {
    imgWrap.querySelectorAll('.prod-modal__arrow').forEach(a => a.remove());
    if (imgs.length > 1) {
      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'prod-modal__arrow prod-modal__arrow--prev';
      prev.setAttribute('aria-label', 'Imagen anterior');
      prev.innerHTML = '&#8249;';
      prev.onclick = () => modalSlide(-1);
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'prod-modal__arrow prod-modal__arrow--next';
      next.setAttribute('aria-label', 'Imagen siguiente');
      next.innerHTML = '&#8250;';
      next.onclick = () => modalSlide(1);
      imgWrap.appendChild(prev);
      imgWrap.appendChild(next);
    }
  }

  document.getElementById('modal-marca').textContent  = p.marca;
  document.getElementById('modal-nombre').textContent = p.nombre;
  document.getElementById('modal-tipo').textContent   = p.nota || '';
  document.getElementById('modal-desc').textContent   = p.descripcion;
  document.getElementById('modal-precio').textContent = fmt(p.precio);
  document.getElementById('modal-qty').textContent    = modalQty;

  // Thumbnail strip
  const thumbsEl = document.getElementById('modal-thumbs');
  if (thumbsEl) {
    if (imgs.length > 1) {
      thumbsEl.style.display = 'flex';
      thumbsEl.innerHTML = imgs.map((url, i) => `
        <img
          src="${url}"
          onclick="modalGoTo(${i})"
          style="width:52px;height:52px;object-fit:cover;border-radius:3px;cursor:pointer;border:2px solid ${i === 0 ? '#1a1a1a' : 'transparent'};transition:border 0.2s;"
        >
      `).join('');
    } else {
      thumbsEl.style.display = 'none';
      thumbsEl.innerHTML = '';
    }
  }

  const modal = document.getElementById('producto-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    modal.querySelector('.prod-modal__box').classList.add('open');
  });
}

function cerrarModal() {
  const modal = document.getElementById('producto-modal');
  if (!modal || modal.style.display === 'none') return;
  const box = modal.querySelector('.prod-modal__box');
  box.classList.remove('open');
  box.addEventListener('transitionend', () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, { once: true });
  modalProductoActual = null;
}

function cambiarQty(delta) {
  const maxQty = modalProductoActual ? (modalProductoActual.stock || 1) : 999;
  modalQty = Math.max(1, Math.min(modalQty + delta, maxQty));
  document.getElementById('modal-qty').textContent = modalQty;
}

function agregarDesdeModal() {
  if (!modalProductoActual) return;
  if (modalProductoActual.stock === 0) {
    window.showToast('Este producto no tiene stock disponible.', 'error');
    return;
  }
  if (typeof window.Carrito !== 'undefined') {
    window.Carrito.agregar({ ...modalProductoActual }, modalQty);
    window.showToast(`"${modalProductoActual.nombre}" agregado al carrito.`, 'success');
    cerrarModal();
  } else {
    window.showToast('Error: módulo de carrito no disponible.', 'error');
  }
}

window.abrirModal        = abrirModal;
window.cerrarModal       = cerrarModal;
window.cambiarQty        = cambiarQty;
window.agregarDesdeModal = agregarDesdeModal;

// ---- Featured (homepage — "Más Vendidos") ----
window.loadFeaturedProductos = async function () {
  const section = document.getElementById('mas-vendidos');
  if (!section) return;

  try {
    const res  = await fetch(API_URL + '/productos?destacado=1');
    const json = await res.json();
    if (!json.success || !json.data || !json.data.length) return;

    const lista = json.data.map((p, i) => ({ ...mapProducto(p), rank: i + 1 }));

    // Merge into PRODUCTOS so modal works on homepage
    lista.forEach(p => {
      if (!PRODUCTOS.find(x => x.id === p.id)) PRODUCTOS.push(p);
    });

    renderMasVendidos(section, lista);
  } catch (e) {
    console.error('Error cargando destacados:', e);
  }
};

function renderMasVendidos(section, lista) {
  section.className = 'mas-vendidos__section';

  const header    = document.createElement('div');
  header.className = 'mv-header';

  const titleWrap = document.createElement('div');
  const title     = document.createElement('h2');
  title.textContent = 'MÁS VENDIDOS';
  Object.assign(title.style, {
    fontFamily: "'Cormorant', Georgia, serif",
    fontSize: '1rem', fontWeight: '300', letterSpacing: '4px',
    color: '#1a1a1a', marginBottom: '0.4rem',
  });
  titleWrap.appendChild(title);

  const verTodos = document.createElement('a');
  verTodos.textContent = 'VER TODOS LOS PRODUCTOS';
  verTodos.href = (typeof PAGES_BASE !== 'undefined' ? PAGES_BASE : '') + '/productos';
  Object.assign(verTodos.style, {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.68rem', fontWeight: '500', letterSpacing: '2.5px',
    color: '#555', textDecoration: 'none',
    borderBottom: '1px solid #999', paddingBottom: '2px', alignSelf: 'center',
  });

  header.appendChild(titleWrap);
  header.appendChild(verTodos);
  section.appendChild(header);

  const grid    = document.createElement('div');
  grid.className = 'mas-vendidos__grid';

  lista.forEach(p => {
    const card     = document.createElement('div');
    card.className  = 'mv-card';
    card.style.position = 'relative';
    card.style.cursor   = 'pointer';
    card.addEventListener('mouseenter', () => card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.10)');
    card.addEventListener('mouseleave', () => card.style.boxShadow = 'none');
    card.addEventListener('click', () => { if (typeof abrirModal === 'function') abrirModal(p.id); });

    const badge = document.createElement('span');
    badge.textContent = '#' + p.rank;
    Object.assign(badge.style, {
      position: 'absolute', top: '12px', left: '12px',
      background: '#e8ddd0', color: '#6b5a45',
      fontSize: '0.6rem', fontWeight: '600', letterSpacing: '1px',
      padding: '3px 7px', borderRadius: '2px',
    });

    const imgWrap     = document.createElement('div');
    imgWrap.className  = 'mv-card__img-wrap';
    const mvImgs = (p.imagenes && p.imagenes.length) ? p.imagenes : (p.img ? [p.img] : []);
    imgWrap.innerHTML = cardSliderHTML(mvImgs, p.nombre, p.img);

    const info = document.createElement('div');
    Object.assign(info.style, { padding: '1.2rem 1.2rem 1.4rem' });

    const nombreEl = document.createElement('div');
    nombreEl.textContent = p.nombre;
    Object.assign(nombreEl.style, {
      fontFamily: "'Garet', 'Nunito', sans-serif",
      fontSize: '1.05rem', fontWeight: '400', letterSpacing: '0.5px',
      color: '#1a1a1a', marginBottom: '2px',
    });

    const tipoEl = document.createElement('div');
    tipoEl.textContent = p.marca;
    Object.assign(tipoEl.style, {
      fontSize: '0.68rem', color: '#888', letterSpacing: '1px', marginBottom: '2px',
    });

    const notaEl = document.createElement('div');
    notaEl.textContent = p.nota ? p.nota.slice(0, 50) : '';
    Object.assign(notaEl.style, {
      fontSize: '0.65rem', color: '#aaa', letterSpacing: '0.5px', marginBottom: '0.8rem',
    });

    const precioEl = document.createElement('div');
    precioEl.textContent = fmt(p.precio);
    Object.assign(precioEl.style, {
      fontSize: '1rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '1rem',
    });

    const btn = document.createElement('button');
    btn.textContent = 'AGREGAR AL CARRITO';
    Object.assign(btn.style, {
      width: '100%', padding: '0.75rem',
      background: '#1a1a1a', color: '#e8d8c7', border: 'none',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '0.65rem', fontWeight: '600', letterSpacing: '2.5px',
      cursor: 'pointer', transition: 'background 0.3s',
    });
    if (p.stock === 0) {
      btn.textContent = 'SIN STOCK';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.addEventListener('mouseenter', () => btn.style.background = '#3a2810');
      btn.addEventListener('mouseleave', () => btn.style.background = '#1a1a1a');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof window.Carrito !== 'undefined') {
          window.Carrito.agregar({ ...p }, 1);
          window.showToast(`"${p.nombre}" agregado al carrito.`, 'success');
        }
      });
    }

    info.appendChild(nombreEl);
    info.appendChild(tipoEl);
    info.appendChild(notaEl);
    info.appendChild(precioEl);
    info.appendChild(btn);

    card.appendChild(badge);
    card.appendChild(imgWrap);
    card.appendChild(info);
    grid.appendChild(card);
  });

  section.appendChild(grid);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  const params    = new URLSearchParams(window.location.search);
  const generoUrl = params.get('genero') || '';
  if (generoUrl) {
    generoActivo = generoUrl;
    document.querySelectorAll('.filter-genero__btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.genero === generoUrl);
    });
  }

  // Only fetch + render grid on productos.html
  if (document.getElementById('productos-grid')) {
    await fetchAllProductos();
    aplicarFiltros();

    document.getElementById('search-input')?.addEventListener('input', aplicarFiltros);
    document.getElementById('sort-select')?.addEventListener('change', aplicarFiltros);

    document.querySelectorAll('.filter-genero__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        generoActivo = btn.dataset.genero;
        document.querySelectorAll('.filter-genero__btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        aplicarFiltros();
      });
    });
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });
});
