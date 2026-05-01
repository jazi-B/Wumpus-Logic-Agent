export class WumpusWorld {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.agent = { x: 1, y: 1 }; // (col, row), 1-based
    this.wumpus = null;
    this.pits = new Set();
    this.visited = new Set(['1,1']);
    this.gameOver = false;
    this.won = false;
    this.log = ["Game started. Agent at (1,1)."];

    this.initializeHazards();
  }

  initializeHazards() {
    // Place Wumpus randomly (not at 1,1)
    let wx, wy;
    do {
      wx = Math.floor(Math.random() * this.cols) + 1;
      wy = Math.floor(Math.random() * this.rows) + 1;
    } while (wx === 1 && wy === 1);
    this.wumpus = { x: wx, y: wy };

    // Place Pits randomly (approx 20% chance per cell, not at 1,1)
    for (let x = 1; x <= this.cols; x++) {
      for (let y = 1; y <= this.rows; y++) {
        if (x === 1 && y === 1) continue;
        if (x === wx && y === wy) continue; // no pit where wumpus is
        if (Math.random() < 0.2) {
          this.pits.add(`${x},${y}`);
        }
      }
    }
  }

  getPercepts(x, y) {
    let breeze = false;
    let stench = false;

    let neighbors = this.getNeighbors(x, y);
    for (let n of neighbors) {
      if (this.pits.has(`${n.x},${n.y}`)) breeze = true;
      if (this.wumpus.x === n.x && this.wumpus.y === n.y) stench = true;
    }

    return { breeze, stench };
  }

  getNeighbors(x, y) {
    let n = [];
    if (x > 1) n.push({ x: x - 1, y });
    if (x < this.cols) n.push({ x: x + 1, y });
    if (y > 1) n.push({ x, y: y - 1 });
    if (y < this.rows) n.push({ x, y: y + 1 });
    return n;
  }

  moveAgent(x, y) {
    if (this.gameOver || this.won) return;

    // Allow jumping to any cell to simulate backtracking across known safe visited cells
    // (In a real physical robot it would walk back, but logically it's equivalent)
    this.agent = { x, y };
    this.visited.add(`${x},${y}`);
    this.log.push(`Moved to (${x},${y}).`);

    if (this.pits.has(`${x},${y}`)) {
      this.gameOver = true;
      this.log.push("Fell into a pit! Game Over.");
    } else if (this.wumpus.x === x && this.wumpus.y === y) {
      this.gameOver = true;
      this.log.push("Eaten by the Wumpus! Game Over.");
    } else {
      let percepts = this.getPercepts(x, y);
      if (percepts.breeze) this.log.push("Felt a breeze.");
      if (percepts.stench) this.log.push("Smelled a stench.");
    }
    
    // Check win condition: visited all safe cells?
    // Actually, simple win condition: reach (this.cols, this.rows) safely? The prompt doesn't specify gold.
    // Let's just let the agent explore as much as possible.
  }
}
