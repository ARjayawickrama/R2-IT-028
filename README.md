# Smart Maldive Fish Processing System

An IoT-based system to improve Maldive fish processing using smart monitoring, AI-powered quality assessment, and automation. This project integrates computer vision, machine learning, and web technologies to enhance the traditional fish processing workflow.

## 🎯 Project Overview

The Smart Maldive Fish Processing System consists of three main components:

1. **AI Backend** - Deep learning model for fish quality classification
2. **Web Application** - Full-stack system for user management and monitoring
3. **ML Models** - Trained models for fish quality assessment

## 🏗️ System Architecture

```
smart-maldive-fish/
├── Ai_backend/                          # FastAPI ML Service
│   ├── main.py                         # FastAPI application with ML model
│   ├── models/                         # Trained ML models
│   ├── notebooks/                      # Jupyter notebooks for development
│   ├── requirements.txt                # Python dependencies
│   └── README.md                       # AI backend documentation
│
├── Maldive Fish Processing System/     # Full-stack Web Application
│   ├── backend/                        # Express.js backend
│   │   ├── config/database.js          # MongoDB connection
│   │   ├── middleware/auth.js           # JWT authentication
│   │   ├── models/User.js              # User schema
│   │   ├── routes/auth.js              # Authentication endpoints
│   │   ├── routes/user.js              # User management
│   │   └── server.js                   # Express server
│   │
│   ├── frontend/                       # React frontend
│   │   ├── src/
│   │   │   ├── components/             # React components
│   │   │   ├── context/                # Context providers
│   │   │   ├── pages/                  # Page components
│   │   │   └── services/               # API services
│   │   └── public/                     # Static assets
│   │
│   ├── QUICKSTART.md                   # Quick start guide
│   ├── SETUP_GUIDE.md                  # Detailed setup instructions
│   └── FORGOT_PASSWORD.md              # Password recovery guide
│
├── slate_contro_ML/                    # Additional ML components
└── README.md                           # This file
```

## 🚀 Features

### AI/ML Features
- **Fish Quality Classification**: Automated classification of dried fish into High, Medium, and Low quality categories
- **Computer Vision**: Uses EfficientNet-B0 architecture for image analysis
- **Real-time Processing**: FastAPI backend for quick inference
- **Model Management**: Pre-trained models with version control

### Web Application Features
- **User Authentication**: Secure JWT-based authentication system
- **Dashboard**: Real-time monitoring and analytics
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Protected Routes**: Role-based access control
- **Data Management**: MongoDB integration for user data

## 🛠️ Tech Stack

### AI Backend
- **FastAPI**: Modern Python web framework for ML APIs
- **PyTorch**: Deep learning framework
- **EfficientNet**: State-of-the-art image classification architecture
- **Pillow**: Image processing library
- **Uvicorn**: ASGI server for FastAPI

### Web Application Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing

### Web Application Frontend
- **React 18**: Modern JavaScript library for UI
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Context API**: State management

## 📋 Prerequisites

- **Python 3.9+** for AI backend
- **Node.js 14+** for web application
- **MongoDB Atlas** account (free tier available)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-maldive-fish
```

### 2. Set Up AI Backend
```bash
cd Ai_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the AI service
uvicorn main:app --reload
```
AI Backend will be available at `http://127.0.0.1:8000`
API Documentation: `http://127.0.0.1:8000/docs`

### 3. Set Up Web Application
```bash
cd "Maldive Fish Processing System"

# Backend Setup
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB URI and JWT secret
npm run dev

# Frontend Setup (in new terminal)
cd ../frontend
npm install
npm run dev
```

Web Application will be available at `http://localhost:5173`
Backend API will be available at `http://localhost:5000`

## 🔧 Configuration

### AI Backend Configuration
The AI backend uses the following configuration:
- **Model**: EfficientNet-B0 for fish quality classification
- **Classes**: High_Quality, Medium_Quality, Low_Quality
- **Input Size**: 224x224 pixels
- **Uncertainty Threshold**: 60%
- **Device**: Automatically detects GPU/CPU

### Web Application Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fishgo?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_12345
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 📊 API Endpoints

### AI Backend Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Upload fish image for quality classification |
| GET | `/health` | Check if the AI service is running |
| GET | `/docs` | Swagger API documentation |

### Web Application Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/user/profile` | Get user profile (protected) |

## 🧪 Model Details

### Fish Quality Classification Model
- **Architecture**: EfficientNet-B0
- **Input**: RGB images (224x224 pixels)
- **Output**: 3-class classification (High, Medium, Low quality)
- **Training Data**: Dried fish images with quality labels
- **Performance**: Optimized for real-time inference

### Model Usage
```python
# Example prediction request
import requests

with open('fish_image.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://127.0.0.1:8000/predict', files=files)
    result = response.json()
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error management

## 📱 User Interface

The web application provides:
- **Login/Registration**: User authentication interface
- **Dashboard**: Main monitoring and control panel
- **Quality Assessment**: Interface for AI-powered fish quality analysis
- **User Profile**: Account management
- **Responsive Design**: Works on desktop and mobile devices

## 🐛 Troubleshooting

### Common Issues

1. **Model Loading Errors**
   - Ensure the model file exists in `Ai_backend/models/`
   - Check PyTorch and CUDA compatibility

2. **MongoDB Connection Issues**
   - Verify MongoDB URI in `.env` file
   - Check IP whitelist in MongoDB Atlas

3. **CORS Errors**
   - Ensure frontend URL matches `CORS_ORIGIN` in backend
   - Check that both services are running

4. **Port Conflicts**
   - Change ports in respective configuration files
   - Ensure no other services are using the same ports

## 📈 Performance Metrics

- **AI Inference Time**: < 1 second per image
- **Model Accuracy**: Optimized for dried fish classification
- **Web Response Time**: < 200ms for API calls
- **Concurrent Users**: Supports multiple simultaneous users

## 🔄 Development Workflow

1. **AI Model Development**: Use Jupyter notebooks in `Ai_backend/notebooks/`
2. **API Development**: FastAPI backend in `Ai_backend/main.py`
3. **Frontend Development**: React components in `frontend/src/`
4. **Backend Development**: Express.js routes in `backend/routes/`

## 📚 Documentation

- **AI Backend**: `Ai_backend/README.md`
- **Quick Start**: `Maldive Fish Processing System/QUICKSTART.md`
- **Setup Guide**: `Maldive Fish Processing System/SETUP_GUIDE.md`
- **Password Recovery**: `Maldive Fish Processing System/FORGOT_PASSWORD.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - feel free to use and modify for your purposes.

## 📞 Support

For issues, questions, or contributions:
- Check the existing documentation
- Review the code comments
- Create an issue in the repository

---

**🐟 Smart Maldive Fish Processing - Revolutionizing Traditional Fish Processing with AI! 🚀**
