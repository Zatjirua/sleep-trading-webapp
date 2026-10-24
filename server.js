const express = require('express');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const state = {
  settings: {
    capital: 10000,
    maxDailyLoss: 300,
    maxPositions: 3,
    riskPerTrade: 0.02,
    autoTrade: true,
    strategy: 'trend-following',
    checkIntervalMinutes: 1,
    symbols: ['AAPL', 'MSFT', 'NVDA', 'BTCUSD', 'ETHUSD']
  },
  positions: [],
  trades: [],
  log: [
    { time: new Date().toISOString(), message: 'Bot initialized in paper-trading mode.' }
  ],
  metrics: {
    totalTrades: 0,
    dailyPnL: 0,
    winRate: 0,
    equity: 10000,
    lastSignal: 'WAITING'
  }
};

function roundTo(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function addLog(message) {
  state.log.unshift({
    time: new Date().toISOString(),
    message
  });

  if (state.log.length > 20) {
    state.log = state.log.slice(0, 20);
  }
}

function generatePrice(symbol) {
  const base = {
    AAPL: 215,
    MSFT: 440,
    NVDA: 118,
    BTCUSD: 62000,
    ETHUSD: 3400
  };

  const current = base[symbol] || 100;
  const drift = (Math.random() - 0.5) * (symbol.includes('USD') ? 260 : 16);
  return roundTo(current + drift, 2);
}

function getPositionSize(price) {
  const riskBudget = state.settings.capital * state.settings.riskPerTrade;
  return Math.max(1, Math.floor(riskBudget / price));
}

function createPosition(symbol, side, price, quantity) {
  const position = {
    id: `pos_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    symbol,
    side,
    price,
    quantity,
    openedAt: new Date().toISOString()
  };

  state.positions.push(position);
  state.metrics.totalTrades += 1;
  state.metrics.equity = roundTo(state.settings.capital - state.positions.reduce((sum, p) => sum + p.price * p.quantity, 0), 2);
  return position;
}

function closePosition(positionId, exitPrice) {
  const index = state.positions.findIndex((position) => position.id === positionId);
  if (index === -1) return null;

  const position = state.positions[index];
  const pnl = (position.side === 'BUY' ? (exitPrice - position.price) : (position.price - exitPrice)) * position.quantity;
  state.metrics.dailyPnL = roundTo(state.metrics.dailyPnL + pnl, 2);

  state.trades.push({
    symbol: position.symbol,
    side: position.side,
    openedAt: position.openedAt,
    closedAt: new Date().toISOString(),
    entryPrice: position.price,
    exitPrice,
    pnl: roundTo(pnl, 2)
  });

  state.positions.splice(index, 1);
  state.metrics.equity = roundTo(state.settings.capital + state.metrics.dailyPnL, 2);
  return pnl;
}

function shouldTrade() {
  return state.settings.autoTrade && state.positions.length < state.settings.maxPositions;
}

function evaluateSignal(symbol, currentPrice) {
  const momentum = Math.random();
  if (momentum > 0.7) return 'BUY';
  if (momentum < 0.3) return 'SELL';
  return 'HOLD';
}

function runBotTick() {
  if (!state.settings.autoTrade) {
    return;
  }

  if (state.metrics.dailyPnL <= -state.settings.maxDailyLoss) {
    state.settings.autoTrade = false;
    addLog(`Risk guard triggered. Auto-trading disabled after hitting max daily loss of $${state.settings.maxDailyLoss}.`);
    return;
  }

  const symbol = state.settings.symbols[Math.floor(Math.random() * state.settings.symbols.length)];
  const price = generatePrice(symbol);
  const signal = evaluateSignal(symbol, price);

  state.metrics.lastSignal = signal;

  if (signal === 'BUY' && shouldTrade()) {
    const quantity = getPositionSize(price);
    const position = createPosition(symbol, 'BUY', price, quantity);
    addLog(`BUY signal on ${symbol} at $${price}. Position size ${quantity}.`);
    state.trades.push({
      symbol,
      side: 'OPEN',
      price,
      quantity,
      openedAt: position.openedAt,
      type: 'signal'
    });
  } else if (signal === 'SELL' && state.positions.length > 0) {
    const position = state.positions[Math.floor(Math.random() * state.positions.length)];
    const pnl = closePosition(position.id, price);
    addLog(`SELL signal on ${symbol}. Closed ${position.symbol} at $${price}. PnL: $${pnl}.`);
  } else {
    addLog(`No trade triggered for ${symbol}. Signal: ${signal}.`);
  }

  const wins = state.trades.filter((trade) => trade.pnl > 0).length;
  const totalClosed = state.trades.filter((trade) => typeof trade.pnl === 'number').length;
  state.metrics.winRate = totalClosed ? roundTo((wins / totalClosed) * 100, 2) : 0;
}

cron.schedule(`*/${state.settings.checkIntervalMinutes} * * * *`, () => {
  if (state.settings.autoTrade) {
    runBotTick();
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'paper-trading bot active' });
});

app.get('/api/state', (req, res) => {
  res.json({
    settings: state.settings,
    positions: state.positions,
    trades: state.trades.slice(0, 20),
    log: state.log,
    metrics: state.metrics
  });
});

app.post('/api/settings', (req, res) => {
  const { capital, maxDailyLoss, maxPositions, riskPerTrade, autoTrade, strategy } = req.body || {};

  if (typeof capital === 'number') state.settings.capital = capital;
  if (typeof maxDailyLoss === 'number') state.settings.maxDailyLoss = maxDailyLoss;
  if (typeof maxPositions === 'number') state.settings.maxPositions = maxPositions;
  if (typeof riskPerTrade === 'number') state.settings.riskPerTrade = riskPerTrade;
  if (typeof autoTrade === 'boolean') state.settings.autoTrade = autoTrade;
  if (strategy) state.settings.strategy = strategy;

  state.metrics.equity = roundTo(state.settings.capital + state.metrics.dailyPnL, 2);
  addLog('Trading settings updated.');
  res.json({ ok: true, settings: state.settings });
});

app.post('/api/bot/toggle', (req, res) => {
  const { enabled } = req.body || {};
  state.settings.autoTrade = Boolean(enabled);
  addLog(`Bot auto-trading ${state.settings.autoTrade ? 'enabled' : 'disabled'}.`);
  res.json({ ok: true, autoTrade: state.settings.autoTrade });
});

app.post('/api/reset', (req, res) => {
  state.positions = [];
  state.trades = [];
  state.log = [{ time: new Date().toISOString(), message: 'Trading session reset.' }];
  state.metrics = {
    totalTrades: 0,
    dailyPnL: 0,
    winRate: 0,
    equity: state.settings.capital,
    lastSignal: 'RESET'
  };
  res.json({ ok: true, message: 'Session reset.' });
});

app.post('/api/signal', (req, res) => {
  const { symbol, price, action } = req.body || {};
  if (!symbol || !price || !action) {
    return res.status(400).json({ ok: false, error: 'symbol, price, and action are required.' });
  }

  state.metrics.lastSignal = action;
  addLog(`${action} signal received for ${symbol} at $${price}.`);

  if (action === 'BUY' && state.positions.length < state.settings.maxPositions) {
    const qty = getPositionSize(Number(price));
    state.positions.push({
      id: `manual_${Date.now()}`,
      symbol,
      side: 'BUY',
      price: Number(price),
      quantity: qty,
      openedAt: new Date().toISOString()
    });
  }

  if (action === 'SELL' && state.positions.length > 0) {
    const position = state.positions[0];
    closePosition(position.id, Number(price));
  }

  res.json({ ok: true, message: 'Signal accepted.' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sleep Trading WebApp is running on http://localhost:${PORT}`);
});
