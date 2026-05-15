// ============================================================
// NÜVE — checkout.js
// ============================================================

// ---- Render order summary in checkout ----
function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary');
  if (!container) return;

  const carrito = window.Carrito ? window.Carrito.get() : { items: [] };
  const fmt = window.formatMoney || (v => '$' + v);

  if (!carrito.items || carrito.items.length === 0) {
    container.innerHTML = `
      <div class="order-summary">
        <div class="order-summary__title">Tu pedido</div>
        <p style="font-family:var(--font-secondary);font-size:0.8rem;color:var(--taupe);">El carrito está vacío.</p>
        <div class="order-summary__actions" style="margin-top:1rem;">
          <a href="/nuve-ecommerce/frontend/carrito.html" class="btn btn-secondary" style="text-align:center;">Volver al carrito</a>
        </div>
      </div>
    `;
    return;
  }

  const subtotal = window.Carrito.getTotal();
  const itemsHTML = carrito.items.map(item => `
    <div class="order-summary__row">
      <span style="font-family:var(--font-primary);font-size:1rem;">${item.nombre} <span style="font-size:0.75rem;color:var(--taupe);">x${item.cantidad}</span></span>
      <span>${fmt(item.precio * item.cantidad)}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="order-summary">
      <div class="order-summary__title">Tu pedido</div>
      ${itemsHTML}
      <div class="order-summary__row">
        <span>Subtotal</span>
        <span>${fmt(subtotal)}</span>
      </div>
      <div class="order-summary__row">
        <span>Envío</span>
        <span>A calcular</span>
      </div>
      <div class="order-summary__row order-summary__row--total">
        <span>Total</span>
        <span>${fmt(subtotal)}</span>
      </div>
      <div style="margin-top:1.5rem;" class="mp-badge">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Pago seguro con MercadoPago
      </div>
    </div>
  `;
}

// ---- Form validation ----
function validateField(input) {
  const value = input.value.trim();
  const errorEl = input.parentElement.querySelector('.form-error');

  let valid = true;
  let msg = '';

  if (input.required && value === '') {
    valid = false;
    msg = 'Este campo es obligatorio.';
  } else if (input.type === 'email' && value !== '') {
    const emailRgx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRgx.test(value)) {
      valid = false;
      msg = 'Ingresá un email válido.';
    }
  } else if (input.id === 'telefono' && value !== '') {
    const telRgx = /^[\d\s\+\-\(\)]{7,}$/;
    if (!telRgx.test(value)) {
      valid = false;
      msg = 'Ingresá un teléfono válido.';
    }
  } else if (input.id === 'cp' && value !== '') {
    if (!/^\d{4,}$/.test(value)) {
      valid = false;
      msg = 'Ingresá un código postal válido.';
    }
  }

  if (valid) {
    input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  } else {
    input.classList.add('error');
    if (errorEl) errorEl.textContent = msg;
  }

  return valid;
}

function validateForm(form) {
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  let allValid = true;
  inputs.forEach(input => {
    if (!validateField(input)) allValid = false;
  });
  return allValid;
}

// ---- Submit checkout ----
async function submitCheckout(e) {
  e.preventDefault();

  const form = document.getElementById('checkout-form');
  if (!form) return;

  if (!validateForm(form)) {
    showToast('Por favor, completá todos los campos requeridos.', 'error');
    return;
  }

  const carrito = window.Carrito ? window.Carrito.get() : { items: [] };
  if (!carrito.items || carrito.items.length === 0) {
    showToast('Tu carrito está vacío.', 'error');
    return;
  }

  const btn = document.getElementById('btn-pagar');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Procesando...';
  }

  const payload = {
    nombre:    document.getElementById('nombre')?.value.trim()    || '',
    apellido:  document.getElementById('apellido')?.value.trim()  || '',
    email:     document.getElementById('email')?.value.trim()     || '',
    telefono:  document.getElementById('telefono')?.value.trim()  || '',
    direccion: buildDireccion(),
    items:     carrito.items.map(item => ({
      id:         item.id,
      cantidad:   item.cantidad,
    })),
  };

  // Combine nombre + apellido for the API
  payload.nombre = payload.nombre + ' ' + payload.apellido;

  try {
    const res = await fetch(API_URL + '/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al crear el pedido.');
    }

    // Vaciar carrito
    if (window.Carrito) window.Carrito.vaciar();

    // Redirect to MercadoPago
    const initPoint = json.data?.init_point || json.data?.sandbox_init_point;
    if (initPoint) {
      showToast('Pedido creado. Redirigiendo a MercadoPago...', 'success');
      setTimeout(() => { window.location.href = initPoint; }, 1200);
    } else {
      // No MP configured — redirect to result page
      const pedidoId = json.data?.pedido?.id;
      showToast('Pedido creado correctamente.', 'success');
      setTimeout(() => {
        window.location.href = `/nuve-ecommerce/frontend/checkout-resultado.html?status=pending&pedido_id=${pedidoId}`;
      }, 1200);
    }

  } catch (err) {
    showToast(err.message || 'Error al procesar el pedido.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Pagar con MercadoPago';
    }
  }
}

function buildDireccion() {
  const partes = [
    document.getElementById('direccion')?.value.trim(),
    document.getElementById('ciudad')?.value.trim(),
    document.getElementById('provincia')?.value.trim(),
    document.getElementById('cp')?.value.trim(),
  ].filter(Boolean);
  return partes.join(', ');
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();

  const form = document.getElementById('checkout-form');
  if (form) {
    // Real-time validation
    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('blur', () => validateField(input));
    });
    form.addEventListener('submit', submitCheckout);
  }

  // Redirect if cart empty (after a moment to let JS load)
  setTimeout(() => {
    const carrito = window.Carrito ? window.Carrito.get() : { items: [] };
    if (!carrito.items || carrito.items.length === 0) {
      if (document.getElementById('checkout-form')) {
        showToast('Tu carrito está vacío.', 'info');
        setTimeout(() => { window.location.href = '/nuve-ecommerce/frontend/carrito.html'; }, 1500);
      }
    }
  }, 500);
});
