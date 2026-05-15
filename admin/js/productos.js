// ============================================================
// NÜVE Admin — productos.js
// ============================================================

let allProductos = [];
let editingId    = null;

// ---- Fetch ----
async function fetchProductos() {
  try {
    showTableLoading();
    const res  = await fetch(API_URL + '/productos', { credentials: 'include' });
    const json = await res.json();

    if (!json.success) throw new Error(json.message || 'Error al cargar productos.');

    // Admin sees all including inactive — fetch without activo filter
    // (The public API only returns activo=1; admin uses same endpoint for now)
    allProductos = json.data || [];
    renderTabla(allProductos);
  } catch (err) {
    showToast(err.message, 'error');
    document.getElementById('productos-tbody').innerHTML =
      `<tr><td colspan="8" style="text-align:center;color:var(--taupe);padding:2rem;">${err.message}</td></tr>`;
  }
}

function showTableLoading() {
  const tbody = document.getElementById('productos-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="loading">Cargando...</td></tr>`;
}

// ---- Render table ----
function renderTabla(productos) {
  const tbody = document.getElementById('productos-tbody');
  if (!tbody) return;

  if (!productos.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--taupe);padding:2rem;">Sin productos.</td></tr>`;
    return;
  }

  tbody.innerHTML = productos.map(p => `
    <tr>
      <td>
        <img
          class="table-img"
          src="${p.imagen_url || 'https://via.placeholder.com/44x44/F2ECE6/0D0D0D?text=N'}"
          alt="${escHtml(p.nombre)}"
          onerror="this.src='https://via.placeholder.com/44x44/F2ECE6/0D0D0D?text=N'"
        >
      </td>
      <td>
        <strong style="font-weight:500;">${escHtml(p.nombre)}</strong>
        <div style="font-size:0.7rem;color:var(--taupe);margin-top:2px;">${escHtml(p.nota_olfativa || '').slice(0,50)}${(p.nota_olfativa||'').length > 50 ? '...' : ''}</div>
      </td>
      <td>${escHtml(p.categoria_nombre || '')}</td>
      <td><span class="badge badge--${p.tipo === 'tester' ? 'cancelado' : 'activo'}">${capitalize(p.tipo)}</span></td>
      <td>${formatMoney(p.precio)}</td>
      <td>
        <span style="font-weight:600;color:${parseInt(p.stock) === 0 ? '#c07b7b' : parseInt(p.stock) < 5 ? '#d4931a' : 'inherit'};">
          ${p.stock}
        </span>
      </td>
      <td><span class="badge badge--${parseInt(p.activo) === 1 ? 'activo' : 'inactivo'}">${parseInt(p.activo) === 1 ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-secondary btn-sm" onclick="openModal(${p.id})" title="Editar">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProducto(${p.id}, '${escHtml(p.nombre)}')" title="Eliminar">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- Open modal ----
async function openModal(id = null) {
  editingId = id;
  const modal = document.getElementById('modal-overlay');
  const form  = document.getElementById('producto-form');
  const title = document.getElementById('modal-title');

  form.reset();

  if (id !== null) {
    title.textContent = 'Editar Producto';
    const producto = allProductos.find(p => p.id === id);
    if (producto) {
      document.getElementById('f-nombre').value       = producto.nombre       || '';
      document.getElementById('f-descripcion').value  = producto.descripcion  || '';
      document.getElementById('f-nota').value         = producto.nota_olfativa|| '';
      document.getElementById('f-precio').value       = producto.precio       || '';
      document.getElementById('f-stock').value        = producto.stock        ?? '';
      document.getElementById('f-imagen').value       = producto.imagen_url   || '';
      document.getElementById('f-tipo').value         = producto.tipo         || 'original';
      document.getElementById('f-categoria').value    = producto.categoria_id  || '1';
      document.getElementById('f-activo').checked    = parseInt(producto.activo) === 1;
    }
  } else {
    title.textContent = 'Nuevo Producto';
    document.getElementById('f-activo').checked = true;
    document.getElementById('f-tipo').value = 'original';
    document.getElementById('f-categoria').value = '1';
  }

  modal.classList.add('open');
}

window.openModal = openModal;

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  editingId = null;
}

// ---- Save (create / update) ----
async function saveProducto() {
  const form = document.getElementById('producto-form');
  const nombre = document.getElementById('f-nombre').value.trim();
  const precio = parseFloat(document.getElementById('f-precio').value);

  if (!nombre) { showToast('El nombre es obligatorio.', 'error'); return; }
  if (isNaN(precio) || precio <= 0) { showToast('Ingresá un precio válido.', 'error'); return; }

  const payload = {
    nombre,
    descripcion:    document.getElementById('f-descripcion').value.trim(),
    nota_olfativa:  document.getElementById('f-nota').value.trim(),
    precio,
    stock:          parseInt(document.getElementById('f-stock').value) || 0,
    imagen_url:     document.getElementById('f-imagen').value.trim(),
    tipo:           document.getElementById('f-tipo').value,
    categoria_id:   parseInt(document.getElementById('f-categoria').value) || 1,
    activo:         document.getElementById('f-activo').checked ? 1 : 0,
  };

  const saveBtn = document.getElementById('btn-save');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando...';

  try {
    let url    = API_URL + '/productos';
    let method = 'POST';
    if (editingId !== null) {
      url    = API_URL + '/productos/' + editingId;
      method = 'PUT';
    }

    const res  = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!json.success) throw new Error(json.message || 'Error al guardar producto.');

    showToast(editingId ? 'Producto actualizado.' : 'Producto creado.', 'success');
    closeModal();
    fetchProductos();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
  }
}

window.saveProducto = saveProducto;

// ---- Delete ----
async function deleteProducto(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"? El producto quedará inactivo.`)) return;

  try {
    const res  = await fetch(API_URL + '/productos/' + id, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al eliminar.');
    showToast('Producto eliminado.', 'success');
    fetchProductos();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.deleteProducto = deleteProducto;

// ---- Search filter ----
function filterProductos(query) {
  const q = query.toLowerCase().trim();
  if (!q) { renderTabla(allProductos); return; }
  const filtered = allProductos.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    (p.categoria_nombre || '').toLowerCase().includes(q) ||
    p.tipo.toLowerCase().includes(q)
  );
  renderTabla(filtered);
}

// ---- Helpers ----
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  const authenticated = await checkAuth();
  if (!authenticated) return;

  fetchProductos();

  // New product button
  const btnNuevo = document.getElementById('btn-nuevo-producto');
  if (btnNuevo) btnNuevo.addEventListener('click', () => openModal(null));

  // Close modal
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);

  // Overlay click close
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Search
  const searchInput = document.getElementById('search-productos');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterProductos(searchInput.value));
  }
});
