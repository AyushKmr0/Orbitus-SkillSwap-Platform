# Orbitus Skill Swap Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://orbitus-skill-swap-platform.vercel.app)

Orbitus is a full-stack skill-sharing platform that brings learners and mentors together for collaborative learning, knowledge exchange, and professional growth. Users can build professional profiles, discover people with matching skills, book learning sessions, chat in real time, publish posts, earn points, and verify certificates for completed learning work.

## Features

- Secure email/password registration with OTP email verification.
- Google and GitHub OAuth login.
- JWT access tokens with refresh-token cookie support.
- Profile completion gate for onboarding quality.
- Skill catalog and profile-based skills to teach or learn.
- AI-assisted matches, roadmaps, resume guidance, and interview practice.
- Real-time private messaging with typing status, replies, editing, deletion, file sharing, and seen updates.
- Learning session booking, acceptance, rejection, completion, attendance tracking, and review prompts.
- Community feed with posts, likes, comments, following, and post sharing.
- Leaderboard and points for platform engagement.
- Certificate verification pages for completed learning outcomes.
- Notification center for important platform events such as bookings, follows, post interactions, badges, certificates, and reviews.
- Admin dashboard for managing platform data such as skills.

## Tech Stack

**Frontend**

- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Axios
- Socket.io Client
- Lucide React
- Chart.js
- Framer Motion
- Zod and React Hook Form

**Backend**

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io
- JSON Web Tokens
- Nodemailer
- Multer
- Cloudinary
- Google Gemini API
- PDFKit and QRCode

## Project Architecture

Orbitus uses a split frontend/backend architecture:

- The frontend is a Vite React single-page application in `frontend/`.
- The backend is an Express API and Socket.io server in `backend/`.
- MongoDB stores users, messages, sessions, posts, skills, notifications, reviews, certificates, badges, and leaderboard entries.
- Socket.io handles live chat, typing indicators, online presence, seen updates, and real-time notification delivery.
- REST APIs handle authentication, profiles, skills, AI workflows, sessions, certificates, posts, reviews, dashboards, and notifications.
- Uploaded assets are stored locally in development or through Cloudinary when configured.

## Screenshots

| Area | Screenshot |
| --- | --- |
| Login Page | `screenshots/login.png` |
| Dashboard | `screenshots/dashboard.png` |
| Skill Catalog | `screenshots/skills.png` |
| AI Matching | `screenshots/ai-matches.png` |
| AI Roadmaps | `screenshots/ai-roadmaps.png` |
| Messaging | `screenshots/chat.png` |
| Daily Feeds | `screenshots/daily-feeds.png` |
| Sessions | `screenshots/bookings.png` |
| Certificates | `screenshots/certificate.png` |

## Installation Guide

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB local instance or MongoDB Atlas database
- Email SMTP credentials for OTP delivery
- Optional Cloudinary account for resume/file storage
- Optional Google, GitHub, and Gemini API credentials

### Clone the Repository

```bash
git clone https://github.com/AyushKmr0/Orbitus-SkillSwap-Platform.git
cd Orbitus-SkillSwap-Platform
```

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

Do not commit real secrets. Use the provided example files:

- `backend/.env.example`
- `frontend/.env.example`

Create local environment files from the examples:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

On macOS or Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Running Locally

Start the backend first:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## Backend Setup

1. Create `backend/.env` from `backend/.env.example`.
2. Set `MONGODB_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.
3. Configure SMTP values if email OTP verification is required locally.
4. Configure `FRONTEND_URL=http://localhost:5173` for local CORS and OAuth redirects.
5. Run `npm run dev` for development or `npm start` for production mode.

## Frontend Setup

1. Create `frontend/.env` from `frontend/.env.example`.
2. Set `VITE_BACKEND_URL=http://localhost:5000`.
3. Set `VITE_SOCKET_URL=http://localhost:5000`.
4. Run `npm run dev`.

## Build Commands

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

Lint frontend:

```bash
cd frontend
npm run lint
```

Seed backend data when needed:

```bash
cd backend
npm run seed
```

## Deployment Information

The project is designed for separate frontend and backend deployment.

- Frontend can be deployed to Vercel using `frontend/vercel.json`.
- Backend can be deployed to Render, Railway, or another Node.js hosting platform.
- Set production environment variables in the hosting dashboard.
- Configure `FRONTEND_URL`, `FRONTEND_URLS`, `BACKEND_URL`, and `PUBLIC_BACKEND_URL` to match deployed domains.
- Ensure MongoDB Atlas allows the backend host IP or uses the required network access settings.
- Use HTTPS in production for secure refresh-token cookies and OAuth callbacks.

## API Overview

Main API groups:

- `GET /health` - backend health check.
- `/api/auth` - registration, OTP verification, login, logout, token refresh, OAuth, profile updates, resume upload, account deletion.
- `/api/users` - user/profile routes shared through the auth route module.
- `/api/skills` - skill catalog and admin skill management.
- `/api/ai` - AI matches, roadmaps, resume guidance, and interview tools.
- `/api/messages` - chat history, active chats, uploads, seen status, remove/block/unblock chat partners.
- `/api/sessions` - session booking, session response, joining/leaving sessions, and session history.
- `/api/dashboard` - user and admin dashboard metrics.
- `/api/reviews` - learning session reviews.
- `/api/notifications` - notification list, summary, and read status.
- `/api/posts` - feed posts, likes, comments, and post operations.
- `/api/certificates` - certificate verification.

## Folder Structure

```text
Orbitus-SkillSwap-Platform/
  backend/
    scripts/
    src/
      config/
      controllers/
      database/
      middlewares/
      models/
      routes/
      services/
      socket/
    package.json
  frontend/
    public/
    src/
      components/
      config/
      context/
      features/
      pages/
      services/
      store/
    package.json
  README.md
```

## Authentication Overview

Orbitus supports local and OAuth authentication. Local registration creates an OTP challenge and sends a verification code by email. Verified users can log in with email and password. The backend issues a JWT access token and stores a refresh token in an HTTP-only cookie. Protected routes use the JWT middleware to load the authenticated user.

OAuth is available for Google and GitHub when provider credentials are configured. OAuth callbacks redirect back to the frontend with the authenticated user payload.

## Learning Sessions Overview

Learners can book sessions with mentors by selecting a skill and schedule. Mentors can accept, reject, or complete sessions. The backend validates session access, join windows, attendance requirements, and session ownership. Important session state changes are preserved as notifications so users can track bookings and completion events.

## Certificates Overview

Orbitus includes certificate verification support. Certificates are stored in MongoDB and can be verified through the certificate API. Verification can return JSON or a browser-friendly certificate verification page with recipient, skill, certificate ID, and issue date.

## Project Status

Orbitus is currently an actively maintained personal project developed for academic, learning, and portfolio purposes.

Feature requests and feedback are welcome, but external code contributions are not currently being accepted.

## License

Copyright (c) 2026 Ayush Kumar

All Rights Reserved.

This project is provided for academic, learning, and portfolio purposes only. No part of this project may be copied, redistributed, modified, or used commercially without explicit permission from the author.

## Author

**Ayush Kumar**

- GitHub: https://github.com/AyushKmr0
- Project: Orbitus Skill Swap Platform
