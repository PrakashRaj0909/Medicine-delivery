# MediExpress 🏥💊

A modern medicine delivery platform connecting customers with pharmacies and delivery partners for fast, reliable prescription and OTC medicine delivery.

## 🚀 Project Structure

This is a monorepo containing both frontend and backend applications:

```
swift-rx-pulse/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express.js + TypeScript
│   ├── src/
│   ├── supabase/
│   └── package.json
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for blazing fast builds
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- TanStack Query for data fetching
- Supabase for authentication & database

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB (Mongoose ODM)
- RESTful API architecture

## 📦 Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd swift-rx-pulse
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB/JWT credentials
npm run dev
```

Backend will run on http://localhost:3000

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase and API settings
npm run dev
```

Frontend will run on http://localhost:8080

## 🔑 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mediexpress?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_API_URL=
```

## 📱 Features

- ✅ User Authentication (Customer & Delivery Partner)
- ✅ Medicine Catalog with Search & Filters
- ✅ Shopping Cart Management
- ✅ Prescription Upload & Validation
- ✅ Order Placement & Tracking
- ✅ Payment Integration (COD & Online)
- ✅ Delivery Partner Dashboard
- ✅ Real-time Order Updates
- ✅ Responsive Design

## 🗃️ Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles
- `user_roles` - User role management
- `medicines` - Medicine catalog
- `orders` - Order information
- `order_items` - Order line items
- `addresses` - Delivery addresses
- `prescriptions` - Uploaded prescriptions
- `cart_items` - Shopping cart

## 🚀 Deployment

### Frontend (Vercel)
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_PUBLISHABLE_KEY`
	- `VITE_API_URL=https://your-backend.onrender.com`

### Backend (Render)
- Root directory: `backend`
- Build command: `npm install ; npm run build`
- Start command: `npm start`
- Environment variables:
	- `MONGODB_URI`
	- `JWT_SECRET`
	- `JWT_EXPIRES_IN`
	- `NODE_ENV=production`
	- `PORT=10000` (Render overrides automatically)
	- `FRONTEND_URL=https://your-vercel-app.vercel.app`

## 📖 Documentation

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Built with ❤️ by the MediExpress team

---

For detailed setup instructions, see the README files in the frontend and backend directories.
