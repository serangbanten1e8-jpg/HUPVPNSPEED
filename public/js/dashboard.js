async function loadDashboard() {
  const res = await fetch('/api/me', {
    headers: { Authorization: `Bearer ${localStorage.idToken}` }
  });
  const data = await res.json();
  document.getElementById('balance').innerText = data.balance?.toLocaleString() || '0';
  document.getElementById('username').innerText = data.username || 'User';
  document.getElementById('role').innerText = data.role || 'Member';
}
loadDashboard();
