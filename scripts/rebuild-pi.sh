#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Pi Clean Rebuild & Deploy Script
# ═══════════════════════════════════════════════════════════════
# Ensures a fresh node_modules, generated prisma client,
# pushed database schema, and a clean Next.js build.
# ═══════════════════════════════════════════════════════════════

set -e # Exit on error

echo "🚀 Starting Clean Rebuild..."

# 1. Clean old artifacts
echo "🧹 Cleaning old build artifacts..."
rm -rf .next
# rm -rf node_modules # Optional: only if dependencies changed significantly

# 2. Install dependencies (Clean Install)
echo "📦 Installing dependencies..."
npm install --production=false

# 3. Prisma Setup
echo "💎 Generating Prisma Client..."
npx prisma generate

echo "🗄️ Pushing Database Schema..."
npx prisma db push --accept-data-loss # Safe for SQLite prototyping

# 4. Fresh Build
echo "🏗️ Building Application (this takes a few minutes)..."
npm run build

# 5. Restart Services
echo "🔄 Restarting PM2 process..."
pm2 restart ecosystem.config.js || pm2 restart endoscopy-suite
pm2 save

echo "✅ Deployment Complete!"
pm2 status
