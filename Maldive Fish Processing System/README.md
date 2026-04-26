# FishGo - Full Stack Authentication System

A complete full-stack authentication system with JWT, bcrypt, and modern UI built with React, Express, and MongoDB.

## 🎯 Features

- ✅ User Registration & Login
- ✅ Password Hashing with bcrypt
- ✅ JWT Authentication
- ✅ Protected Routes
- ✅ Form Validation
- ✅ Error & Success Messages
- ✅ Responsive Design
- ✅ Clean Modern UI with Tailwind CSS
- ✅ CORS Enabled
- ✅ Environment Variables

## 📁 Project Structure

```
Maldive Fish Processing System/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   └── User.js              # User schema
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints (register, login)
│   │   └── user.js              # User endpoints (profile)
│   ├── .env.example             # Environment variables template
│   ├── .gitignore               # Git ignore file
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express server entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.jsx    # Route protection component
    │   ├── context/
    │   │   └── AuthContext.jsx       # Auth state management
    │   ├── pages/
    │   │   ├── Login.jsx             # Login page
    │   │   ├── Signup.jsx            # Signup page
    │   │   └── Dashboard.jsx         # Protected dashboard
    │   ├── services/
    │   │   └── api.js                # Axios API service
    │   ├── App.jsx                   # Main app component
    │   ├── index.css                 # Tailwind CSS
    │   └── main.jsx                  # React entry point
    ├── index.html
    ├── .gitignore
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (free at https://www.mongodb.com/cloud/atlas)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

4. **Update .env with your MongoDB URI and JWT secret:**
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fishgo?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_12345
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

   > To get MongoDB URI:
   > 1. Go to https://www.mongodb.com/cloud/atlas
   > 2. Create a free account
   > 3. Create a cluster
   > 4. Click "Connect" → "Connect your application"
   > 5. Copy the connection string and replace username/password

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. **In a new terminal, navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   App will be available at http://localhost:5173

## 🔑 API Endpoints

### Authentication Routes
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{name, email, password}` | Register new user |
| POST | `/api/auth/login` | `{email, password}` | Login user |

### Protected Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user/profile` | JWT Token | Get user profile |

## 📝 Example Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Profile (Protected)
```bash
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛡️ Security Features

- **Password Hashing**: Bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Protected Routes**: Middleware-based route protection
- **CORS**: Configured for specific origin
- **Form Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error messages

## 🎨 UI Features

- **Responsive Design**: Mobile-friendly layout
- **Form Validation**: Real-time validation feedback
- **Error Messages**: User-friendly error notifications
- **Success Messages**: Confirmation of actions
- **Loading States**: Visual feedback during API calls
- **Protected Dashboard**: Only accessible to authenticated users

## 📚 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- JWT (jsonwebtoken)
- Bcryptjs
- CORS
- dotenv

### Frontend
- React 18
- Vite
- React Router v6
- Axios
- Tailwind CSS
- Context API (State Management)

## 🔄 Authentication Flow

1. **Registration**:
   - User fills signup form
   - Password is hashed with bcrypt
   - User is saved to MongoDB
   - JWT token is generated and returned
   - Token is stored in localStorage
   - User is redirected to dashboard

2. **Login**:
   - User enters email and password
   - Backend verifies credentials
   - Password is compared with hash
   - JWT token is generated
   - Token is stored in localStorage
   - User is redirected to dashboard

3. **Protected Routes**:
   - Frontend checks if token exists
   - Token is sent in Authorization header
   - Backend middleware verifies token
   - User profile is retrieved from MongoDB
   - Dashboard is displayed

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Verify network connectivity

### CORS Errors
- Ensure frontend URL matches CORS_ORIGIN in backend
- Check that backend is running

### Token Issues
- Clear localStorage and login again
- Ensure JWT_SECRET is consistent
- Check token expiration (set to 7 days)

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Vite will use next available port

## 📧 Email Format Validation

Accepted email patterns:
- user@example.com
- user.name@example.co.uk
- user+tag@example.com

## 🔐 Password Requirements

- Minimum 6 characters
- Stored as bcrypt hash in database
- Never transmitted in plain text

## 📄 License

MIT License - Feel free to use this project

## 🤝 Support

For issues or questions, please refer to the code comments or create an issue in the repository.

---

**Happy Coding! 🚀**
