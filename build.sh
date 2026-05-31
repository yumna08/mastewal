#!/bin/bash
set -e

echo "� Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

echo ""
echo "🔨 Installing client dependencies..."
cd client
npm install

echo ""
echo "🛠️  Building client..."
npm run build

echo ""
echo "✅ Build complete! Checking dist folder..."
ls -la dist/

echo ""
echo "📦 Moving back to server and installing dependencies..."
cd ../server
npm install

echo ""
echo "✅ All done! Ready to start server."
