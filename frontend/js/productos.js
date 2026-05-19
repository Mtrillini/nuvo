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
    stock:       parseInt(p.stock) || 0,
    genero:      p.tipo,
  };
}

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

  container.innerHTML = lista.map(p => `
    <div class="nuve-card" onclick="abrirModal(${p.id})">
      <div class="nuve-card__img-wrap">
        <img src="${p.img || '${APP_BASE}/frontend/images/logo-nuve.png'}" alt="${p.nombre}" loading="lazy">
      </div>
      <div class="nuve-card__body">
        <div class="nuve-card__nombre">${p.nombre}</div>
        <div class="nuve-card__marca">${p.marca}</div>
        <div class="nuve-card__tipo">${p.nota ? p.nota.slice(0, 60) : ''}</div>
        <div class="nuve-card__precio">${fmt(p.precio)}</div>
        <button class="nuve-card__btn" onclick="event.stopPropagation(); abrirModal(${p.id})">AGREGAR AL CARRITO</button>
      </div>
    </div>
  `).join('');
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

function abrirModal(id) {
  const p = PRODUCTOS.find(x => x.id === id);
  if (!p) return;
  modalProductoActual = p;
  modalQty = 1;

  const imgs = p.imagenes && p.imagenes.length ? p.imagenes : (p.img ? [p.img] : []);
  const mainImg = document.getElementById('modal-img');
  mainImg.src = imgs[0] || '';
  mainImg.alt = p.nombre;

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
          onclick="document.getElementById('modal-img').src='${url}'"
          style="width:52px;height:52px;object-fit:cover;border-radius:3px;cursor:pointer;border:2px solid ${i === 0 ? '#1a1a1a' : 'transparent'};transition:border 0.2s;"
          onmouseover="this.style.border='2px solid #1a1a1a'"
          onmouseout="this.style.border='2px solid ${i === 0 ? '#1a1a1a' : 'transparent'}'"
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
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById('modal-qty').textContent = modalQty;
}

function agregarDesdeModal() {
  if (!modalProductoActual) return;
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
    const img          = document.createElement('img');
    img.src   = p.img || '${APP_BASE}/frontend/images/logo-nuve.png';
    img.alt   = p.nombre;
    Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'contain' });
    imgWrap.appendChild(img);

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
    btn.addEventListener('mouseenter', () => btn.style.background = '#3a2810');
    btn.addEventListener('mouseleave', () => btn.style.background = '#1a1a1a');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (typeof window.Carrito !== 'undefined') {
        window.Carrito.agregar({ ...p }, 1);
        window.showToast(`"${p.nombre}" agregado al carrito.`, 'success');
      }
    });

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
