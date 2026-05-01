class LogicEngine {
  constructor(rows, cols) {
    this.kb = []; // Array of arrays (clauses)
    this.totalInferenceSteps = 0;
    this.kbStrings = new Set(); // To prevent duplicate clauses
    
    if (rows && cols) {
      this.initializeGlobalRules(rows, cols);
    }
  }

  initializeGlobalRules(rows, cols) {
    // "At most one Wumpus" rule:
    // For every pair of distinct cells A and B, ~W_A V ~W_B
    let cells = [];
    for (let x = 1; x <= cols; x++) {
      for (let y = 1; y <= rows; y++) {
        cells.push({x, y});
      }
    }
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        let c1 = cells[i];
        let c2 = cells[j];
        this.addClause([`~W_${c1.x}_${c1.y}`, `~W_${c2.x}_${c2.y}`]);
      }
    }
    
    // "At least one Wumpus" rule
    let atLeastOne = cells.map(c => `W_${c.x}_${c.y}`);
    this.addClause(atLeastOne);
  }

  // literal: "P_1_1", "~P_1_1"
  negate(literal) {
    return literal.startsWith("~") ? literal.substring(1) : "~" + literal;
  }

  addClause(clause) {
    let cleanClause = [...new Set(clause)].sort();
    let str = cleanClause.join('|');
    if (!this.kbStrings.has(str)) {
      this.kbStrings.add(str);
      this.kb.push(cleanClause);
    }
  }

  // Tell KB about a visited cell (x,y)
  // Percepts: breeze (boolean), stench (boolean)
  // Neighbors: array of {x, y}
  tell(x, y, breeze, stench, neighbors) {
    // 1. We are at (x,y), so it's safe!
    this.addClause([`~P_${x}_${y}`]);
    this.addClause([`~W_${x}_${y}`]);

    // 2. Breeze percept
    if (breeze) {
      this.addClause([`B_${x}_${y}`]);
    } else {
      this.addClause([`~B_${x}_${y}`]);
    }

    // 3. Stench percept
    if (stench) {
      this.addClause([`S_${x}_${y}`]);
    } else {
      this.addClause([`~S_${x}_${y}`]);
    }

    // 4. Add rules for Breeze: B_x_y <=> (P_n1 V P_n2 ...)
    // B_x_y => (P_n1 V P_n2 ...)  ==> ~B_x_y V P_n1 V P_n2 ...
    let bClause = [`~B_${x}_${y}`];
    neighbors.forEach(n => bClause.push(`P_${n.x}_${n.y}`));
    this.addClause(bClause);

    // (P_n1 V P_n2 ...) => B_x_y ==> ~P_n1 V B_x_y
    neighbors.forEach(n => {
      this.addClause([`~P_${n.x}_${n.y}`, `B_${x}_${y}`]);
    });

    // 5. Add rules for Stench: S_x_y <=> (W_n1 V W_n2 ...)
    let sClause = [`~S_${x}_${y}`];
    neighbors.forEach(n => sClause.push(`W_${n.x}_${n.y}`));
    this.addClause(sClause);

    neighbors.forEach(n => {
      this.addClause([`~W_${n.x}_${n.y}`, `S_${x}_${y}`]);
    });
  }

  resolve(c1, c2) {
    let resolvents = [];
    for (let l1 of c1) {
      let neg = this.negate(l1);
      if (c2.includes(neg)) {
        let newClause = [...new Set([...c1.filter(x => x !== l1), ...c2.filter(x => x !== neg)])];
        resolvents.push(newClause);
      }
    }
    // Filter out tautologies
    return resolvents.filter(c => {
      for (let l of c) {
        if (c.includes(this.negate(l))) return false;
      }
      return true;
    });
  }

  clauseToString(c) {
    return [...c].sort().join('|');
  }

  // Use resolution refutation to prove a query (a single literal)
  // Returns true if query is proven, false otherwise
  ask(queryLiteral) {
    let toProve = this.negate(queryLiteral);
    
    // Check if it's already a unit clause in KB
    if (this.kbStrings.has(queryLiteral)) return true;
    if (this.kbStrings.has(toProve)) return false;

    // To prove queryLiteral, we negate it and add to KB
    let clauses = [...this.kb.map(c => [...c]), [toProve]];
    let seen = new Set(clauses.map(c => this.clauseToString(c)));

    // For efficiency, prioritize shorter clauses (unit preference)
    let limit = 20000; // Lower limit but more efficient iterations
    let iterations = 0;

    // currentNew: clauses generated in the last iteration
    let currentNew = [[toProve]]; 

    while (currentNew.length > 0 && iterations < limit) {
      let toAdd = [];
      
      for (let i = 0; i < currentNew.length; i++) {
        for (let j = 0; j < clauses.length; j++) {
          iterations++;
          this.totalInferenceSteps++;
          
          let res = this.resolve(currentNew[i], clauses[j]);
          for (let r of res) {
            if (r.length === 0) return true; // Contradiction found! Empty clause
            
            let rStr = this.clauseToString(r);
            if (!seen.has(rStr)) {
              seen.add(rStr);
              toAdd.push(r);
            }
          }
          if (iterations > limit) break;
        }
        if (iterations > limit) break;
      }

      // Unit preference: sort toAdd by length to resolve shorter ones first
      toAdd.sort((a, b) => a.length - b.length);
      
      clauses.push(...toAdd);
      currentNew = toAdd;
    }

    return false; // Not proven
  }

  // A cell is safe if we can prove ~P_x_y AND ~W_x_y
  isSafe(x, y) {
    let pSafe = this.ask(`~P_${x}_${y}`);
    let wSafe = this.ask(`~W_${x}_${y}`);
    return pSafe && wSafe;
  }
  
  isPit(x, y) {
    return this.ask(`P_${x}_${y}`);
  }
  
  isWumpus(x, y) {
    return this.ask(`W_${x}_${y}`);
  }
}

export default LogicEngine;
