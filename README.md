# InterviewPilot AI

An AI-assisted interview practice application that helps users prepare for job interviews using resume-based questions, answer evaluation, skill analysis, and interview performance tracking.

## ✨ Features

- **Resume Upload and Analysis:** Upload PDF or DOCX resumes and extract relevant skills and information.
- **Interview Question Generation:** Generate practice questions based on the candidate's resume, target role, difficulty level, and selected skill.
- **Interactive Interview Practice:** Navigate through questions and record answers.
- **Answer Evaluation:** Receive heuristic scores, strengths, suggestions, and score breakdowns for completeness, specificity, and reasoning.
- **Interview History:** Save and review previous interview sessions.
- **Performance Dashboard:** Track interview scores, readiness estimates, and weak skill categories.
- **Skill-Based Practice:** Generate additional questions focused on skills that need improvement.
- **Downloadable Reports:** Download interview feedback as a text report or print the saved interview as a PDF.

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Python
- FastAPI
- SQLite

### Resume Processing
- PyMuPDF (`fitz`) for PDF extraction
- `python-docx` for DOCX extraction

## 📁 Project Structure

```text
interviewpilot-ai/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── tests/
│       └── test_api.py
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## 📋 Prerequisites

- Python 3.10 or a compatible version supported by the installed dependencies
- Node.js and npm
- Git (optional)

## 🚀 Getting Started

### 1. Run the Backend

Open PowerShell and execute the following commands:

```powershell
cd E:\Projects\interviewpilot-ai\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

The backend will be available at:

- **Backend API:** `http://127.0.0.1:8000`
- **Interactive API Documentation:** `http://127.0.0.1:8000/docs`

### 2. Run the Frontend

Open a second PowerShell terminal and execute:

```powershell
cd E:\Projects\interviewpilot-ai\frontend
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173`

## ⚠️ Evaluation Limitations

The current answer evaluator uses local heuristic scoring based on answer completeness, specificity indicators, and reasoning indicators. It does not independently verify factual correctness or fully understand the relevance of every answer.

Readiness scores and recommendations should therefore be treated as practice guidance, not a definitive measure of job readiness.

## 🔮 Future Improvements

- More context-aware answer evaluation using a language model
- Improved report formatting
- User authentication and individual profiles
- Additional automated tests
- Deployment for public access
