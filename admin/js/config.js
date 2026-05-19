const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const APP_BASE = isLocal ? '/nuvo' : '';
const API_URL  = (isLocal ? 'http://localhost/nuvo' : 'https://nuvearg.com') + '/api/index.php';
