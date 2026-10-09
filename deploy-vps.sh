#!/usr/bin/env bash
# ==============================================================================
# ALL-IN-ONE AUTOMATED VPS DEPLOYMENT & DAEMON LAUNCH SCRIPT
# Run this on your Ubuntu VPS: bash deploy-vps.sh
# ==============================================================================

set -e

echo "🚀 [Step 1/5] Updating system packages & installing prerequisites..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw fail2ban jq tmux htop

echo "📦 [Step 2/5] Setting up Node.js v20 LTS & PM2..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo npm install -g pm2 pnpm tsx

echo "🛡️ [Step 3/5] Configuring UFW Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 7777/tcp
sudo ufw allow 8545/tcp
sudo ufw allow 8546/tcp
sudo ufw --force enable

echo "🔑 [Step 4/5] Securing .env file permissions..."
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
  cp .env.production .env
fi

if [ -f ".env" ]; then
  chmod 600 .env
  echo "🔒 .env file secured with chmod 600"
fi

echo "⚡ [Step 5/5] Installing project dependencies & launching with PM2..."
npm ci --omit=dev || npm install --omit=dev

mkdir -p logs

pm2 delete dex-trading-engine 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true

echo "========================================================================"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "• Dashboard Port: http://127.0.0.1:3000"
echo "• EVM RPC Port:   http://127.0.0.1:8545"
echo "• Reality Bridge: http://127.0.0.1:7777"
echo "• Run 'pm2 logs' to view live trades, arbitrage, and cold wallet sweeps."
echo "========================================================================"
