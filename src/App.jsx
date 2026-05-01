import React, { useState, useEffect, useRef } from 'react';
import { WumpusWorld } from './WumpusWorld';
import LogicEngine from './LogicEngine';
import './index.css';

const App = () => {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [world, setWorld] = useState(null);
  const [engine, setEngine] = useState(null);
  const [logs, setLogs] = useState([]);
  const [kbState, setKbState] = useState([]);
  const [inferences, setInferences] = useState({});
  const [autoPlay, setAutoPlay] = useState(false);
  const [inferenceSteps, setInferenceSteps] = useState(0);
  const logsEndRef = useRef(null);

  useEffect(() => {
    startNewGame();
  }, [rows, cols]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleKeydown = (e) => {
    if (e.code === 'KeyJ' && !autoPlay) {
      e.preventDefault();
      agentStep();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  const startNewGame = () => {
    const newWorld = new WumpusWorld(rows, cols);
    const newEngine = new LogicEngine(rows, cols);
    setWorld(newWorld);
    setEngine(newEngine);
    setLogs(["Game initialize hogya. Agent (1,1) pe hai."]);
    setKbState([]);
    setInferenceSteps(0);
    setInferences({});
    setAutoPlay(false);

    const p = newWorld.getPercepts(1, 1);
    const neighbors = newWorld.getNeighbors(1, 1);
    newEngine.tell(1, 1, p.breeze, p.stench, neighbors);
    setKbState(newEngine.kb.map(c => newEngine.clauseToString(c)));
    
    evaluateFrontier(newWorld, newEngine);
  };

  const evaluateFrontier = (currentWorld, currentEngine) => {
    // Ye check kr rha hai k visited cells k neighbors main kon kon se cells frontier pe hain
    let frontier = new Set();
    currentWorld.visited.forEach(v => {
      let [vx, vy] = v.split(',').map(Number);
      let n = currentWorld.getNeighbors(vx, vy);
      n.forEach(neighbor => {
        let nStr = `${neighbor.x},${neighbor.y}`;
        if (!currentWorld.visited.has(nStr)) {
          frontier.add(nStr);
        }
      });
    });

    let newInfs = {};
    frontier.forEach(f => {
      let [fx, fy] = f.split(',').map(Number);
      // Resolution engine se puch rhe hain k cell safe hai ya nhi
      let isSafe = currentEngine.isSafe(fx, fy);
      if (isSafe) {
        newInfs[f] = 'safe';
      } else {
        let isPit = currentEngine.isPit(fx, fy);
        let isWumpus = currentEngine.isWumpus(fx, fy);
        if (isPit) newInfs[f] = 'pit';
        else if (isWumpus) newInfs[f] = 'wumpus';
        else newInfs[f] = 'unknown';
      }
    });
    setInferences(newInfs);
    setInferenceSteps(currentEngine.totalInferenceSteps);
  };

  const agentStep = () => {
    if (world.gameOver || world.won) {
      setAutoPlay(false);
      return;
    }

    let safeCells = Object.keys(inferences).filter(k => inferences[k] === 'safe');
    
    let target = null;
    if (safeCells.length > 0) {
      // Pehle adjacent safe cells check kro
      let adjacent = safeCells.find(c => {
        let [cx, cy] = c.split(',').map(Number);
        return Math.abs(world.agent.x - cx) + Math.abs(world.agent.y - cy) === 1;
      });
      if (adjacent) {
        target = adjacent.split(',').map(Number);
      } else {
        target = safeCells[0].split(',').map(Number);
      }
    } else {
      setLogs(prev => [...prev, "Koi safe cell nhi bacha! Agent ruk gaya."]);
      setAutoPlay(false);
      return;
    }

    const { x, y } = { x: target[0], y: target[1] };
    
    world.moveAgent(x, y);
    setLogs([...world.log]);

    if (!world.gameOver && !world.won) {
      const p = world.getPercepts(x, y);
      const neighbors = world.getNeighbors(x, y);
      engine.tell(x, y, p.breeze, p.stench, neighbors);
      setKbState(engine.kb.map(c => engine.clauseToString(c)));
      evaluateFrontier(world, engine);
    } else {
      setAutoPlay(false);
    }
  };

  useEffect(() => {
    let interval;
    if (autoPlay && world && !world.gameOver && !world.won) {
      interval = setInterval(agentStep, 800);
    }
    return () => clearInterval(interval);
  }, [autoPlay, world, engine, inferences]);

  if (!world) return null;

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Dynamic Wumpus Logic Agent</h1>
        <div className="controls">
          <div className="control-group">
            <label>Rows</label>
            <input type="number" min="3" max="10" value={rows} onChange={e => setRows(Number(e.target.value))} />
          </div>
          <div className="control-group">
            <label>Cols</label>
            <input type="number" min="3" max="10" value={cols} onChange={e => setCols(Number(e.target.value))} />
          </div>
          <button className="btn btn-primary" onClick={startNewGame}>Restart Environment</button>
        </div>
      </header>

      <main className="main-content">
        <div className="grid-container">
          <div className="grid-wrapper">
            <div className="glow-bg"></div>
            <div 
              className="wumpus-grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                aspectRatio: `${cols}/${rows}`
              }}
            >
              {Array.from({ length: rows }).map((_, rIndex) => {
                const y = rows - rIndex;
                return Array.from({ length: cols }).map((_, cIndex) => {
                  const x = cIndex + 1;
                  const key = `${x},${y}`;
                  const isVisited = world.visited.has(key);
                  const isAgent = world.agent.x === x && world.agent.y === y;
                  const inf = inferences[key];
                  
                  const showTruth = isVisited || world.gameOver || world.won;
                  const hasPit = world.pits.has(key);
                  const hasWumpus = world.wumpus.x === x && world.wumpus.y === y;
                  
                  let percepts = isVisited ? world.getPercepts(x, y) : { breeze: false, stench: false };

                  let cellClass = "cell";
                  if (isVisited) cellClass += " visited";
                  else cellClass += " unvisited";
                  
                  if (isAgent) cellClass += " active-agent";
                  if (!isVisited && inf) cellClass += ` inf-${inf}`;

                  return (
                    <div key={key} className={cellClass}>
                      {!isVisited && inf && (
                        <div className={`inference-badge badge-${inf}`}>
                          {inf.toUpperCase()}{inf !== 'safe' ? '?' : ''}
                        </div>
                      )}

                      <div className="coords">{x},{y}</div>

                      <div className="cell-content">
                        {showTruth && hasPit && <span className="emoji" title="Pit">🕳️</span>}
                        {showTruth && hasWumpus && <span className="emoji" title="Wumpus">👹</span>}
                        {isAgent && <span className="emoji agent-emoji" title="Agent">🤖</span>}
                      </div>

                      {isVisited && (percepts.breeze || percepts.stench) && (
                        <div className="percepts">
                          {percepts.breeze && <span className="breeze-dot"></span>}
                          {percepts.stench && <span className="stench-dot"></span>}
                        </div>
                      )}
                    </div>
                  );
                });
              })}
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={agentStep} 
                disabled={world.gameOver || autoPlay}
              >
                Step Agent <span className="kbd">J</span>
              </button>
              <button 
                className={`btn ${autoPlay ? 'btn-danger' : 'btn-success'}`}
                onClick={() => setAutoPlay(!autoPlay)}
                disabled={world.gameOver}
              >
                {autoPlay ? 'Pause Auto-Play' : 'Start Auto-Play'}
              </button>
            </div>
            
            {world.gameOver && <div className="game-over">GAME OVER</div>}
          </div>
        </div>

        <div className="sidebar">
          {/* Dashboard Panel */}
          <div className="panel metrics-panel">
            <div className="panel-header">
              <span>Real-Time Metrics Dashboard</span>
            </div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Inference Steps</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{inferenceSteps}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Percepts</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {world && world.getPercepts(world.agent.x, world.agent.y).breeze && <span className="badge" style={{ background: '#a0d2eb', color: '#0b0c10', fontWeight: 'bold' }}>BREEZE</span>}
                  {world && world.getPercepts(world.agent.x, world.agent.y).stench && <span className="badge" style={{ background: '#80cfa9', color: '#0b0c10', fontWeight: 'bold' }}>STENCH</span>}
                  {world && !world.getPercepts(world.agent.x, world.agent.y).breeze && !world.getPercepts(world.agent.x, world.agent.y).stench && <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa' }}>NONE</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="panel log-panel">
            <div className="panel-header">
              <span>Action Log</span>
              <span className="badge">{logs.length} events</span>
            </div>
            <div className="panel-content logs">
              {logs.map((log, i) => (
                <div key={i} className={`log-entry ${log.includes('Game Over') ? 'log-error' : ''}`}>
                  <span className="log-index">[{i.toString().padStart(3, '0')}]</span> {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          <div className="panel kb-panel">
            <div className="panel-header">
              <span>Knowledge Base (CNF)</span>
              <span className="badge badge-purple">{kbState.length} clauses</span>
            </div>
            <div className="panel-content kb">
              {kbState.map((clause, i) => {
                let type = "normal";
                if (clause.includes('~P_') && clause.includes('~W_')) type = "safe";
                else if (clause.length < 15 && !clause.includes('|')) type = "unit";
                
                return (
                  <div key={i} className={`clause clause-${type}`}>
                    {clause}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
