* {
  box-sizing: border-box;
}

:root {
  --bg: #070b12;
  --panel: rgba(11, 17, 24, 0.92);
  --panel-strong: rgba(15, 23, 31, 1);
  --line: rgba(125, 211, 252, 0.28);
  --text: #edf6ff;
  --muted: #9fb7c7;
  --accent: #7dd3fc;
  --success: #3bd67a;
  --danger: #ff6b6b;
  --warning: #f59e0b;
  --shadow: 0 0 20px rgba(125, 211, 252, 0.2);
}

html, body {
  margin: 0;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, rgba(125, 211, 252, 0.12), transparent 35%), #050a10;
  color: var(--text);
  min-height: 100%;
}

body {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.shell {
  width: min(100%, 900px);
}

.narrow {
  width: min(100%, 680px);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  font-size: 2.2rem;
  filter: drop-shadow(0 0 12px rgba(125, 211, 252, 0.5));
}

.eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.18rem;
  text-transform: uppercase;
  color: var(--muted);
}

.brand-name {
  font-size: 1.05rem;
  font-weight: 700;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: var(--shadow);
  padding: 28px 20px 24px;
  position: relative;
  overflow: hidden;
}

.panel::before {
  content: "";
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.8), transparent);
}

.owl-crest {
  text-align: center;
  font-size: clamp(2.1rem, 5vw, 3.8rem);
  margin-bottom: 8px;
  filter: drop-shadow(0 0 14px rgba(125, 211, 252, 0.35));
}

h1, h2, h3, p {
  margin: 0;
}

h1 {
  text-align: center;
  font-size: clamp(2rem, 5vw, 3.1rem);
  letter-spacing: 0.12rem;
}

.subheading {
  text-align: center;
  margin-top: 8px;
  color: var(--muted);
}

.pairing-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 28px;
}

.country-row {
  display: flex;
  justify-content: center;
}

.country-code {
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid var(--line);
  width: min(100%, 320px);
  border-radius: 12px;
  padding: 12px 14px;
  font-weight: 600;
  text-align: center;
}

input {
  width: min(100%, 320px);
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(15, 23, 31, 0.8);
  color: var(--text);
  padding: 14px 16px;
  font-size: 1rem;
}

button {
  border: none;
  border-radius: 12px;
  padding: 14px 18px;
  font-weight: 700;
  letter-spacing: 0.06rem;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
}

button.primary-button, .pairing-form button {
  width: min(100%, 320px);
  margin: 0 auto;
  background: linear-gradient(90deg, rgba(125, 211, 252, 0.18), rgba(96, 165, 250, 0.22));
  border: 1px solid rgba(125, 211, 252, 0.4);
  color: var(--text);
}

.secondary-button {
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid var(--line);
  color: var(--text);
}

.danger-button {
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid rgba(255, 107, 107, 0.28);
  color: #ffd4d4;
}

.divider {
  margin-top: 24px;
  text-align: center;
  color: var(--muted);
}

.status-box {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.status-label {
  color: var(--muted);
  font-size: 0.9rem;
}

.status-text {
  font-size: 1rem;
  color: var(--text);
}

.pairing-card {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(5, 10, 16, 0.6);
  backdrop-filter: blur(5px);
}

.hidden {
  display: none !important;
}

.card-frame {
  width: min(92vw, 420px);
  background: rgba(10, 17, 25, 0.96);
  border: 1px solid rgba(125, 211, 252, 0.35);
  border-radius: 22px;
  padding: 24px 20px;
  box-shadow: 0 0 30px rgba(125, 211, 252, 0.12);
  text-align: center;
}

.card-header {
  font-size: 1.8rem;
  margin-bottom: 14px;
}

.card-title {
  font-size: 0.72rem;
  letter-spacing: 0.22rem;
  text-transform: uppercase;
  color: var(--muted);
}

.code-value {
  margin: 22px 0 18px;
  font-size: clamp(2rem, 7vw, 3rem);
  font-weight: 800;
  letter-spacing: 0.22rem;
}

.waiting-bar {
  margin-top: 16px;
  color: var(--muted);
}

.session-panel, .admin-panel {
  padding: 22px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(125, 211, 252, 0.06);
  font-weight: 700;
  letter-spacing: 0.14rem;
}

.session-grid {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(15, 23, 31, 0.6);
}

.detail-row span {
  color: var(--muted);
}

#disconnect-button {
  width: 100%;
  margin-top: 18px;
}

.menu-box {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(9, 15, 20, 0.88);
  overflow: hidden;
}

.menu-header {
  font-size: 1.1rem;
  padding: 18px 16px 12px;
  border-bottom: 1px solid var(--line);
  text-align: center;
}

.menu-body {
  padding: 16px 18px 22px;
  font-family: 'Consolas', monospace;
  color: var(--text);
  line-height: 1.7;
}

.admin-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.stat-card {
  border: 1px solid var(--line);
  background: rgba(15, 23, 31, 0.7);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card span {
  color: var(--muted);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.log-list {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.log-item {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  color: var(--muted);
}

.admin-login-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 640px) {
  body {
    padding: 16px;
  }

  .panel {
    padding: 20px 14px 18px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
