const { DrawingState } = require("./drawing-state");

class Rooms {
  constructor() {
    /** @type {Map<string, {users: Map<string, any>, state: DrawingState}>} */
    this.rooms = new Map();
  }
  // Ensure room
  ensure(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { users: new Map(), state: new DrawingState() });
    }
    return this.rooms.get(roomId);
  }
  //User operations
  // rooms.js
  addUser(roomId, user) {
    const room = this.ensure(roomId);
    user.online = true; // default online
    room.users.set(user.id, user);
    return room;
  }
  removeUser(roomId, userId) {
    const room = this.ensure(roomId);
    room.users.delete(userId);
    return room;
  }
  listUsers(roomId) {
    const room = this.ensure(roomId);
    return [...room.users.values()];
  }
  getState(roomId) {
    return this.ensure(roomId).state;
  }
}

module.exports = { Rooms };
