# Quest Dashboard

A visualization dashboard for the Quest system — an AI-powered planning engine that turns project specs into verified, machine-executable, parallelized mission plans.

## What is Quest?

Quest is a planning engine, not an execution engine. Given a spec and a codebase, it produces conflict-free, dependency-ordered, machine-verifiable mission plans that converge reliably. It operates through a 5-phase pipeline:

1. **Init** — Validate the spec and index the codebase
2. **Analyze** — Specialist agents produce structured findings per requirement
3. **Plan** — Generate structured YAML missions with file ownership, DAG ordering, and acceptance criteria
4. **Execute** — Run missions via Ralph loops (independent processes with retry logic)
5. **Verify & Ship** — Agent review, full test suite, drift detection, and PR generation

## What the Dashboard Shows

This dashboard visualizes the Quest pipeline and its core concepts through interactive components:

- **Pipeline Visualizer** — The 5-phase flow with validation gates between each phase
- **Mission Control** — Mission status tracking, progress, and lifecycle management
- **DAG Visualizer** — Dependency graph of missions showing execution order and parallelism
- **Requirement Matrix** — Per-requirement coverage status with evidence and confidence
- **Gap Analysis** — Gaps between spec requirements and current implementation
- **Drift Detection** — Monitors for file changes that conflict across missions
- **Verification Gates** — Hard validation checkpoints between phases
- **Mission YAML** — Structured mission format with file ownership and acceptance criteria
- **Agent Config Panel** — Specialist agent configuration and roles
- **Terminal Simulator** — Live output simulation of quest CLI commands

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Framer Motion 12

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Build

```bash
npm run build
```
