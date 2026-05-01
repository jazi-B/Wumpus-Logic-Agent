import LogicEngine from './LogicEngine.js';

let engine = new LogicEngine();

// Agent at 1,1
// No breeze, no stench
engine.tell(1, 1, false, false, [
  {x: 1, y: 2},
  {x: 2, y: 1}
]);

console.log("Safe 1,2:", engine.isSafe(1, 2)); // true
console.log("Safe 2,1:", engine.isSafe(2, 1)); // true

// Move to 2,1. Perceive breeze, no stench.
engine.tell(2, 1, true, false, [
  {x: 1, y: 1},
  {x: 2, y: 2},
  {x: 3, y: 1}
]);

// Is 2,2 safe? Since we don't know where the pit is (2,2 or 3,1), we can't prove it's safe.
console.log("Safe 2,2:", engine.isSafe(2, 2)); // false

// Is 2,2 a pit? We don't know for sure.
console.log("Pit 2,2:", engine.isPit(2, 2)); // false

// Let's go to 1,2. Perceive stench, no breeze.
engine.tell(1, 2, false, true, [
  {x: 1, y: 1},
  {x: 1, y: 3},
  {x: 2, y: 2}
]);

// Since 1,2 has no breeze, 2,2 cannot be a pit!
// Wait, engine.ask("~P_2_2") should be true now.
console.log("Not Pit 2,2:", engine.ask("~P_2_2")); // true

// And 2,1 has breeze, so pit must be at 3,1!
console.log("Pit 3,1:", engine.isPit(3, 1)); // true

// Wumpus is around 1,2. Neighbors are 1,1 (visited, no Wumpus), 1,3, 2,2.
// Wumpus is at 1,3 or 2,2.
console.log("Wumpus 1,3 or 2,2? We can't know for sure without more info.");
console.log("Safe 2,2:", engine.isSafe(2, 2)); // false, might be wumpus.
