# PayTM Clone

A hands-on learning project that builds a simplified PayTM-like wallet/payment service. This repo uses **JavaScript**, **Node.js**, and **MongoDB (via Mongoose)** for the backend, with a **React (Vite)** frontend.

## Features

- User signup/signin with JWT-based authentication
- Search for other users
- Check account balance
- Transfer money between users, implemented with MongoDB sessions/transactions to keep balances consistent

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **Auth:** JWT (jsonwebtoken), bcrypt for password hashing
- **Validation:** Zod
- **Frontend:** React, Vite

## Folder Structure

```
paytm/
├── backend/                 # Express API server
│   ├── index.js             # App entrypoint — loads env, sets up middleware & routes
│   ├── config.js            # Reads config (JWT_SECRET) from environment variables
│   ├── middleware.js        # authMiddleware — verifies JWT and attaches req.userId
│   ├── routes/
│   │   ├── index.js         # Mounts /user and /account sub-routers
│   │   ├── user.js          # Signup, signin, update profile, bulk user search
│   │   └── account.js       # Balance check and money transfer (session/transaction)
│   ├── .env.example         # Template for required environment variables
│   └── package.json
│
├── frontend/                 # React (Vite) client
│   └── src/                  # Components and app entrypoint
│
├── db.js                     # Mongoose connection + User/Account schemas & models
├── Dockerfile
└── package.json
```

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URL and JWT_SECRET
npm run dev
```

The server starts on `http://localhost:3000`, with routes mounted under `/api/v1`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `backend/.env` file (see `backend/.env.example`) with:

| Variable     | Description                                  |
|--------------|-----------------------------------------------|
| `MONGO_URL`  | MongoDB connection string (Atlas or local)   |
| `JWT_SECRET` | Secret used to sign/verify JWTs               |

## API Overview

| Method | Route                        | Description                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/v1/user/signup`         | Create a new user + account          |
| POST   | `/api/v1/user/signin`         | Authenticate and receive a JWT       |
| PUT    | `/api/v1/user/update`          | Update logged-in user's profile      |
| GET    | `/api/v1/user/bulk`           | Search users by name                 |
| GET    | `/api/v1/account/balance`     | Get logged-in user's account balance |
| POST   | `/api/v1/account/transfer`    | Transfer money to another user       |

## Disclaimer

This is a learning project for practicing backend development with Node.js and MongoDB — not a real payment service.
