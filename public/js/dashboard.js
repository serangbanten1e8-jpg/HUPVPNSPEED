async function loadDashboard() {
  const res = await fetch('/api/me', {
    headers: { Authorization: `Bearer ${localStorage.idToken}` }
  });
  const data = await res.json();
  document.getElementById('balance').innerText = data.balance.toLocaleString();
  document.getElementById('username').innerText = data.username;
  document.getElementById('role').innerText = data.role;
}
loadDashboard();