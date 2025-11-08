class DrawingState {
  constructor() {
    /** @type {Array<any>} */
    //Operation log
    this.oplog = []; // list of {type:'stroke'|'clear', id, eraser, color, width, points:[]}
    /** @type {Array<any>} */
    this.undone = [];
  }
  //For stroke operations
  applyStrokeStart({ id, eraser, color, width, userId }) {
    // we create a placeholder and points streamed in
    const s = { type:'stroke', id, userId, eraser, color, width, points: [] };
    this._active = this._active || new Map();
    this._active.set(id, s);
  }

  applyStrokePoints({ id, points }) {
    const s = this._active?.get(id);
    if (!s) return;
    s.points.push(...points);
  }

  applyStrokeEnd({ id }) {
    const s = this._active?.get(id);
    if (!s) return null;
    this._active.delete(id);
    this.oplog.push(s);
    this.undone.length = 0;
    return s;
  }

  clear() {
    this.oplog = [];
    this.undone = [];
  }

  //undo to remove last committed operation
  undo() {
    if (!this.oplog.length) return null;
    const op = this.oplog.pop();
    this.undone.push(op);
    return op;
  }

  redo() {
    if (!this.undone.length) return null;
    const op = this.undone.pop();
    this.oplog.push(op);
    return op;
  }

  snapshot() {
    return this.oplog;
  }
}

module.exports = { DrawingState };