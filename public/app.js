* {
  box-sizing: border-box;
}

:root {
  --bg: #081220;
  --panel: #111d2d;
  --panel-alt: #16273c;
  --text: #edf6ff;
  --muted: #a7b9d1;
  --green: #34d399;
  --red: #f87171;
  --yellow: #fbbf24;
  --blue: #60a5fa;
}

body {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  background: linear-gradient(135deg, var(--bg), #102033);
  color: var(--text);
}

.app-shell {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: rgba(17, 29, 45, 0.9);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 24px 20px;
}

.sidebar h1 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

.status-card,
.metric-card,
.panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.status-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.label,
.eyebrow {
  color: var(--muted);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.controls label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--muted);
}

input,
select,
button {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--panel-alt);
  color: var(--text);
  font-size: 1rem;
  padding: 10px 12px;
}

button {
  cursor: pointer;
  transition: transform 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
}

button.secondary {
  background: rgba(96, 165, 250, 0.12);
}

button.danger {
  background: rgba(248, 113, 113, 0.12);
}

.main-panel {
  padding: 28px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 26px;
}

.topbar h2 {
  margin: 6px 0 0;
  font-size: 2rem;
}

.pill {
  background: rgba(52, 211, 153, 0.12);
  color: var(--green);
  border: 1px solid rgba(52, 211, 153, 0.2);
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 700;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.metric-card {
  padding: 18px 20px;
}

.metric-card span {
  display: block;
  color: var(--muted);
  margin-bottom: 12px;
}

.metric-card strong {
  font-size: 2rem;
  font-weight: 700;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

.panel {
  padding: 18px;
}

.panel h3 {
  margin-top: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.log-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-list li {
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--muted);
}

@media (max-width: 900px) {
  .app-shell,
  .content-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .main-panel {
    padding: 18px;
  }
}
