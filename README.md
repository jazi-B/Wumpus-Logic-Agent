# 🤖 Dynamic Wumpus Logic Agent

A high-performance, Knowledge-Based Agent that navigates a hazardous grid using **Propositional Logic** and **Resolution Refutation**. Built for the AI Assignment at the National University of Computer & Emerging Sciences.

## 🌟 Features

- **Dynamic Environment**: User-defined grid dimensions (Rows × Columns) with procedurally generated hazards.
- **Advanced Inference Engine**: Implements a custom Resolution Refutation algorithm to deduce safe cells.
- **Real-Time Metrics**: Live tracking of inference steps and computational complexity.
- **Modern UI/UX**: A premium, glassmorphic dashboard built with React and Vanilla CSS.
- **Intelligent Exploration**: The agent only moves to cells proven to be safe, handling complex backtracking and frontier evaluation.

## 🧠 Logic & Inference

### Knowledge Base (KB)
The agent maintains a KB in **Conjunctive Normal Form (CNF)**. It stores:
1. **Global Rules**: Such as "At most one Wumpus" and "Breeze ⇔ Pit in adjacent cells."
2. **Dynamic Percepts**: Every time the agent moves, it `TELL`s the KB about new breezes or stenches.

### Resolution Refutation
To prove a cell $(x, y)$ is safe, the agent performs two proofs:
1. **Goal**: Prove $\neg P_{x,y}$ (No Pit)
   - Negate the goal: $P_{x,y}$
   - Add $P_{x,y}$ to the KB.
   - Perform resolution to find an empty clause ($\square$).
2. **Goal**: Prove $\neg W_{x,y}$ (No Wumpus)
   - Follow the same refutation process.

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Logic**: Custom Propositional Logic Engine (JavaScript)
- **Styling**: Vanilla CSS (Modern Design System)

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## 📊 Evaluation Metrics
The dashboard provides a real-time "Inference Steps" metric, showing the depth of the resolution search for every movement. This demonstrates the efficiency of the **Unit Preference Heuristic** implemented in the solver.
