#!/bin/bash

echo "🚀 Setting up MediExpress Project..."
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup Backend
echo ""
echo "🔧 Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created backend/.env from .env.example"
    echo "⚠️  Please update backend/.env with your Supabase credentials!"
fi

npm install
cd ..

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd frontend

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created frontend/.env from .env.example"
    echo "⚠️  Please update frontend/.env with your Supabase credentials!"
fi

npm install
cd ..

echo ""
echo "✨ Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Update backend/.env with your Supabase credentials"
echo "2. Update frontend/.env with your Supabase credentials"
echo "3. Run 'npm run dev' to start both servers"
echo ""
