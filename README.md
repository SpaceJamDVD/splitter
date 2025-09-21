# Splitter

**Splitter** is a MERN-stack web application built specifically for couples to track and settle shared expenses. It supports secure authentication, real-time balance updates, and simple settlement flows designed for two users.

## Tech Stack

### Frontend

- React (Hooks + Context API)
- Axios for API requests
- Socket.IO client

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication with cookies
- Socket.IO server

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/splitter.git
cd splitter
```

### Install Dependencies

**Backend**

```bash
cd server
npm install
```

**Frontend**

```bash
cd ../client
npm install
```

### Environment Variables

**Server Environment Variables**
Create a `.env` file in `server/` with the following:

```env
PORT=5000
ALLOWED_ORIGINS=yourFrontEndUrl
MONGO_URI=yourMongoURI
JWT_SECRET=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
```

**Frontend Environment Variables**
Create a `.env` file in `client/` with the following:

```env
REACT_APP_SOCKET_URL=serverURL
```

### Run Locally

**Start the backend:**

```bash
cd server
npm run dev
```

**Start the frontend:**

```bash
cd ../client
npm start
```

The app will be available at:

- Frontend → http://localhost:3000
- Backend → http://localhost:5000

## Roadmap

- Add API documentation (Swagger/Postman)
- Improve Socket.IO reliability
- CI/CD pipeline for merges into main
- Add automated testing for transaction, balance, and settlement logic

## License

MIT
