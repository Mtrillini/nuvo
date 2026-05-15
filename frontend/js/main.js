// ============================================================
// NÜVE — main.js
// ============================================================

// ---- Navbar HTML ----
function getNavbarHTML() {
  return `
    <nav class="navbar" id="main-navbar">
      <div class="navbar__left">
        <a href="/nuve-ecommerce/frontend/index.html" class="navbar__link" data-page="index">Inicio</a>
        <a href="/nuve-ecommerce/frontend/originales.html" class="navbar__link" data-page="originales">Originales</a>
        <a href="/nuve-ecommerce/frontend/testers.html" class="navbar__link" data-page="testers">Testers</a>
      </div>

      <a href="/nuve-ecommerce/frontend/index.html" class="navbar__logo">NÜVE</a>

      <div class="navbar__right">
        <a href="/nuve-ecommerce/frontend/nosotros.html" class="navbar__link" data-page="nosotros">Nosotros</a>
        <a href="/nuve-ecommerce/frontend/contacto.html" class="navbar__link" data-page="contacto">Contacto</a>
        <a href="/nuve-ecommerce/frontend/carrito.html" class="navbar__cart" aria-label="Carrito">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span class="cart-badge" id="cart-badge" style="display:none;">0</span>
        </a>
        <button class="navbar__hamburger" id="hamburger-btn" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <div class="mobile-menu" id="mobile-menu">
      <a href="/nuve-ecommerce/frontend/index.html">Inicio</a>
      <a href="/nuve-ecommerce/frontend/originales.html">Originales</a>
      <a href="/nuve-ecommerce/frontend/testers.html">Testers</a>
      <a href="/nuve-ecommerce/frontend/nosotros.html">Nosotros</a>
      <a href="/nuve-ecommerce/frontend/contacto.html">Contacto</a>
      <a href="/nuve-ecommerce/frontend/carrito.html">Carrito</a>
    </div>
  `;
}

// ---- Footer HTML ----
function getFooterHTML() {
  return `
    <footer class="footer">
      <div class="footer__top">
        <div>
          <div class="footer__logo">NÜVE</div>
          <p class="footer__tagline">
            Perfumería de autor.<br>
            Esencias únicas para quienes<br>
            buscan lo extraordinario.
          </p>
        </div>

        <div>
          <div class="footer__heading">Navegación</div>
          <nav class="footer__nav">
            <a href="/nuve-ecommerce/frontend/index.html">Inicio</a>
            <a href="/nuve-ecommerce/frontend/originales.html">Originales</a>
            <a href="/nuve-ecommerce/frontend/testers.html">Testers</a>
            <a href="/nuve-ecommerce/frontend/nosotros.html">Nosotros</a>
            <a href="/nuve-ecommerce/frontend/contacto.html">Contacto</a>
          </nav>
        </div>

        <div>
          <div class="footer__heading">Contacto</div>
          <p class="footer__contact-item">info@nuve.com</p>
          <p class="footer__contact-item">+54 11 5555-0000</p>
          <p class="footer__contact-item">Buenos Aires, Argentina</p>
          <div class="footer__heading" style="margin-top:1.5rem;">Redes</div>
          <p class="footer__contact-item">@nuve.perfumeria</p>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copy">
          &copy; ${new Date().getFullYear()} NÜVE Perfumería. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  `;
}

// ---- Toast container ----
function createToastContainer() {
  if (document.getElementById('toast-container')) return;
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.className = 'toast-container';
  document.body.appendChild(div);
}

// ---- showToast ----
window.showToast = function(message, type = 'info') {
  createToastContainer();
  const container = document.getElementById('toast-container');

  const icons = { success: '✓', error: '✕', info: '◆' };
  const icon = icons[type] || icons.info;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3500);
};

// ---- Cart counter badge ----
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  try {
    const raw = localStorage.getItem('nuve_cart');
    if (!raw) { badge.style.display = 'none'; return; }
    const carrito = JSON.parse(raw);
    const total = (carrito.items || []).reduce((sum, item) => sum + (item.cantidad || 0), 0);
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    badge.style.display = 'none';
  }
}

window.updateCartBadge = updateCartBadge;

// ---- Active nav link ----
function setActiveNavLink() {
  const path = window.location.pathname;
  const filename = path.split('/').pop().replace('.html', '') || 'index';

  document.querySelectorAll('.navbar__link[data-page]').forEach(link => {
    const page = link.getAttribute('data-page');
    if (page === filename) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ---- Hamburger toggle ----
function setupHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ---- Navbar scroll behaviour ----
function setupNavbarScroll() {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ---- Smooth scroll for # links ----
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ---- Format currency ----
window.formatMoney = function(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ============================================================
// DOMContentLoaded init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Inject navbar
  const navbarEl = document.getElementById('navbar');
  if (navbarEl) {
    navbarEl.innerHTML = getNavbarHTML();
  }

  // Inject footer
  const footerEl = document.getElementById('footer');
  if (footerEl) {
    footerEl.innerHTML = getFooterHTML();
  }

  updateCartBadge();
  setActiveNavLink();
  setupHamburger();
  setupNavbarScroll();
  setupSmoothScroll();

  // Listen for cart changes from other scripts
  window.addEventListener('carrito-updated', updateCartBadge);
});
