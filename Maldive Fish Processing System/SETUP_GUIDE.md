# Setup Guide - FishGo Authentication System

## Step-by-Step Installation Guide

### Part 1: MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Visit https://www.mongodb.com/cloud/atlas
   - Sign up for a free account
   - Verify your email

2. **Create a Cluster**
   - Click "Build a Database"
   - Select "Shared" (Free tier)
   - Choose your preferred region
   - Wait for cluster creation (takes a few minutes)

3. **Create Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Create username: `fishgo_user`
   - Create password: `StrongPassword123!`
   - Select "Read and write to any database"
   - Add user

4. **Allow Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (for development)
   - Confirm

5. **Get Connection String**
   - Go back to "Clusters"
   - Click "Connect" button
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user password

### Part 2: Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env file with your values
# Example:
# PORT=5000
# MONGODB_URI=mongodb+srv://fishgo_user:StrongPassword123!@cluster0.xyz.mongodb.net/fishgo?retryWrites=true&w=majority
# JWT_SECRET=your_jwt_secret_12345
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:5173

# 5. Test backend
npm run dev
```

**Expected Output:**
```
Server running on port 5000
MongoDB connected: cluster0-abc.mongodb.net
```

### Part 3: Frontend Setup

```bash
# 1. Open new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Part 4: Test the Application

1. **Open Browser**
   - Go to http://localhost:5173

2. **Test Signup**
   - Click "Create a new account"
   - Fill in name, email, password
   - Click "Sign Up"
   - Should see success message and redirect to dashboard

3. **Test Login**
   - Fill in email and password
   - Click "Login"
   - Should see dashboard with profile info

4. **Test Logout**
   - Click "Logout" button
   - Should redirect to login page

### Troubleshooting

#### Backend not starting
```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# If in use, kill the process or change PORT in .env
```

#### MongoDB connection error
```
Error connecting to MongoDB: MongoServerSelectionError
```
**Solution:**
- Check MongoDB URI in .env
- Verify credentials are correct
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

#### Frontend can't reach backend
```
CORS error or 404 on API calls
```
**Solution:**
- Ensure backend is running on port 5000
- Check CORS_ORIGIN in backend .env matches frontend URL
- Clear browser cache and localStorage

#### Clear localStorage (if needed)
```javascript
// Run in browser console
localStorage.clear()
```

## Development Tips

### Running Both Servers
- Use two terminal windows
- One for backend (`npm run dev` in backend folder)
- One for frontend (`npm run dev` in frontend folder)

### Code Changes
- Backend changes auto-reload with nodemon
- Frontend changes auto-refresh with Vite HMR

### Debugging
- Backend: Add `console.log()` statements
- Frontend: Use browser DevTools (F12)
- Network tab to see API requests

### Environment Variables
- Backend: Add to `backend/.env`
- Frontend: Add to `frontend/.env` (Vite specific)
- Restart dev server after changing .env

## Production Deployment

### Backend Deployment (Heroku Example)
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel Example)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables for API
vercel env add VITE_API_URL https://your-backend.com
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use environment variables for all sensitive data
- [ ] Enable HTTPS in production
- [ ] Restrict IP access in MongoDB Atlas
- [ ] Use strong database passwords
- [ ] Never commit .env files
- [ ] Keep dependencies updated
- [ ] Add rate limiting for auth endpoints
- [ ] Enable email verification
- [ ] Implement password reset flow

---

For more help, check the main README.md file.
