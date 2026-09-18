# Paytm Wallet Clone

A full-stack digital wallet and payment application built to demonstrate secure financial transactions, stateless authentication, and robust error handling across a modern web stack.

---

## 📽️ Video Walkthrough

> 🔗 **[Watch the Video Walkthrough](https://your-video-link-here)** *(Link will be updated soon)*

---

## 🛠️ Tech Stack

### Frontend
- **Framework & Tooling:** React (Vite)
- **Routing & State:** React Router DOM (v6), Route Guards (`PublicRoute`, `ProtectedRoute`)
- **Styling:** Tailwind CSS

### Backend
- **Runtime & Framework:** Node.js, Express.js
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), `bcrypt` password hashing
- **Data Validation:** Zod schema validation
- **Architecture:** Modular RESTful routing & centralized error handling

### Database & Tools
- **Database:** MongoDB (via Mongoose ODM) with ACID Transactions / Sessions
- **Database GUI:** MongoDB Compass
- **Dev Tools:** Nodemon, Dotenv, Postman

---

## 💡 Key Engineering Learnings

- **ACID Transactions in MongoDB:** Implemented atomic transfers using `mongoose.startSession()` and `session.startTransaction()` to guarantee that sender debit and receiver credit operations succeed together or roll back completely on failure.
- **Stateless JWT Authentication:** Built secure token generation and custom `authMiddleware` to guard protected routes and attach user context (`req.userid`).
- **Schema Validation with Zod:** Enforced strict compile/runtime validation rules on input payloads for signup, signin, and profile updates.
- **Centralized Error Handling:** Architected custom error classes (`AppError`) with a global Express error-handling middleware for predictable API error contracts.
- **Modular Route Architecture:** Separated concerns into `/api/v1/user` and `/api/v1/account` sub-routers.
- **Client-Side Security:** Built protected route wrappers to prevent unauthorized dashboard access and bounce authenticated users from auth screens.

---

## 🚀 Getting Started

### 1. Prerequisites (Pre-run)

1. **Install MongoDB & MongoDB Compass:**
   - Download and install [MongoDB Compass](https://www.mongodb.com/products/compass).
   - Ensure your MongoDB server is running locally or prepare your MongoDB Atlas connection string.
2. **Environment Variables:**
   - Create a `.env` file inside the `backend/` directory:
     ```bash
     cd backend
     cp .env.example .env
     ```
   - Fill in your connection details in `backend/.env`:
     ```env
     MONGO_URL=mongodb://localhost:27017/paytm
     JWT_SECRET=your_super_secret_key_here
     ```

---

### 2. Running the Backend

Open a terminal and execute:

```bash
cd backend
npm install
npx nodemon index.js
```

> The server will start listening at `http://localhost:3000` with routes under `/api/v1`.

---

### 3. Running the Frontend

Open a second terminal and execute:

```bash
cd frontend
npm install
npm run dev
```

> Open the local Vite URL (e.g. `http://localhost:5173`) in your browser.

---

## 🧪 Testing the Application

1. **Sign Up:** Register two test accounts (e.g., *Alice* and *Bob*) with random starting balances.
2. **Search Directory:** Search for another user by name from the dashboard search bar.
3. **Transfer Money:** Click **Send Money**, enter an amount, and verify that balances update atomically for both accounts.
4. **Edit Profile:** Click your profile badge in the top-right header to update your first name, last name, or password.
5. **Authentication Checks:** Test logging out and attempting to access `/dashboard` (redirects to `/signin`).

---

## 📜 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/user/signup` | Create user and initialize wallet | No |
| `POST` | `/api/v1/user/signin` | Authenticate and retrieve JWT | No |
| `PUT` | `/api/v1/user/update` | Update first name, last name, or password | Yes |
| `GET` | `/api/v1/user/bulk` | Search registered users by substring | Yes |
| `GET` | `/api/v1/account/user-info` | Fetch current user details & balance | Yes |
| `POST` | `/api/v1/account/transfer` | Execute atomic wallet-to-wallet transfer | Yes |
