import { useEffect, useState } from "react";
import { BrainCircuit, Mic, FileText, Code2 } from "lucide-react";
import "./App.css";

// const API = "http://127.0.0.1:8000";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type QuestionResponse = {
  role: string;
  questions: string[];
};

type AnswerEvaluation = {
  question_id: number;
  question: string;
  answer: string;
  score: number;
  word_count: number;
  strengths: string[];
  suggestions: string[];
  breakdown?: {
    completeness: number;
    specificity: number;
    reasoning: number;
  };
  improved_answer_tip?: string;
  sample_answer?: string;
};

interface InterviewReadiness {
  readiness_score: number;
  level: string;
  evaluated_interviews: number;
  average_score?: number;
  latest_score?: number;
  recommendations: string[];
}

type InterviewEvaluation = {
  role: string;
  overall_score: number;
  evaluated_count: number;
  results: AnswerEvaluation[];
  evaluation_method: string;
  notice: string;
};

export default function App() {
  const [status, setStatus] = useState("Checking backend...");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyMessage, setHistoryMessage] = useState("");
  const [historyHasLoaded, setHistoryHasLoaded] = useState(false);

  const [weakSkillData, setWeakSkillData] = useState<any>(null);
  const [weakSkillLoading, setWeakSkillLoading] = useState(false);
  const [weakSkillError, setWeakSkillError] = useState("");

  const [readiness, setReadiness] = useState<InterviewReadiness | null>(null);

  const loadReadiness = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interview/readiness`,
      );

      if (!response.ok) {
        throw new Error("Failed to load interview readiness.");
      }

      const data: InterviewReadiness = await response.json();
      setReadiness(data);
    } catch (error) {
      console.error("Readiness loading failed:", error);
    }
  };

  const handleLoadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interview/history`,
      );

      if (!response.ok) {
        throw new Error("Could not load interview history.");
      }

      const data = await response.json();
      setHistorySessions(Array.isArray(data.sessions) ? data.sessions : []);
      setHistoryHasLoaded(true);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadWeakSkills = async () => {
    setWeakSkillLoading(true);
    setWeakSkillError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/weak-skills`);

      if (!response.ok) {
        throw new Error("Could not load weak-skill analysis.");
      }

      const data = await response.json();
      setWeakSkillData(data);
    } catch (error) {
      setWeakSkillError(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading weak-skill analysis.",
      );
    } finally {
      setWeakSkillLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error("Backend unavailable");
        return response.json();
      })
      .then(() => setStatus("Backend connected"))
      .catch(() => setStatus("Backend offline"));

    fetch(`${API_BASE_URL}/api/questions`)
      .then((response) => response.json())
      .then((data: QuestionResponse) => setQuestions(data.questions))
      .catch(() => setQuestions([]));
    loadReadiness();
  }, []);

  const question = questions[selectedQuestion];

  function nextQuestion() {
    if (selectedQuestion < questions.length - 1) {
      setSelectedQuestion((current) => current + 1);
      setAnswer("");
    }
  }

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeFilename, setResumeFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleResumeUpload() {
    if (!resumeFile) {
      setUploadError("Please select a resume first.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setResumeText("");
    setResumeFilename("");

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const response = await fetch(`${API_BASE_URL}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume upload failed.");
      }

      setResumeText(data.text);
      setResumeFilename(data.filename);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not connect to the backend.",
      );
    } finally {
      setUploading(false);
    }
  }

  type ResumeAnalysis = {
    word_count: number;
    skills: string[];
    sections_detected: string[];
    summary: string;
    interview_focus: string[];
  };

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  async function handleAnalyzeResume() {
    if (!resumeText) {
      setAnalysisError("Upload a resume before analyzing it.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: resumeText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume analysis failed.");
      }

      setAnalysis(data);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Could not analyze the resume.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  type InterviewQuestion = {
    id: number;
    question: string;
  };

  const [targetRole, setTargetRole] = useState("Python Developer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestion[]
  >([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState("");

  const [selectedSkill, setSelectedSkill] = useState("");

  async function handleGenerateQuestions() {
    if (!resumeText || resumeText.trim().length < 20) {
      setQuestionError("Please upload a readable resume first.");
      return;
    }

    setGeneratingQuestions(true);
    setQuestionError("");
    setInterviewQuestions([]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interview/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText,
            role: `${targetRole} — focus on ${selectedSkill || "general interview skills"}`,
            difficulty,
            count: Number(questionCount),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not generate interview questions.",
        );
      }

      setInterviewQuestions(data.questions);
    } catch (error) {
      setQuestionError(
        error instanceof Error
          ? error.message
          : "Could not connect to the backend.",
      );
    } finally {
      setGeneratingQuestions(false);
    }
  }

  // Interview Session

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [interviewFinished, setInterviewFinished] = useState(false);

  const currentQuestion = interviewQuestions[currentQuestionIndex];

  function updateCurrentAnswer(value: string) {
    if (!currentQuestion) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: value,
    }));
  }

  function startInterview() {
    if (interviewQuestions.length === 0) return;

    setCurrentQuestionIndex(0);
    setAnswers({});
    setInterviewFinished(false);
  }

  function goToNextQuestion() {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex((index) => index + 1);
    } else {
      setInterviewFinished(true);
    }
  }

  function goToPreviousQuestion() {
    setCurrentQuestionIndex((index) => Math.max(0, index - 1));
  }

  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(
    null,
  );
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  async function handleEvaluateInterview() {
    if (interviewQuestions.length === 0) return;

    setEvaluating(true);
    setEvaluationError("");
    setEvaluation(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interview/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: targetRole,
            responses: interviewQuestions.map((item) => ({
              question_id: item.id,
              question: item.question,
              answer: answers[item.id] ?? "",
            })),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Interview evaluation failed.");
      }

      setEvaluation(data);
      setHistoryMessage("");

      try {
        const saveResponse = await fetch(
          `${API_BASE_URL}/api/interview/history`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role: targetRole,
              difficulty,
              questions: interviewQuestions,
              answers: interviewQuestions.map((item) => ({
                question_id: item.id,
                question: item.question,
                answer: answers[item.id] ?? "",
              })),
              evaluation: data,
            }),
          },
        );

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();

          console.error("History save failed:", saveResponse.status, errorText);

          throw new Error(
            `Saving failed (${saveResponse.status}): ${errorText}`,
          );
        }

        setHistoryMessage("Interview saved to history successfully.");
        await loadReadiness();
      } catch (error) {
        setHistoryMessage(
          error instanceof Error
            ? error.message
            : "Evaluation completed, but saving failed.",
        );
      }
    } catch (error) {
      setEvaluationError(
        error instanceof Error
          ? error.message
          : "Could not evaluate your interview.",
      );
    } finally {
      setEvaluating(false);
    }
  }

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const handleViewSession = async (sessionId: number) => {
    setSessionLoading(true);
    setSessionError("");
    setSelectedSession(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interview/history/${sessionId}`,
      );

      if (!response.ok) {
        throw new Error("Could not load this interview session.");
      }

      const data = await response.json();
      console.log("Saved interview data:", data);
      console.log("Response keys:", Object.keys(data));
      console.log("Evaluation field:", data.evaluation);
      console.log("Saved evaluation:", data.evaluation);
      console.log("Saved score breakdown:", data.evaluation?.breakdown);
      console.log(
        "First saved evaluation result:",
        data.evaluation?.results?.[0],
      );

      setSelectedSession(data);
      setSelectedSession(data);
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSessionLoading(false);
    }
  };

  const downloadInterviewReport = (session: any) => {
    const evaluation = session.evaluation;
    const results = evaluation?.results ?? [];

    const lines = [
      "InterviewPilot AI - Interview Report",
      "====================================",
      `Role: ${session.role ?? "Not available"}`,
      `Difficulty: ${session.difficulty ?? "Not available"}`,
      `Date: ${
        session.created_at
          ? new Date(session.created_at).toLocaleString()
          : "Not available"
      }`,
      `Overall Score: ${
        session.overall_score ?? evaluation?.overall_score ?? "Not available"
      }/100`,
      "",
      "QUESTIONS AND FEEDBACK",
      "======================",
      "",
    ];

    results.forEach((result: any, index: number) => {
      lines.push(
        `${index + 1}. ${result.question ?? "Question not available"}`,
        "",
        `Your answer: ${result.answer || "No answer provided."}`,
        `Score: ${result.score ?? "Not available"}/100`,
        "",
        "Strengths:",
        ...(result.strengths?.length
          ? result.strengths.map((item: string) => `- ${item}`)
          : ["- No strengths recorded."]),
        "",
        "Suggestions:",
        ...(result.suggestions?.length
          ? result.suggestions.map((item: string) => `- ${item}`)
          : ["- No suggestions recorded."]),
        "",
      );

      if (result.breakdown) {
        lines.push(
          "Score breakdown:",
          `- Completeness: ${result.breakdown.completeness}/40`,
          `- Specificity: ${result.breakdown.specificity}/30`,
          `- Reasoning: ${result.breakdown.reasoning}/30`,
          "",
        );
      }
    });

    if (evaluation?.notice) {
      lines.push("Evaluation notice:", evaluation.notice, "");
    }

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `InterviewPilot-Report-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Dashboard summary values derived from loaded interview history
  const evaluatedSessions = historySessions.filter(
    (session) =>
      session.overall_score !== null &&
      session.overall_score !== undefined &&
      Number.isFinite(Number(session.overall_score)),
  );

  const averageScore =
    evaluatedSessions.length > 0
      ? Math.round(
          evaluatedSessions.reduce(
            (total, session) => total + Number(session.overall_score),
            0,
          ) / evaluatedSessions.length,
        )
      : null;

  const latestSession = [...historySessions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];

  const scoreTrend = [...historySessions]
    .filter(
      (session) =>
        session.overall_score !== null &&
        session.overall_score !== undefined &&
        Number.isFinite(Number(session.overall_score)),
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((session, index) => ({
      session: `Interview ${index + 1}`,
      score: Number(session.overall_score),
      role: session.role,
      date: new Date(session.created_at).toLocaleDateString(),
    }));

  const practiceRecommendations: string[] = [];

  if (evaluatedSessions.length === 0) {
    practiceRecommendations.push(
      "Complete and evaluate a practice interview to get personalized recommendations.",
    );
  } else {
    if (averageScore !== null && averageScore < 60) {
      practiceRecommendations.push(
        "Review the fundamentals and practice answering questions step by step.",
      );
    } else if (averageScore !== null && averageScore < 80) {
      practiceRecommendations.push(
        "Strengthen your answers with clearer explanations and specific examples.",
      );
    } else {
      practiceRecommendations.push(
        "Keep challenging yourself with harder questions and realistic mock interviews.",
      );
    }

    const recentSessions = [...evaluatedSessions]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 3);

    if (recentSessions.length >= 2) {
      const scores = recentSessions.map((session) =>
        Number(session.overall_score),
      );

      if (Math.max(...scores) - Math.min(...scores) >= 20) {
        practiceRecommendations.push(
          "Your recent scores vary considerably. Practice consistently across several sessions.",
        );
      }
    }

    practiceRecommendations.push(
      "Review your previous answers and use the evaluation feedback to improve your next attempt.",
    );
  }

  // Use the 10 most recent evaluated sessions for the chart

  const scoreTrendPoints = scoreTrend
    .map((point, index) => {
      const x =
        scoreTrend.length === 1
          ? 300
          : 40 + (index / (scoreTrend.length - 1)) * 520;

      const y = 170 - (point.score / 100) * 140;

      return `${x},${y}`;
    })
    .join(" ");

  const rankedSkills = [...(weakSkillData?.categories ?? [])].sort(
    (a: any, b: any) => {
      const scoreA = a.average_score ?? a.score;
      const scoreB = b.average_score ?? b.score;

      if (scoreA == null) return scoreB == null ? 0 : 1;
      if (scoreB == null) return -1;

      return Number(scoreA) - Number(scoreB);
    },
  );

  return (
    <main className="app app-container">
      <aside className="sidebar">
        <div className="brand">
          <BrainCircuit size={27} />
          <strong>InterviewPilot AI</strong>
        </div>
        <p className="nav-heading">WORKSPACE</p>
        <p>◈ Dashboard</p>
        <p>
          <Mic size={16} /> Mock interview
        </p>
        <p>
          <FileText size={16} /> Resume analysis
        </p>
        <p>
          <Code2 size={16} /> GitHub projects
        </p>
        <div className="connection">{status}</div>
      </aside>

      <section className="content">
        <header>
          <span>YOUR PERSONAL INTERVIEW COACH</span>
          <h1>Prepare. Practice. Progress.</h1>
          <p>Build confidence with one interview question at a time.</p>
        </header>

        <section className="summary-cards" aria-label="Interview summary">
          <article className="summary-card">
            <span className="summary-label">Total interviews</span>
            <strong className="summary-value">
              {historyHasLoaded ? historySessions.length : "—"}
            </strong>
            <p>
              {historyHasLoaded
                ? "Saved practice sessions"
                : "Load history to see your total"}
            </p>
          </article>

          <article className="summary-card">
            <span className="summary-label">Average score</span>
            <strong className="summary-value">
              {!historyHasLoaded
                ? "—"
                : averageScore !== null
                  ? `${averageScore}/100`
                  : "N/A"}
            </strong>
            <p>Across evaluated sessions</p>
          </article>

          <article className="summary-card">
            <span className="summary-label">Most recent role</span>
            <strong className="summary-value summary-role">
              {!historyHasLoaded
                ? "Not loaded"
                : latestSession?.role || "No sessions yet"}
            </strong>
            <p>
              {latestSession?.created_at
                ? new Date(latestSession.created_at).toLocaleDateString()
                : "Based on saved history"}
            </p>
          </article>

          <article className="summary-card">
            <span className="summary-label">Evaluated sessions</span>
            <strong className="summary-value">
              {historyHasLoaded ? evaluatedSessions.length : "—"}
            </strong>
            <p>Sessions with a recorded score</p>
          </article>
        </section>

        <section className="readiness-card" aria-label="Interview readiness">
          <div className="readiness-header">
            <div>
              <h2>Interview Readiness</h2>
              <p>Track your progress across evaluated interviews.</p>
            </div>

            <span className="readiness-level">
              {readiness?.level ?? "Loading..."}
            </span>
          </div>

          <div className="readiness-score">
            <strong>{readiness ? readiness.readiness_score : "—"}</strong>
            <span>/100</span>
          </div>

          <div
            className="readiness-track"
            role="progressbar"
            aria-label="Interview readiness score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={readiness?.readiness_score ?? 0}
          >
            <div
              className="readiness-fill"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, readiness?.readiness_score ?? 0),
                )}%`,
              }}
            />
          </div>

          <p>Evaluated interviews: {readiness?.evaluated_interviews ?? 0}</p>

          {readiness && (
            <div className="readiness-recommendations">
              <h3>Recommended next steps</h3>

              <ul>
                {readiness.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="performance-section">
          <div className="performance-heading">
            <div>
              <h2>Performance over time</h2>
              <p>Track your scores across your latest evaluated interviews.</p>
            </div>
            <span className="performance-count">
              {historyHasLoaded
                ? `${scoreTrend.length} sessions`
                : "History not loaded"}
            </span>
          </div>

          {!historyHasLoaded ? (
            <p className="chart-empty">
              Load your interview history to see your performance trend.
            </p>
          ) : scoreTrend.length === 0 ? (
            <p className="chart-empty">
              No evaluated sessions yet. Complete and evaluate a practice
              interview to start tracking your scores.
            </p>
          ) : (
            <>
              <div className="score-chart">
                <svg
                  viewBox="0 0 600 210"
                  role="img"
                  aria-label="Interview scores over time, from 0 to 100"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {[30, 65, 100, 135, 170].map((y, index) => (
                    <g key={y}>
                      <line
                        x1="40"
                        y1={y}
                        x2="560"
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4 5"
                      />
                      <text
                        x="30"
                        y={y + 4}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="10"
                      >
                        {[100, 75, 50, 25, 0][index]}
                      </text>
                    </g>
                  ))}

                  {scoreTrend.length > 1 && (
                    <polyline
                      points={scoreTrendPoints}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {scoreTrend.map((point, index) => {
                    const x =
                      scoreTrend.length === 1
                        ? 300
                        : 40 + (index / (scoreTrend.length - 1)) * 520;

                    const y = 170 - (point.score / 100) * 140;

                    return (
                      <g key={`${point.session}-${point.date}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r={5}
                          fill="#a5b4fc"
                          stroke="#0f172a"
                          strokeWidth={2}
                        >
                          <title>
                            {point.role}: {point.score}/100 — {point.date}
                          </title>
                        </circle>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {scoreTrend.length === 1 && (
                <p className="chart-empty">
                  One scored session recorded. Complete another evaluated
                  interview to see a trend.
                </p>
              )}

              <div className="score-trend-list">
                {scoreTrend.map((point) => (
                  <div className="score-trend-item" key={point.session}>
                    <div>
                      <strong>{point.role}</strong>
                      <span>{new Date(point.date).toLocaleDateString()}</span>
                    </div>
                    <strong className="trend-score">{point.score}/100</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="recommendations-section">
          <div className="recommendations-heading">
            <div>
              <h2>Your Practice Plan</h2>
              <p>
                Personalized suggestions based on your interview performance.
              </p>
            </div>
            <span className="recommendations-icon">✦</span>
          </div>

          <div className="recommendations-list">
            {practiceRecommendations.map((recommendation, index) => (
              <div className="recommendation-item" key={index}>
                <span className="recommendation-number">{index + 1}</span>
                <p>{recommendation}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="weak-skills-section">
          <div className="section-heading">
            <div>
              <h2>Weak-Skill Analysis</h2>
              <p>Discover which interview topics need more practice.</p>
            </div>

            <button
              type="button"
              onClick={handleLoadWeakSkills}
              disabled={weakSkillLoading}
            >
              {weakSkillLoading ? "Analyzing..." : "Analyze My Skills"}
            </button>
          </div>

          {weakSkillError && <p className="error-message">{weakSkillError}</p>}

          {weakSkillData && (
            <div className="weak-skills-content">
              {weakSkillData.categories?.length > 0 ? (
                rankedSkills.map((category: any, index: number) => (
                  <div
                    className="weak-skill-card"
                    key={category.category ?? index}
                  >
                    <div className="weak-skill-card-heading">
                      <h3>{category.category}</h3>
                      <strong>
                        {category.average_score ?? category.score ?? "N/A"}
                        {category.average_score != null ||
                        category.score != null
                          ? "%"
                          : ""}
                      </strong>
                    </div>

                    {(category.average_score != null ||
                      category.score != null) && (
                      <div
                        className="skill-score-track"
                        role="progressbar"
                        aria-label={`${category.category} score`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(
                          100,
                          Math.max(
                            0,
                            Number(category.average_score ?? category.score) ||
                              0,
                          ),
                        )}
                      >
                        <div
                          className="skill-score-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                Number(
                                  category.average_score ?? category.score,
                                ) || 0,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    )}

                    {category.question_count != null && (
                      <p className="skill-question-count">
                        Questions analyzed: {category.question_count}
                      </p>
                    )}

                    {category.recommendation && (
                      <p>{category.recommendation}</p>
                    )}

                    <button
                      type="button"
                      disabled={generatingQuestions}
                      onClick={async () => {
                        const categoryName =
                          category.category ?? "General interview skills";

                        if (!resumeText || resumeText.trim().length < 20) {
                          setQuestionError(
                            "Please upload and analyze your resume before practicing a skill.",
                          );
                          return;
                        }

                        setSelectedSkill(categoryName);
                        setGeneratingQuestions(true);
                        setQuestionError("");

                        try {
                          const response = await fetch(
                            `${API_BASE_URL}/api/interview/generate`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                resume_text: resumeText,
                                role: targetRole,
                                difficulty,
                                count: Number(questionCount),
                                focus_category: categoryName,
                              }),
                            },
                          );

                          const data = await response.json();

                          if (!response.ok) {
                            throw new Error(
                              data.detail ||
                                "Could not generate focused questions.",
                            );
                          }

                          setInterviewQuestions(data.questions);
                          setQuestionError("");
                        } catch (error) {
                          setQuestionError(
                            error instanceof Error
                              ? error.message
                              : "Could not connect to the backend.",
                          );
                        } finally {
                          setGeneratingQuestions(false);
                        }
                      }}
                    >
                      {generatingQuestions
                        ? "Generating..."
                        : "Practice This Skill"}
                    </button>
                  </div>
                ))
              ) : (
                <p>
                  {weakSkillData.message ??
                    "Complete and evaluate an interview to see your skill analysis."}
                </p>
              )}
            </div>
          )}

          {!weakSkillData && !weakSkillLoading && !weakSkillError && (
            <p>
              Click “Analyze My Skills” to review your performance by category.
            </p>
          )}
        </section>

        <section className="hero">
          <span className="tag">YOUR NEXT OPPORTUNITY STARTS HERE</span>
          <h2>Walk into your next interview with confidence.</h2>
          <p>
            Practice technical questions and prepare to explain your skills,
            projects, and experience.
          </p>

          <section className="resume-upload">
            <div className="resume-upload-heading">
              <FileText size={26} />
              <div>
                <h2>Upload Your Resume</h2>
                <p>Choose a PDF or DOCX file to get started.</p>
              </div>
            </div>

            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(event) => {
                setResumeFile(event.target.files?.[0] ?? null);
                setUploadError("");
                setResumeText("");
                setResumeFilename("");
              }}
            />

            <button
              type="button"
              onClick={handleResumeUpload}
              disabled={uploading || !resumeFile}
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>

            {uploadError && <p className="upload-error">{uploadError}</p>}

            {resumeFilename && (
              <div className="resume-result">
                <h3>Resume uploaded successfully!</h3>
                <p>File: {resumeFilename}</p>
                <p>Extracted characters: {resumeText.length}</p>

                <button
                  type="button"
                  onClick={handleAnalyzeResume}
                  disabled={analyzing || !resumeText}
                >
                  {analyzing ? "Analyzing..." : "Analyze Resume"}
                </button>

                {analysisError && (
                  <p className="upload-error">{analysisError}</p>
                )}

                {analysis && (
                  <div className="analysis-result">
                    <h3>Resume Analysis</h3>

                    <p>
                      <strong>Word count:</strong> {analysis.word_count}
                    </p>

                    <p>{analysis.summary}</p>

                    <h4>Detected Skills</h4>
                    <div className="skill-tags">
                      {analysis.skills.length > 0 ? (
                        analysis.skills.map((skill) => (
                          <span className="skill-tag" key={skill}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p>No recognized skill keywords were detected.</p>
                      )}
                    </div>

                    <h4>Sections Detected</h4>
                    <div className="skill-tags">
                      {analysis.sections_detected.map((section) => (
                        <span className="skill-tag" key={section}>
                          {section}
                        </span>
                      ))}
                    </div>

                    <h4>Suggested Interview Focus</h4>
                    <ul>
                      {analysis.interview_focus.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <details>
                  <summary>View extracted resume text</summary>
                  <pre>{resumeText}</pre>
                </details>
              </div>
            )}
          </section>

          <button
            onClick={() =>
              document.getElementById("practice")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            Start practicing →
          </button>
        </section>

        <section className="interview-generator">
          <h2>Practice Interview</h2>
          <p>
            Generate practice questions for your target job using your uploaded
            resume.
          </p>

          <label htmlFor="target-role">Target job role</label>
          <input
            id="target-role"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="e.g. Python Developer"
            maxLength={100}
          />

          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <label htmlFor="question-count">Number of questions</label>
          <select
            id="question-count"
            value={questionCount}
            onChange={(event) => setQuestionCount(event.target.value)}
          >
            <option value="3">3 questions</option>
            <option value="5">5 questions</option>
            <option value="7">7 questions</option>
          </select>

          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={generatingQuestions || !resumeText || !targetRole.trim()}
          >
            {generatingQuestions
              ? "Generating..."
              : "Generate Interview Questions"}
          </button>

          {questionError && <p className="upload-error">{questionError}</p>}

          {interviewQuestions.length > 0 && (
            <div className="question-list">
              <h3>
                {targetRole} — {difficulty} Questions
              </h3>

              {interviewQuestions.map((item) => (
                <article className="question-card" key={item.id}>
                  <span>Question {item.id}</span>
                  <p>{item.question}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="live-interview">
          <h2>Interview Session</h2>
          <p>Practice answering your generated questions one at a time.</p>

          {interviewQuestions.length === 0 ? (
            <p>Generate interview questions first to start a session.</p>
          ) : interviewFinished ? (
            <div className="interview-review">
              <h3>Interview Complete!</h3>
              <p>
                You answered {interviewQuestions.length} questions. Review your
                answers below.
              </p>

              {interviewQuestions.map((item) => (
                <article className="answer-review" key={item.id}>
                  <h4>Question {item.id}</h4>
                  <p>{item.question}</p>
                  <p>
                    <strong>Your answer:</strong>
                  </p>
                  <p className="review-answer">
                    {answers[item.id]?.trim() || "No answer provided."}
                  </p>
                </article>
              ))}

              <button type="button" onClick={startInterview}>
                Restart Interview
              </button>

              <button
                type="button"
                onClick={handleEvaluateInterview}
                disabled={evaluating}
              >
                {evaluating ? "Evaluating..." : "Evaluate My Answers"}
              </button>

              {evaluationError && (
                <p className="upload-error">{evaluationError}</p>
              )}

              {evaluation && (
                <div className="evaluation-results">
                  <h3>Interview Feedback</h3>

                  <div className="overall-score">
                    <span>Preliminary score</span>
                    <strong>{evaluation.overall_score}/100</strong>
                  </div>

                  <p>
                    Evaluated {evaluation.evaluated_count} answers for{" "}
                    {evaluation.role}.
                  </p>

                  <p className="evaluation-notice">{evaluation.notice}</p>

                  {evaluation.results.map((result) => (
                    <article
                      className="evaluation-card"
                      key={result.question_id}
                    >
                      <h4>
                        Question {result.question_id} — {result.score}/100
                      </h4>

                      <p>{result.question}</p>

                      {result.improved_answer_tip && (
                        <div className="improved-answer-tip">
                          <h5>How to Strengthen Your Answer</h5>
                          <p>{result.improved_answer_tip}</p>
                        </div>
                      )}

                      {result.sample_answer && (
                        <div className="sample-answer">
                          <h5>Example Improvement Guide</h5>
                          <p style={{ whiteSpace: "pre-line" }}>
                            {result.sample_answer}
                          </p>
                        </div>
                      )}

                      {result.breakdown && (
                        <div className="evaluation-breakdown">
                          <h5>Score Breakdown</h5>

                          {(
                            [
                              [
                                "Completeness",
                                result.breakdown.completeness,
                                40,
                              ],
                              ["Specificity", result.breakdown.specificity, 30],
                              ["Reasoning", result.breakdown.reasoning, 30],
                            ] as const
                          ).map(([label, score, maximum]) => (
                            <div className="breakdown-item" key={label}>
                              <div className="breakdown-label">
                                <span>{label}</span>
                                <strong>
                                  {score}/{maximum}
                                </strong>
                              </div>

                              <div className="breakdown-track">
                                <div
                                  className="breakdown-fill"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, (score / maximum) * 100),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <h5>What went well</h5>
                      {result.strengths.length > 0 ? (
                        <ul>
                          {result.strengths.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No strengths identified yet.</p>
                      )}

                      <h5>How to improve</h5>
                      <ul>
                        {result.suggestions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="interview-progress">
                Question {currentQuestionIndex + 1} of{" "}
                {interviewQuestions.length}
              </div>

              <div className="current-question">
                <h3>{currentQuestion?.question}</h3>
              </div>

              <label htmlFor="interview-answer">Your answer</label>
              <textarea
                id="interview-answer"
                rows={7}
                value={answers[currentQuestion.id] ?? ""}
                onChange={(event) => updateCurrentAnswer(event.target.value)}
                placeholder="Explain your approach, give examples, and describe your reasoning..."
              />

              <div className="interview-actions">
                <button
                  type="button"
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </button>

                {currentQuestionIndex === interviewQuestions.length - 1 ? (
                  <button type="button" onClick={goToNextQuestion}>
                    Finish Interview
                  </button>
                ) : (
                  <button type="button" onClick={goToNextQuestion}>
                    Next Question
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        <div className="cards">
          <article>
            <BrainCircuit />
            <span>AI Interview Coach</span>
          </article>
          <article>
            <FileText />
            <span>Resume Insights</span>
          </article>
          <article>
            <Code2 />
            <span>GitHub Projects</span>
          </article>
        </div>

        <section className="history-section">
          <h2>Interview History</h2>
          <p>Review your previous practice sessions.</p>

          <button
            type="button"
            onClick={handleLoadHistory}
            disabled={historyLoading}
          >
            {historyLoading ? "Loading..." : "Load Interview History"}
          </button>

          {historyMessage && <p>{historyMessage}</p>}
          {historyError && <p>{historyError}</p>}

          {historySessions.length === 0 && !historyLoading && (
            <p>
              No history loaded yet. Click the button to check saved sessions.
            </p>
          )}

          {historySessions.map((session) => (
            <div key={session.id} className="history-card">
              <h3>{session.role}</h3>
              <p>Difficulty: {session.difficulty}</p>
              <p>Date: {new Date(session.created_at).toLocaleString()}</p>
              <p>
                Score:{" "}
                {session.overall_score != null
                  ? `${session.overall_score}/100`
                  : "Not available"}
              </p>
              <button
                type="button"
                onClick={() => handleViewSession(session.id)}
                disabled={sessionLoading}
              >
                View Interview
              </button>
            </div>
          ))}

          {sessionError && <p className="error-message">{sessionError}</p>}

          {selectedSession && (
            <section className="saved-session-details">
              <div className="saved-session-header">
                <h2>Interview Details</h2>

                <div className="saved-session-actions">
                  <button
                    type="button"
                    onClick={() => downloadInterviewReport(selectedSession)}
                  >
                    Download Report
                  </button>

                  <button type="button" onClick={() => window.print()}>
                    Export PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSession(null)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <p>
                <strong>Role:</strong> {selectedSession.role ?? "Not available"}
              </p>

              <p>
                <strong>Difficulty:</strong>{" "}
                {selectedSession.difficulty ?? "Not available"}
              </p>

              <p>
                <strong>Overall Score:</strong>{" "}
                {selectedSession.overall_score != null
                  ? `${selectedSession.overall_score}/100`
                  : "Not available"}
              </p>

              <h3>Questions and Answers</h3>

              {Array.isArray(selectedSession.questions) &&
              selectedSession.questions.length > 0 ? (
                selectedSession.questions.map((item: any, index: number) => (
                  <article
                    className="saved-question-card"
                    key={item.question_id ?? item.id ?? index}
                  >
                    <h4>Question {index + 1}</h4>

                    <p>
                      {typeof item === "string"
                        ? item
                        : (item.question ?? "Question not available")}
                    </p>

                    <h4>Your Answer</h4>

                    <p>
                      {typeof item.answer === "string"
                        ? item.answer
                        : typeof selectedSession.answers?.find?.(
                              (answer: any) =>
                                answer.question_id === item.id ||
                                answer.question_id === item.question_id,
                            )?.answer === "string"
                          ? selectedSession.answers.find(
                              (answer: any) =>
                                answer.question_id === item.id ||
                                answer.question_id === item.question_id,
                            )?.answer
                          : "No saved answer available"}
                    </p>
                  </article>
                ))
              ) : (
                <p>No saved questions were returned for this interview.</p>
              )}

              {selectedSession.evaluation && (
                <>
                  {Array.isArray(selectedSession.evaluation?.results) &&
                    selectedSession.evaluation.results.some(
                      (result: any) => result.breakdown,
                    ) && (
                      <div className="saved-score-breakdown">
                        <h3>Score Breakdown</h3>

                        {selectedSession.evaluation.results.map(
                          (result: any) =>
                            result.breakdown ? (
                              <div key={result.question_id}>
                                <h4>Question {result.question_id}</h4>
                                <p>
                                  Completeness: {result.breakdown.completeness}
                                  /40
                                </p>
                                <p>
                                  Specificity: {result.breakdown.specificity}/30
                                </p>
                                <p>
                                  Reasoning: {result.breakdown.reasoning}/30
                                </p>
                              </div>
                            ) : null,
                        )}
                      </div>
                    )}

                  {evaluation && (
                    <div className="evaluation-feedback">
                    <h3>Evaluation Feedback</h3>
                    <p>
                      <strong>Role:</strong>{" "}
                      {evaluation?.role ?? "Not available"}
                    </p>

                    <p>
                      <strong>Overall Score:</strong>{" "}
                      {evaluation?.overall_score ?? "Not available"} / 100
                    </p>

                    <p>
                      <strong>Questions Evaluated:</strong>{" "}
                      {evaluation?.evaluated_count ?? 0}
                    </p>

                    {evaluation?.results?.map((result: any) => (
                      <div
                        className="evaluation-result"
                        key={result.question_id}
                      >
                        <h4>Question {result.question_id}</h4>
                        <p>
                          <strong>Question:</strong> {result.question}
                        </p>
                        <p>
                          <strong>Your answer:</strong>{" "}
                          {result.answer || "No answer provided."}
                        </p>
                        <p>
                          <strong>Score:</strong> {result.score}/100
                        </p>

                        <h5>Strengths</h5>
                        {result.strengths?.length ? (
                          <ul>
                            {result.strengths.map(
                              (item: string, index: number) => (
                                <li key={index}>{item}</li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <p>Keep practising to develop stronger answers.</p>
                        )}

                        <h5>Suggestions</h5>
                        <ul>
                          {result.suggestions?.map(
                            (item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ),
                          )}
                        </ul>

                        {result.breakdown && (
                          <div>
                            <h5>Score Breakdown</h5>
                            <p>
                              Completeness: {result.breakdown.completeness}/40
                            </p>
                            <p>
                              Specificity: {result.breakdown.specificity}/30
                            </p>
                            <p>Reasoning: {result.breakdown.reasoning}/30</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {evaluation?.notice && (
                      <p className="evaluation-notice">{evaluation.notice}</p>
                    )}
                  </div>)}
                </>
              )}
            </section>
          )}
        </section>

        {sessionLoading && <p>Loading interview details...</p>}

        {sessionError && <p>{sessionError}</p>}

        {selectedSession && (
          <section className="session-details">
            <h2>Interview Review</h2>

            <p>
              <strong>Role:</strong> {selectedSession.role}
            </p>

            <p>
              <strong>Difficulty:</strong> {selectedSession.difficulty}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(selectedSession.created_at).toLocaleString()}
            </p>

            <h3>Questions and Your Answers</h3>

            {selectedSession.questions.map((question: any) => (
              <div key={question.id}>
                <p>
                  <strong>Question {question.id}:</strong> {question.question}
                </p>

                <p>
                  <strong>Your answer:</strong>{" "}
                  {Array.isArray(selectedSession.answers)
                    ? (selectedSession.answers.find(
                        (answer: any) =>
                          String(answer.question_id) === String(question.id),
                      )?.answer ?? "No answer recorded.")
                    : (selectedSession.answers?.[String(question.id)] ??
                      "No answer recorded.")}
                </p>
              </div>
            ))}

            {selectedSession.evaluation && (
              <>
                <h3>Evaluation</h3>

                <p>
                  <strong>Overall score:</strong>{" "}
                  {selectedSession.evaluation.overall_score}/100
                </p>

                {selectedSession.evaluation.results?.map(
                  (result: any, index: number) => (
                    <div key={index}>
                      <p>
                        <strong>Question score:</strong> {result.score}
                      </p>

                      {result.strengths?.length > 0 && (
                        <>
                          <strong>Strengths</strong>
                          <ul>
                            {result.strengths.map(
                              (strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ),
                            )}
                          </ul>
                        </>
                      )}

                      {result.suggestions?.length > 0 && (
                        <>
                          <strong>Suggestions</strong>
                          <ul>
                            {result.suggestions.map(
                              (suggestion: string, i: number) => (
                                <li key={i}>{suggestion}</li>
                              ),
                            )}
                          </ul>
                        </>
                      )}
                    </div>
                  ),
                )}
              </>
            )}

            <button type="button" onClick={() => setSelectedSession(null)}>
              Close Review
            </button>
          </section>
        )}

        <section className="practice" id="practice">
          <h2>Python Developer Practice</h2>
          <p className="muted">
            Question {questions.length ? selectedQuestion + 1 : 0} of{" "}
            {questions.length}
          </p>

          {question ? (
            <>
              <h3>{question}</h3>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Write your answer here..."
                rows={5}
              />
              <button
                disabled={
                  !answer.trim() || selectedQuestion === questions.length - 1
                }
                onClick={nextQuestion}
              >
                Next question →
              </button>
              <p className="muted">
                Your answer is not yet submitted or saved. We'll add AI
                evaluation and database persistence in the next phase.
              </p>
            </>
          ) : (
            <p>Connect the backend to load practice questions.</p>
          )}
        </section>
      </section>
    </main>
  );
}
