# Real-Time Chat Application (ChatWave)

ChatWave is a modern, real-time public lobby chat application built with **React (Vite)** on the frontend and **Node.js (Express + Socket.io)** on the backend. Messages are persisted locally using a lightweight **SQLite database**.

## Features

- 💬 **Real-time Messaging**: Instant message delivery and broadcasting using Socket.io.
- 📜 **Chat History**: Previous messages are stored in SQLite and loaded automatically via REST API when refreshing the app.
- 🕒 **Timestamps**: Displayed on all message bubbles.
- 👤 **Username-based dummy Login**: Prompts users for a custom screen name.
- 🟢 **Online/Offline User Status**: Displays connection status and lists all currently connected users in the sidebar in real time.
- ✍️ **Typing Indicators**: Displays "X is typing..." in real time when users are composing messages.
- 👁️ **Delivered & Read Receipts**: Shows a single gray checkmark when a message is successfully delivered to the server, and double blue checkmarks when other users have loaded/seen the message.

---

## Tech Stack & Architecture

- **Frontend**: React (Vite), Lucide React (Icons), Vanilla CSS (Custom Design System).
- **Backend**: Node.js, Express, Socket.io, `sqlite3` (SQLite driver).
- **Database**: SQLite (stored locally as `backend/chat.db`).

---

## Design Decisions

1. **Vanilla CSS Design System**: Built completely using Vanilla CSS (CSS Custom Properties). Designed with a premium, responsive dark-mode theme featuring:
   - Modern typography (`Outfit` & `Plus Jakarta Sans` Google fonts).
   - Glassmorphic card styling (backdrop-filter blur, fine borders, glowing shadows).
   - Micro-animations for message sending, typing indicators, and user entry transitions.
2. **REST API + Sockets Co-existence**:
   - **Sending messages**: The client issues a REST `POST` request to `/api/messages` to submit a message. This validates the REST endpoint requirement.
   - **Real-time broadcast**: Upon receiving the REST `POST` request, the server stores it in the database and broadcasts the newly added message to all connected clients via Socket.io.
   - **Fetching history**: Done via a REST `GET` request on initial client mount to load past messages.
3. **Database Selection**: SQLite was chosen as it is a zero-configuration SQL database engine, which persists data locally without the need for installing and maintaining an external database process.
4. **Local Storage Username Persistence**: The frontend caches the logged-in username in `localStorage` so refreshing does not force re-authentication, though it joins a new socket session gracefully.

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file inside the `backend` directory:
```env
PORT=5000
```

---

## Setup & Running the Application

Ensure you have **Node.js (v18+)** installed.

### 1. Run the Backend Server

```bash
cd backend
npm install
npm run dev
```
The server will start at [http://localhost:5000](http://localhost:5000).

### 2. Run the Frontend App

```bash
cd frontend
npm install
npm run dev
```
The client app will launch at [http://localhost:5173](http://localhost:5173).

Open multiple browser windows at [http://localhost:5173](http://localhost:5173) to test the real-time chat, typing indicators, and online status.

---

## Project Structure

```text
Vedaz/
├── backend/
│   ├── src/
│   │   ├── db.js          # SQLite database connection & migrations
│   │   └── index.js        # Express REST API routes & Socket.io server logic
│   ├── chat.db            # SQLite database file (created automatically)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatArea.jsx  # Chat window & inputs
│   │   │   ├── Login.jsx     # Dummy authentication screen
│   │   │   └── Sidebar.jsx   # Profile & active user list
│   │   ├── App.jsx        # Main application state & Socket management
│   │   ├── index.css      # Core Vanilla CSS theme & animations
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Assumptions Made

1. **Single Public Room**: It is assumed that all users join a single public lobby room where everyone broadcasts messages together.
2. **Ephemeral Active Users**: The online users list is kept in memory on the backend. When a user closes the tab (socket disconnects), they are immediately removed from the active users list.
3. **Dummy Auth**: Username entries are validated on client side (not empty, max 20 chars) and stored in local memory; no password checks or account creation APIs are necessary.
