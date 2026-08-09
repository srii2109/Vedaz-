import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB, run, all } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Friendly root landing page
app.get('/', (req, res) => {
  res.send('ChatWave Real-Time Backend Server is Running! 🚀');
});

// Initialize SQLite database
await initDB();

// Track active online users: socket.id -> username
const activeUsers = new Map();

// REST APIs
// 1. Fetch chat history
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await all('SELECT * FROM messages ORDER BY id ASC');
    res.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Send messages via REST API
app.post('/api/messages', async (req, res) => {
  const { username, text } = req.body;
  if (!username || !text) {
    return res.status(400).json({ error: 'Username and message text are required.' });
  }

  const timestamp = new Date().toISOString();
  const status = 'delivered';

  try {
    const result = await run(
      'INSERT INTO messages (username, text, timestamp, status) VALUES (?, ?, ?, ?)',
      [username, text, timestamp, status]
    );
    const newMessage = {
      id: result.id,
      username,
      text,
      timestamp,
      status
    };

    // Broadcast message via Socket.io in real-time
    io.emit('message', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Failed to save message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Delete a message
app.delete('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await run('DELETE FROM messages WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Broadcast message deletion via Socket.io in real-time
    io.emit('message-delete', Number(id));

    res.json({ success: true, message: `Message ${id} deleted successfully.` });
  } catch (error) {
    console.error('Failed to delete message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set up server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins with a username
  socket.on('join', (username) => {
    if (!username) return;
    activeUsers.set(socket.id, username);
    console.log(`User ${username} connected on socket ${socket.id}`);
    
    // Broadcast list of unique online users
    broadcastOnlineUsers();
  });

  // User is typing
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  // User stopped typing
  socket.on('stop-typing', (username) => {
    socket.broadcast.emit('stop-typing', username);
  });

  // Message read receipts
  socket.on('message-read', async ({ messageId, username }) => {
    try {
      await run('UPDATE messages SET status = ? WHERE id = ?', ['read', messageId]);
      // Broadcast read receipt status change to all clients
      io.emit('message-status', { id: messageId, status: 'read' });
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    const username = activeUsers.get(socket.id);
    if (username) {
      console.log(`User ${username} disconnected`);
      activeUsers.delete(socket.id);
      broadcastOnlineUsers();
      // Also notify clients to clear typing indicators for this user
      socket.broadcast.emit('stop-typing', username);
    }
  });
});

function broadcastOnlineUsers() {
  const users = Array.from(new Set(activeUsers.values()));
  io.emit('users', users);
}

server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
