# Forgot Password Feature

## Overview

A complete password reset system with token-based authentication. Users can request a password reset via email and create a new password.

## Features

✅ Forgot password request with email validation  
✅ Secure reset tokens (SHA-256 hashed, 1-hour expiry)  
✅ Password validation and confirmation  
✅ Token-based reset link  
✅ Auto-login after password reset  
✅ Error handling and user feedback  

## How It Works

### 1. **Forgot Password Flow**

User clicks "Forgot password?" → Enters email → Receives reset token

**Frontend**: `src/pages/ForgotPassword.jsx`
- User enters their email
- Submit sends POST to `/api/auth/forgot-password`
- Backend generates reset token and returns it
- Token displayed on screen (for development)

**Backend**: `routes/auth.js` - POST `/api/auth/forgot-password`
```javascript
{
  "email": "user@example.com"
}
```

Response:
```javascript
{
  "success": true,
  "message": "Password reset link sent to email",
  "resetToken": "abc123...",
  "resetUrl": "http://localhost:5173/reset-password/abc123..."
}
```

### 2. **Reset Password Flow**

User enters reset token + new password → Password updated → Auto-login

**Frontend**: `src/pages/ResetPassword.jsx`
- User pastes reset token (or URL contains token)
- Enters new password + confirmation
- Submit sends POST to `/api/auth/reset-password/:token`
- Auto-login with new JWT token
- Redirect to dashboard

**Backend**: `routes/auth.js` - POST `/api/auth/reset-password/:token`
```javascript
{
  "password": "newpassword123"
}
```

Response:
```javascript
{
  "success": true,
  "message": "Password reset successful",
  "token": "eyJhbGc...",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

## Database Schema

Added to User model:

```javascript
resetPasswordToken: String,      // Hashed reset token
resetPasswordExpire: Date,       // Expires in 1 hour
```

## User Model Methods

```javascript
// Generate reset token (1 hour expiry)
userSchema.methods.getResetPasswordToken = function() { ... }
```

## Routes

### Frontend Routes
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password form
- `/reset-password/:token` - Pre-filled token from URL

### Backend Routes

**POST `/api/auth/forgot-password`**
- Request password reset
- Body: `{ email }`
- Returns: reset token (for development only)
- Public route

**POST `/api/auth/reset-password/:token`**
- Reset password with token
- Body: `{ password }`
- Returns: JWT token + user info
- Public route
- Token expires in 1 hour

## Security Features

1. **Token Hashing**: Reset tokens are hashed with SHA-256
2. **Token Expiry**: Tokens expire after 1 hour
3. **Token Validation**: Backend verifies token exists and isn't expired
4. **Password Requirements**: Minimum 6 characters
5. **Secure Comparison**: Token comparison is constant-time

## Development vs Production

### Development (Current Implementation)

```javascript
// Token returned in response
res.json({
  resetToken: "abc123...",
  resetUrl: "http://localhost:5173/reset-password/abc123..."
})
```

**For testing**: Copy token and paste in reset password page

### Production Implementation

```javascript
// Send email with reset link
const resetUrl = `https://yourapp.com/reset-password/${resetToken}`;
sendResetEmail(user.email, resetUrl);

// Don't return token in response!
res.json({
  message: "Reset link sent to email"
})
```

## Testing

### Test Forgot Password

1. Go to http://localhost:5173/login
2. Click "Forgot password?"
3. Enter email: `test@example.com`
4. See reset token displayed
5. Copy the token

### Test Reset Password

1. Go to http://localhost:5173/reset-password
2. Paste reset token
3. Enter new password: `newpass123`
4. Confirm password
5. Click "Reset Password"
6. Auto-redirect to dashboard (logged in)

### Test with URL Token

1. Copy reset token from forgot password page
2. Go to: `http://localhost:5173/reset-password/TOKEN_HERE`
3. Token field pre-filled automatically
4. Enter new password and reset

## Error Handling

### Common Errors

**"User not found with this email"**
- Email doesn't exist in database
- Check email spelling

**"Invalid or expired reset token"**
- Token has expired (1 hour limit)
- Token was altered
- Request new reset token

**"Password must be at least 6 characters"**
- Password too short
- Minimum length is 6

**"Passwords do not match"**
- Confirmation password doesn't match
- Re-enter both passwords

## API Examples

### Request Reset Token

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/abc123token \
  -H "Content-Type: application/json" \
  -d '{"password":"newpassword123"}'
```

## Files Modified/Created

- **Backend**:
  - `models/User.js` - Added reset token fields & method
  - `routes/auth.js` - Added forgot & reset routes

- **Frontend**:
  - `pages/ForgotPassword.jsx` - New
  - `pages/ResetPassword.jsx` - New
  - `pages/Login.jsx` - Added forgot password link
  - `App.jsx` - Added new routes

## Next Steps (Production)

1. **Email Service**: Integrate Nodemailer or SendGrid
2. **Email Template**: Create HTML email with reset link
3. **Remove Development Token**: Don't return token in response
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **HTTPS Only**: Ensure all connections use HTTPS
6. **Token Rotation**: Consider implementing token refresh mechanism

## Troubleshooting

**Tokens not working?**
- Check token expiry (1 hour limit)
- Ensure MongoDB is storing token correctly
- Verify token matches the hashed version

**Reset link not working?**
- Check URL format
- Verify token is complete (no truncation)
- Ensure backend is running

**Can't find email in forgot password?**
- Verify email exists in MongoDB
- Check email spelling
- Ensure email is lowercase in database

---

For more info, see README.md and SETUP_GUIDE.md
