const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
// Allow socket.io connections from frontend origins.
// During development we want to allow http://localhost:3000. For production,
// set FRONTEND_ORIGIN to your deployed frontend origin (example: https://drawing-canvas-client.vercel.app).
const allowedOrigins = [process.env.FRONTEND_ORIGIN || "http://localhost:3000", "https://drawing-canvas-client.vercel.app"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Serve frontend files from ../client
//app.use(express.static(path.join(__dirname, "..", "client")));

//app.get("/", (req, res) => {
 // res.sendFile(path.join(__dirname, "..", "client", "index.html"));
//});

// In-memory room store
const rooms = {};

io.on("connection", (socket) => {
  console.log(`🟢 Connected: ${socket.id}`);

  socket.on("join", ({ roomId, color }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.color = color;

    if (!rooms[roomId]) {
      rooms[roomId] = {
        oplog: [],
        users: [],
        userCount: 0,
      };
    }

    // Assign usernames: user-1, user-2
    rooms[roomId].userCount += 1;
    const userName = `user-${rooms[roomId].userCount}`;

    rooms[roomId].users.push({
      id: socket.id,
      name: userName,
      color,
      online: true,
    });

    // Send initial state to new user
    socket.emit("welcome", {
      userId: socket.id,
      color,
      users: rooms[roomId].users,
      oplog: rooms[roomId].oplog,
    });

    // Notify others
    io.to(roomId).emit("users:update", rooms[roomId].users);
  });

  socket.on("cursor", ({ x, y }) => {
    socket.to(socket.roomId).emit("cursor", {
      userId: socket.id,
      name: getUserName(socket),
      color: socket.color,
      x,
      y,
    });
  });

  socket.on("stroke:start", (data) => {
    socket.to(socket.roomId).emit("stroke:start", { ...data, userId: socket.id });
  });

  socket.on("stroke:points", (data) => {
    socket.to(socket.roomId).emit("stroke:points", { ...data, userId: socket.id });
  });

  socket.on("stroke:end", (data) => {
    socket.to(socket.roomId).emit("stroke:end", { ...data, userId: socket.id });
    rooms[socket.roomId].oplog.push({ type: "stroke", ...data });
  });

  socket.on("undo", () => {
    const ops = rooms[socket.roomId].oplog;
    if (ops.length > 0) {
      const lastOp = ops.pop();
      io.to(socket.roomId).emit("undo:applied", { op: lastOp });
    }
  });

  socket.on("clear", () => {
    rooms[socket.roomId].oplog.length = 0;
    io.to(socket.roomId).emit("cleared");
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Disconnected: ${socket.id}`);
    const users = rooms[socket.roomId]?.users ?? [];
    const user = users.find((u) => u.id === socket.id);
    if (user) user.online = false;
    io.to(socket.roomId).emit("users:update", users);
  });

  function getUserName(socket) {
    const users = rooms[socket.roomId]?.users ?? [];
    const user = users.find((u) => u.id === socket.id);
    return user?.name ?? "unknown";
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
