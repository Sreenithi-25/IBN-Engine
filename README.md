# IBN Engine
**Intent-Based Networking System — Next Generation Networks**

IBN Engine is an enterprise-grade network policy automation platform that allows administrators to manage network rules using plain English commands. By leveraging a Large Language Model (LLaMA 3.3 70B) as its core inference engine, it translates natural language intents into structured, enforceable network policies across multiple semantic dimensions — action classification, time-based enforcement, priority resolution, and device targeting — to produce a fully automated policy directive.

---

## Architecture

The system is fully decoupled into a high-performance Python AI backend and a modern React frontend dashboard.

### 1. Intent Parser (`intent_parser.py`)

Instead of relying on manual rule configuration, IBN Engine passes natural language through an LLM inference pipeline:

- **Action Classification**: Identifies the policy action (block, allow, limit) from the user's intent.
- **Target Extraction**: Resolves the specific host, domain, or device the policy applies to.
- **Temporal Parsing**: Extracts time-based restrictions (start time, end time) from natural language expressions like "between 9am and 5pm".
- **Priority Inference**: Determines policy urgency (high, medium, low) based on contextual signals in the input.

The results are synthesized by the Groq inference API using the LLaMA 3.3 70B model and returned as a structured JSON policy object.

### 2. Rule Engine (`rule_engine.py`)

A confidence-aware policy enforcement engine that manages the full lifecycle of network directives:

- Stores active policies in an in-memory policy store with unique IDs and timestamps
- Evaluates traffic requests against active policies using time-window matching
- Resolves conflicts between overlapping policies using priority-based ordering
- Optionally pushes real enforcement rules to the Windows Firewall via `netsh` commands
- Resolves domain names to IP addresses using Python's socket library for firewall rule accuracy

### 3. API Layer (`app.py`)

A minimal Flask application that routes intent payloads to the inference engine, manages policy CRUD operations, and serves the frontend via five REST endpoints.

### 4. Client Interface (`App.js` + `App.css`)

A standalone React 18 frontend utilizing a clean Ice Cold design language (white background, electric blue accents, DM Sans typography), real-time policy updates via Axios, and a live activity log with animated analytics.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Free Groq API key from [console.groq.com](https://console.groq.com)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Sreenithi-25/IBN-Engine.git
   cd IBN-Engine
   ```

2. Install Python dependencies:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install flask flask-cors groq python-dotenv
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Create a `.env` file inside the `backend` folder:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

### Running the Application

1. Start the Flask backend server:
   ```bash
   cd backend
   venv\Scripts\activate
   python app.py
   ```

2. Start the React frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to:
   **http://localhost:3000**

*(Note: The Groq API handles LLM inference remotely via the free tier. No local model download is required.)*

---

## Project Structure

```text
ibn-engine/
├── backend/
│   ├── app.py                 # Flask REST API — 5 endpoints
│   ├── intent_parser.py       # LLM-powered NLP intent parser
│   ├── rule_engine.py         # Policy storage and enforcement engine
│   ├── test_api.py            # API test script
│   └── .env                   # API keys (not committed)
└── frontend/
    └── src/
        ├── App.js             # Main React dashboard component
        ├── App.css            # Ice Cold theme stylesheet
        └── index.js           # React entry point
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/intent` | Parse plain English intent and create policy |
| `GET` | `/api/policies` | Retrieve all active policies |
| `DELETE` | `/api/policies/<id>` | Remove a policy by ID |
| `POST` | `/api/check` | Check if a target host is blocked or allowed |
| `GET` | `/api/topology` | Get simulated network device topology |


---

## NGN Concepts Demonstrated

| Concept | Implementation |
|---------|----------------|
| **Intent-Based Networking (IBN)** | Core feature — natural language to machine policy |
| **Software Defined Networking (SDN)** | Policies software-defined, decoupled from hardware |
| **Network Automation** | Zero manual configuration, fully AI-driven |
| **AI/ML in Networks** | LLM (LLaMA 3.3 70B) for semantic NLP parsing |
| **Network Virtualization** | Simulated topology with 4 virtual devices |
| **Policy-Based Management** | Priority-based conflict resolution in rule engine |

---

## Features

- Natural language intent parsing via LLaMA 3.3 70B
- Three policy actions: BLOCK, ALLOW, LIMIT
- Time-based enforcement with start and end time scheduling
- Device-specific policy targeting
- Real-time traffic inspection
- Live analytics dashboard with bar charts
- Activity log with timestamped entries
- Export policies as `.txt` file
- Optional Windows Firewall integration via `netsh`
- Ice Cold UI theme with DM Sans typography

---

## License & Privacy

This application uses the Groq API for LLM inference. Text inputs are sent to Groq's servers for processing. No policy data is stored permanently — all policies are held in memory and cleared on server restart. No third-party analytics or tracking is used.

---
