const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const APP_BASE   = isLocal ? '/nuvo' : '';
const PAGES_BASE = isLocal ? '/nuvo/frontend' : '';
const API_URL    = APP_BASE + '/api/index.php';
