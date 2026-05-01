class LogicEngine {
  constructor(rows, cols) {
    this.kb = []; // Ye hamara knowledge base hai clauses wala
    this.totalInferenceSteps = 0; // Kitni bar logic resolve hui
    this.kbStrings = new Set(); // Duplicate clauses se bachne k liye
    
    if (rows && cols) {
      this.initializeGlobalRules(rows, cols);
    }
  }

  initializeGlobalRules(rows, cols) {
    // Ye check kr rha hai k wumpus aik he hona chahiye pure grid main
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
    
    // Aik wumpus lazmi hona chahiye grid main
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

  // Cell k bare main KB ko btane wala function
    // Percepts: breeze, stench waghera
    tell(x, y, breeze, stench, neighbors) {
    // Hum is waqt (x,y) pe hain to ye safe hai
    this.addClause([`~P_${x}_${y}`]);
    this.addClause([`~W_${x}_${y}`]);

    // Breeze percept check
    if (breeze) {
      this.addClause([`B_${x}_${y}`]);
    } else {
      this.addClause([`~B_${x}_${y}`]);
    }

    // Stench percept check
    if (stench) {
      this.addClause([`S_${x}_${y}`]);
    } else {
      this.addClause([`~S_${x}_${y}`]);
    }

    // Breeze k rules add kr rha hoon: B_x_y <=> (P_n1 V P_n2 ...)
    let bClause = [`~B_${x}_${y}`];
    neighbors.forEach(n => bClause.push(`P_${n.x}_${n.y}`));
    this.addClause(bClause);

    neighbors.forEach(n => {
      this.addClause([`~P_${n.x}_${n.y}`, `B_${x}_${y}`]);
    });

    // Stench k rules: S_x_y <=> (W_n1 V W_n2 ...)
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
    // Faltu tautologies ko filter kr rha hoon
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

  // Resolution refutation se query proof krne wala main function
  ask(queryLiteral) {
    let toProve = this.negate(queryLiteral);
    
    // Pehle he KB main para hai to return true
    if (this.kbStrings.has(queryLiteral)) return true;
    if (this.kbStrings.has(toProve)) return false;

    // Negation add kr k proof start kro
    let clauses = [...this.kb.map(c => [...c]), [toProve]];
    let seen = new Set(clauses.map(c => this.clauseToString(c)));

    let limit = 20000; // Search limit taki browser hang na ho
    let iterations = 0;

    let currentNew = [[toProve]]; 

    while (currentNew.length > 0 && iterations < limit) {
      let toAdd = [];
      
      for (let i = 0; i < currentNew.length; i++) {
        for (let j = 0; j < clauses.length; j++) {
          iterations++;
          this.totalInferenceSteps++;
          
          let res = this.resolve(currentNew[i], clauses[j]);
          for (let r of res) {
            if (r.length === 0) return true; // Contradiction mil gai! Empty clause
            
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

      // Short clauses ko pehle resolve krna hai (Unit Preference)
      toAdd.sort((a, b) => a.length - b.length);
      
      clauses.push(...toAdd);
      currentNew = toAdd;
    }

    return false; // Proof nhi ho saka
  }

  // Check kr rha hoon k (x,y) safe hai ya nhi
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
