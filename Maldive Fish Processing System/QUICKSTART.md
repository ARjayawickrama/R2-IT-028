# Quick Start - 5 Minutes to Running

## Terminal 1: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

## Terminal 2: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## That's it! 🎉

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Docs available in README.md

## First Test
1. Go to http://localhost:5173/signup
2. Create an account with:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123

3. You'll be redirected to dashboard
4. Click Logout to test login page
5. Login with your credentials

## What's Included

✅ User Registration with validation  
✅ User Login with JWT  
✅ Password hashing with bcrypt  
✅ Protected dashboard route  
✅ Error/Success messages  
✅ Responsive Tailwind CSS design  
✅ MongoDB integration  
✅ CORS enabled  
✅ Environment variables  

## Need MongoDB?

Sign up for free at https://www.mongodb.com/cloud/atlas

## Need Help?

Check SETUP_GUIDE.md for detailed instructions
Check README.md for API documentation

---
Happy coding! 🚀
