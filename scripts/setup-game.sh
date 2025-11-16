#!/bin/bash

# Political Sphere - Complete Game Setup Script
# This script sets up the entire game infrastructure

set -e

echo "🎮 Political Sphere - Complete Game Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🗄️  Step 2: Setting up database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL not set${NC}"
    echo "Creating local SQLite database for development..."
    
    # Create .env file for API if it doesn't exist
    if [ ! -f "apps/api/.env" ]; then
        cat > apps/api/.env << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="development-secret-change-in-production"
JWT_REFRESH_SECRET="development-refresh-secret-change-in-production"
NODE_ENV="development"
PORT=4000
EOF
        echo -e "${GREEN}Created apps/api/.env with SQLite configuration${NC}"
    fi
fi

echo ""
echo "🔧 Step 3: Generating Prisma client..."
cd apps/api
npx prisma generate
cd ../..

echo ""
echo "📊 Step 4: Running database migrations..."
cd apps/api
npx prisma migrate deploy || npx prisma db push
cd ../..

echo ""
echo "🏗️  Step 5: Building all applications..."
npm run build

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start the API server:"
echo "     cd apps/api && npm start"
echo ""
echo "  2. Start the web application:"
echo "     cd apps/web && npm run dev"
echo ""
echo "  3. Access the game at:"
echo "     http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "  - API docs: http://localhost:4000/api"
echo "  - Project docs: ./docs/"
echo ""
echo -e "${GREEN}Political Sphere is ready to play!${NC}"
