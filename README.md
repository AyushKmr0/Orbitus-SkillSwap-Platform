# Orbitus - SkillSwap Platform 🚀

Orbitus is a professional networking and skill-sharing platform designed to facilitate "Learning by Teaching." It connects mentors and learners globally, allowing users to exchange expertise, build portfolios, and engage in real-time collaboration.

## ✨ Key Features

### 🔐 Advanced Authentication
- **Dual Auth System:** Secure Email/Password registration reinforced with 6-digit OTP verification via NodeMailer.
- **OAuth 2.0 Integration:** Seamless social login capabilities using Google and GitHub.
- **Robust JWT Security:** Implementation of Access and Refresh token rotation for secure, long-lived sessions.
- **Profile Gate:** A mandatory onboarding flow ensuring users set up their username, bio, and interests before accessing the platform.

### 👤 Professional Identity
- **Dynamic Profiles:** Users define their expertise ("Skills to Teach") and goals ("Skills to Learn").
- **Portfolio Showcase:** Integration for featured projects with live links and GitHub repository connections.
- **Resume Management:** Dedicated support for uploading and hosting professional resumes.
- **Experience Tracking:** Categorization by experience levels (Fresher to Lead) and educational background.

### 🤝 Social Networking & Feed
- **Intelligent Feed:** A hybrid feed system supporting "Global" and "Following" scopes with infinite scroll capabilities.
- **Engagement Tools:** Like, comment, and share functionality with real-time interaction counts.
- **Follow System:** Robust user-to-user following mechanics to build a personalized network.
- **Global Search:** High-performance search for discovering peers by name or unique handles.

### 💬 Real-time Communication
- **Direct Messaging:** Private 1-to-1 chat system powered by Socket.io.
- **Interactive Chat Features:** Support for file sharing, message replies, editing, and "delete for everyone" functionality.
- **Status Indicators:** Real-time online/offline status tracking and typing indicators.
- **Instant Notifications:** Immediate alerts for new followers, likes, comments, and messages.

### 🏆 Gamification & Rewards
- **Engagement Points:** Users earn points through daily logins (+10) and sharing resources (+20).
- **Global Leaderboard:** A competitive ranking system based on community contribution and activity.

## 🛠️ Technology Stack

**Frontend:**
- **Framework:** React.js (Vite)
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Real-time:** Socket.io Client

**Backend:**
- **Runtime:** Node.js & Express.js
- **Database:** MongoDB with Mongoose ODM
- **Real-time Engine:** Socket.io
- **Authentication:** Passport.js & JWT
- **File Handling:** Multer

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or Atlas Cluster)
- NPM or Yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AyushKmr0/Orbitus-SkillSwap-Platform.git
   cd Orbitus-SkillSwap-Platform
   ```

2. **Configure Backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Setup

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=2h

# Email Service (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret

FRONTEND_URL=https://orbitus-skill-swap-platform.vercel.app
BACKEND_URL=https://orbitus-skillswap-platform.onrender.com
```

### Running the App

**Backend Chalaein:**
```bash
cd backend
npm start (ya npm run dev)
```

**Frontend Chalaein:**
```bash
cd frontend
npm run dev
```
