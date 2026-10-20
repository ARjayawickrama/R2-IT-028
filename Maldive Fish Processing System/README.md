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

## AquaSense Dry-Fish Monitoring

The `/environmental-monitoring` dashboard uses authenticated MongoDB-backed batches and the public HiveMQ secure WebSocket broker. The public broker is for development/testing only; do not use it for confidential or safety-critical telemetry without suitable authentication, authorization, and network controls.

### Local setup

1. In `backend`, copy `.env.example` to `.env` and set `JWT_SECRET` and `MONGODB_URI=mongodb://localhost:27017/fishgo`.
2. Install backend dependencies with `npm install`, then start it with `npm run dev`. The API listens on port `5001` by default and waits for MongoDB.
3. In a separate terminal, run `npm install` and `npm run dev` from `frontend`; sign in to the dashboard.
4. Demo mode is opt-in and is visibly labeled. It never sends email or hardware commands. Return to Live Mode to use MQTT telemetry. No valid sensor readings are fabricated in Live Mode.

### Email alerts

The `/environmental-monitoring` page uses EmailJS for safety emails to `wickramanju@gmail.com` at its configurable 50°C default. The separate `/environmental-monitoring/dry-fish` page defaults to a thermal-pixel threshold of 55°C and a thermal-difference threshold of 10°C; both limits and its repeat interval are configurable. Validate all example thresholds for the actual chamber. EmailJS settings belong in ignored `frontend/.env.local`; use `frontend/.env.example` as a placeholder on another machine. Vite variables and the EmailJS public key are visible in the frontend build, so configure provider-side template restrictions/rate limits and never put SMTP passwords or private API keys there.

For `/dry-fish`, set the EmailJS template recipient to `{{to_email}}`, subject to `{{subject}}`, and use the exact body variables `{{alert_type}}`, `{{message}}`, `{{max_temp}}`, `{{min_temp}}`, `{{avg_temp}}`, `{{temp_diff}}`, `{{threshold}}`, `{{chamber_temp}}`, `{{heater_status}}`, `{{fan_status}}`, and `{{timestamp}}`. Restart Vite after changing environment values. Use **Send Test Email** to test the service/template; the subject and alert type clearly label it as a test, not a sensor event. “Accepted” means EmailJS accepted the request, not that it reached the inbox. The authenticated page must remain open for live browser-side MQTT alerts. Repeat cooldowns suppress duplicate requests while a condition remains active and reset after a valid frame clears it.

### ESP32 telemetry and safety integration

Publish JSON to `aquasense/fish/telemetry` and subscribe for commands on `aquasense/fish/control`. Telemetry must include numeric `weight1`/`weight2` in grams, numeric `chamber_temp`, exactly 64 finite numeric values in `thermal_grid`, boolean `heater_ssr`, `fan_status`, `safety_interlock_ok`, `cell1_drying`, and `cell2_drying`. A command acknowledgement must be published in telemetry as `command_ack: { "command_id": "...", "accepted": true }`; include a `reason` string when rejected. The dashboard does not assume a command succeeded until hardware acknowledges it.

The repository does not provide a validated ESP32 production firmware implementation. Before connecting a heater, implement and test independent firmware protections: a validated maximum-temperature cutoff, sensor-failure shutdown, watchdog, safe heater-off default, hardware-state acknowledgements, and interlocks. Never rely on the browser, MQTT, or email for emergency protection, and do not switch the heater based only on the AMG8833 heatmap.

### Verification scenarios

- Run the focused helper tests: `node --test src/pages/EnvironmentalMonitoring/dryFishMonitoring.test.js` from `frontend`.
- Build the frontend: `npm run build` from `frontend`.
- Use a separate test MQTT device/client to publish a valid 64-pixel payload at 49.9°C and then at 50°C; verify only the threshold-crossing payload causes a high-temperature incident. Do not test by changing production hardware setpoints.
- Publish a valid grid with `max - min` above the configured difference threshold to test uneven-temperature alerts.
- Publish an abbreviated grid, invalid number, stop telemetry, and disconnect MQTT to verify invalid-data, stale-sensor, and broker alerts.
- Use the dashboard test-email control; confirm EmailJS accepted the request and separately check the recipient inbox/spam folder.

Batch persistence uses the local MongoDB `fishgo` database. On its first load, `/environmental-monitoring/dry-fish` inserts the six explicitly requested initial batch records if they are missing, then persists live measurements for batches assigned to an actively drying load cell. Seeded current weights and temperatures are placeholders, not sensor readings; the dashboard shows waiting/unavailable until valid live telemetry arrives.
