const API = 'http://localhost:3000';

// ─── DOM refs ───────────────────────────────────────────────────────────────
const loginBtn    = document.getElementById('btn-login');
const registerBtn = document.getElementById('btn-register');
const userBar     = document.getElementById('user-bar');
const userNameEl  = document.getElementById('user-name');
const logoutBtn   = document.getElementById('btn-logout');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const nameField    = document.getElementById('field-name');
const emailInput   = document.getElementById('input-email');
const passwordInput= document.getElementById('input-password');
const nameInput    = document.getElementById('input-name');
const submitBtn    = document.getElementById('modal-submit');
const modalMsg     = document.getElementById('modal-msg');
const modalClose   = document.getElementById('modal-close');
const switchLink   = document.getElementById('modal-switch-link');
const switchText   = document.getElementById('modal-switch-text');

let mode = 'login'; // 'login' | 'register'

// ─── Auth helpers ────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); }

function updateNavAuth() {
  const name = localStorage.getItem('userName');
  if (getToken() && name) {
    loginBtn.style.display    = 'none';
    registerBtn.style.display = 'none';
    userBar.style.display     = 'flex';
    userNameEl.textContent    = `Olá, ${name}`;
  } else {
    loginBtn.style.display    = 'inline-block';
    registerBtn.style.display = 'inline-block';
    userBar.style.display     = 'none';
  }
}

// ─── Modal control ───────────────────────────────────────────────────────────
function openModal(m) {
  mode = m;
  modalMsg.textContent = '';
  emailInput.value = '';
  passwordInput.value = '';
  nameInput.value = '';

  if (m === 'login') {
    modalTitle.textContent   = 'Entrar';
    nameField.style.display  = 'none';
    submitBtn.textContent    = 'Entrar';
    switchText.innerHTML     = 'Não tem conta? <a id="modal-switch-link" onclick="openModal(\'register\')">Cadastre-se</a>';
  } else {
    modalTitle.textContent   = 'Criar conta';
    nameField.style.display  = 'block';
    submitBtn.textContent    = 'Cadastrar';
    switchText.innerHTML     = 'Já tem conta? <a id="modal-switch-link" onclick="openModal(\'login\')">Entrar</a>';
  }

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

// ─── Submit ──────────────────────────────────────────────────────────────────
async function handleSubmit() {
  modalMsg.textContent = '';
  const email    = emailInput.value.trim();
  const password = passwordInput.value;
  const name     = nameInput.value.trim();

  if (!email || !password || (mode === 'register' && !name)) {
    modalMsg.textContent = 'Preencha todos os campos.';
    modalMsg.className   = 'modal-msg error';
    return;
  }

  try {
    if (mode === 'register') {
      // 1. Create user
      const regRes = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Erro ao cadastrar');

      // 2. Auto-login
      const logRes = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const logData = await logRes.json();
      if (!logRes.ok) throw new Error(logData.error || 'Erro ao fazer login');

      setToken(logData.token);
      localStorage.setItem('userName', name);
      modalMsg.textContent = 'Conta criada! Bem-vindo(a)!';
      modalMsg.className   = 'modal-msg success';
      setTimeout(() => { closeModal(); updateNavAuth(); }, 1000);

    } else {
      const res  = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar');

      setToken(data.token);
      // Fetch name
      const meRes  = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${data.token}` } });
      const users  = await meRes.json();
      localStorage.setItem('userName', users[0]?.name || email);

      modalMsg.textContent = 'Login realizado!';
      modalMsg.className   = 'modal-msg success';
      setTimeout(() => { closeModal(); updateNavAuth(); }, 800);
    }
  } catch (err) {
    modalMsg.textContent = err.message;
    modalMsg.className   = 'modal-msg error';
  }
}

// ─── Event listeners ─────────────────────────────────────────────────────────
loginBtn.addEventListener('click',    () => openModal('login'));
registerBtn.addEventListener('click', () => openModal('register'));
modalClose.addEventListener('click',  closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
submitBtn.addEventListener('click',   handleSubmit);
logoutBtn.addEventListener('click',   () => {
  clearToken();
  localStorage.removeItem('userName');
  updateNavAuth();
});

// Allow Enter key inside modal
[emailInput, passwordInput, nameInput].forEach(el => {
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });
});

// ─── Init ────────────────────────────────────────────────────────────────────
updateNavAuth();
