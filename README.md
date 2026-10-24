const state = {
  botEnabled: true,
};

const elements = {
  botStatus: document.getElementById('bot-status'),
  lastSignal: document.getElementById('last-signal'),
  equity: document.getElementById('equity'),
  dailyPnl: document.getElementById('daily-pnl'),
  openPositions: document.getElementById('open-positions'),
  winRate: document.getElementById('win-rate'),
  positionsBody: document.getElementById('positions-body'),
  activityLog: document.getElementById('activity-log'),
  capital: document.getElementById('capital'),
  maxLoss: document.getElementById('maxLoss'),
  maxPositions: document.getElementById('maxPositions'),
  riskPerTrade: document.getElementById('riskPerTrade'),
  strategy: document.getElementById('strategy'),
  toggleBot: document.getElementById('toggle-bot'),
  saveSettings: document.getElementById('save-settings'),
  resetSession: document.getElementById('reset-session')
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
}

function renderPositions(positions) {
  if (!positions.length) {
    elements.positionsBody.innerHTML = `
      <tr>
        <td colspan="4">No open positions</td>
      </tr>
    `;
    return;
  }

  elements.positionsBody.innerHTML = positions
    .map(
      (position) => `
        <tr>
          <td>${position.symbol}</td>
          <td>${position.side}</td>
          <td>${formatCurrency(position.price)}</td>
          <td>${position.quantity}</td>
        </tr>
      `
    )
    .join('');
}

function renderLog(log) {
  elements.activityLog.innerHTML = log
    .slice(0, 6)
    .map((entry) => `<li>${new Date(entry.time).toLocaleTimeString()} — ${entry.message}</li>`)
    .join('');
}

async function refreshState() {
  const response = await fetch('/api/state');
  const data = await response.json();

  const { settings, positions, log, metrics } = data;
  state.botEnabled = settings.autoTrade;

  elements.botStatus.textContent = settings.autoTrade ? 'LIVE' : 'PAUSED';
  elements.botStatus.style.color = settings.autoTrade ? '#34d399' : '#fbbf24';
  elements.lastSignal.textContent = metrics.lastSignal || 'WAITING';
  elements.equity.textContent = formatCurrency(metrics.equity);
  elements.dailyPnl.textContent = formatCurrency(metrics.dailyPnL);
  elements.openPositions.textContent = positions.length;
  elements.winRate.textContent = `${metrics.winRate || 0}%`;

  elements.capital.value = settings.capital;
  elements.maxLoss.value = settings.maxDailyLoss;
  elements.maxPositions.value = settings.maxPositions;
  elements.riskPerTrade.value = settings.riskPerTrade * 100;
  elements.strategy.value = settings.strategy;

  renderPositions(positions);
  renderLog(log);

  elements.toggleBot.textContent = settings.autoTrade ? 'Pause bot' : 'Resume bot';
}

async function saveSettings() {
  const payload = {
    capital: Number(elements.capital.value),
    maxDailyLoss: Number(elements.maxLoss.value),
    maxPositions: Number(elements.maxPositions.value),
    riskPerTrade: Number(elements.riskPerTrade.value) / 100,
    strategy: elements.strategy.value,
    autoTrade: state.botEnabled
  };

  await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  refreshState();
}

async function toggleBot() {
  const enabled = !state.botEnabled;
  await fetch('/api/bot/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });

  refreshState();
}

async function resetSession() {
  await fetch('/api/reset', { method: 'POST' });
  refreshState();
}

document.getElementById('save-settings').addEventListener('click', saveSettings);
document.getElementById('toggle-bot').addEventListener('click', toggleBot);
document.getElementById('reset-session').addEventListener('click', resetSession);

refreshState();
setInterval(refreshState, 5000);
