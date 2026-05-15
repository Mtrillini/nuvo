// ============================================================
// NÜVE — main.js
// ============================================================

// ---- Inject Font Awesome ----
function injectFontAwesome() {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  document.head.appendChild(fa);
}

// ---- Navbar HTML ----
function getNavbarHTML() {
  return `
    <header class="navbar" id="main-navbar">

      <div class="navbar__logo-wrap">
        <a href="/nuvo/frontend/index.html">
          <img src="/nuvo/frontend/images/logo.png" alt="NÜVE" class="navbar__logo-img">
        </a>
      </div>

      <nav class="navbar__nav">
        <a href="/nuvo/frontend/index.html" class="navbar__link" data-page="index">INICIO</a>
        <a href="/nuvo/frontend/productos.html" class="navbar__link" data-page="productos">PERFUMES</a>
        <div class="navbar__dropdown">
          <a href="#" class="navbar__link">COLECCIONES</a>
          <div class="navbar__dropdown-menu">
            <a href="/nuvo/frontend/productos.html?genero=femenino" class="navbar__dropdown-item">FEMENINO</a>
            <a href="/nuvo/frontend/productos.html?genero=masculino" class="navbar__dropdown-item">MASCULINO</a>
          </div>
        </div>
        <a href="/nuvo/frontend/nosotros.html" class="navbar__link" data-page="nosotros">SOBRE NÜVE</a>
      </nav>

      <div class="navbar__icons">
        <a href="#" class="navbar__icon-link">
          <i class="fa-solid fa-magnifying-glass"></i>
        </a>
        <a href="#" class="navbar__icon-link">
          <i class="fa-regular fa-user"></i>
        </a>
        <a href="/nuvo/frontend/carrito.html" class="navbar__cart" aria-label="Carrito">
          <i class="fa-solid fa-bag-shopping"></i>
          <span class="cart-badge" id="cart-badge" style="display:none;">0</span>
        </a>
        <button class="navbar__hamburger" id="hamburger-btn" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
      </div>

    </header>

    <div class="mobile-menu" id="mobile-menu">
      <a href="/nuvo/frontend/index.html">Inicio</a>
      <a href="/nuvo/frontend/productos.html">Perfumes</a>
      <a href="/nuvo/frontend/productos.html?genero=femenino">Colecciones Femenino</a>
      <a href="/nuvo/frontend/productos.html?genero=masculino">Colecciones Masculino</a>
      <a href="/nuvo/frontend/nosotros.html">Sobre NÜVE</a>
      <a href="/nuvo/frontend/carrito.html">Carrito</a>
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
        </div>

        <div>
          <div class="footer__heading">Navegación</div>
          <nav class="footer__nav">
            <a href="/nuvo/frontend/index.html">Inicio</a>
            <a href="/nuvo/frontend/productos.html">Perfumes</a>
            <a href="/nuvo/frontend/nosotros.html">Nosotros</a>
            <a href="/nuvo/frontend/contacto.html">Contacto</a>
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
  injectFontAwesome();

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
