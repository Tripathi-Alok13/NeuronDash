# NeuronDash

NeuronDash is an AI-powered data diagnostics and interactive reporting dashboard platform. It helps users clean, analyze, visualize, and query datasets in real-time using modern, high-fidelity widgets and an integrated conversational LLM assistant.

---

## 🏗️ Repository Architecture

This is a monorepo containing both the frontend client and the backend server services:

```text
├── client/                     # Next.js (React) Web Application
│   ├── src/app/                # App router (Landing page, Login/Signup, Workspace)
│   ├── public/                 # Brand SVG/PNG logo assets & icons
│   └── package.json            # Node.js dependencies (TailwindCSS, Lucide, Recharts)
│
├── server/                     # FastAPI (Python) API Server
│   ├── app/
│   │   ├── api/                # API router endpoints (datasets, dashboards, chat)
│   │   ├── core/               # Configuration settings
│   │   └── services/           # Data cleaner pipelines, chart generators, AI assistant
│   ├── main.py                 # FastAPI application entrypoint
│   └── requirements.txt        # Python package dependencies
│
└── scratch/                    # Developer test scripts and verification utilities
```

---

## ✨ Key Features

1. **AI-Powered Data Diagnostics**: Automatically scan uploaded datasets (CSV, Excel, Word, PDF) to detect missing values, calculate data completeness, analyze types, and identify outliers.
2. **Interactive Visualizer**: Dynamic layout support for 8 distinct chart types (Bar, Line, Pie, Radar, Scatter, Area, Heatmap, and Treemap) with custom theme support.
3. **Conversational AI Chat**: Context-aware LLM chatbot helper capable of querying, summarizing, and aggregate-analyzing columns dynamically using recent history context.
4. **Interactive Bento Grid Dashboards**: Preconfigured bento widget layouts detailing key performance indicator metric changes, averages, and statistical breakdowns.
5. **Dynamic Theme Switcher**: Full support for system and user-toggled Light Mode and Dark Mode across all components.
6. **Detailed PDF Export**: One-click, styled report rendering formatting tables and charts for printing or exporting.

---

## 🚀 Quick Start Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Run the Backend API Server
Navigate to the `server/` directory, set up your virtual environment, and install dependencies:
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Launch the FastAPI application:
```bash
uvicorn main:app --reload --port 8000
```
The backend API documentation will be available at `http://localhost:8000/docs`.

### 2. Run the Frontend Web Client
Navigate to the `client/` directory and install dependencies:
```bash
cd client
npm install
```

Launch the Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🔒 Security & Data Hygiene
- All dataset processing is done locally or configured securely via sandboxed Python pipelines.
- API keys (OpenAI / Anthropic) are loaded dynamically from user credentials securely stored inside `localStorage` in the browser or via server environment variables, never hardcoded.
