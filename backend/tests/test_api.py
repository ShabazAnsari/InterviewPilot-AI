
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200


def test_health_endpoint():
    response = client.get("/api/health")

    assert response.status_code == 200


def test_questions_endpoint():
    response = client.get("/api/questions")

    assert response.status_code == 200


def test_generate_interview_questions():
    response = client.post(
        "/api/interview/generate",
        json={
            "resume_text": (
                "Python developer with experience in Python, "
                "FastAPI, SQL, REST APIs, and backend development."
            ),
            "role": "Python Developer",
            "difficulty": "Medium",
            "count": 3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) == 3



def test_evaluate_answer():
    response = client.post(
        "/api/interview/evaluate",
        json={
            "role": "Python Developer",
            "responses": [
                {
                    "question_id": "1",
                    "question": "Explain how a Python dictionary works.",
                    "answer": (
                        "A dictionary stores key-value pairs. "
                        "It allows values to be retrieved using keys."
                    ),
                }
            ],
        },
    )
    print("Validation error:", response.json())
    assert response.status_code == 200

    data = response.json()
    assert data["role"] == "Python Developer"
    assert data["evaluated_count"] == 1
    assert len(data["results"]) == 1
    assert "score" in data["results"][0]


def test_generate_questions_rejects_invalid_count():
    response = client.post(
        "/api/interview/generate",
        json={
            "resume_text": (
                "Python developer experienced in Python, FastAPI, "
                "SQL, REST APIs, and backend development."
            ),
            "role": "Python Developer",
            "difficulty": "Medium",
            "count": 20,
        },
    )

    assert response.status_code == 422


def test_evaluate_answer_rejects_missing_role():
    response = client.post(
        "/api/interview/evaluate",
        json={
            "responses": [
                {
                    "question_id": 1,
                    "question": "Explain Python dictionaries.",
                    "answer": "They store key-value pairs.",
                }
            ],
        },
    )

    assert response.status_code == 422



def test_interview_history_endpoint():
    response = client.get("/api/interview/history")

    assert response.status_code == 200

    data = response.json()
    assert "sessions" in data
    assert isinstance(data["sessions"], list)


def test_get_saved_interview_details():
    history_response = client.get("/api/interview/history")

    assert history_response.status_code == 200

    sessions = history_response.json()["sessions"]
    assert len(sessions) > 0, "No saved interviews found to test."

    session_id = sessions[0]["id"]

    detail_response = client.get(
        f"/api/interview/history/{session_id}"
    )

    assert detail_response.status_code == 200

    data = detail_response.json()
    assert data["id"] == session_id
    assert "role" in data
    assert "questions" in data
    assert "answers" in data


def test_save_and_retrieve_interview():
    payload = {
        "role": "Automated Test Developer",
        "difficulty": "Easy",
        "questions": [
            {
                "id": 1,
                "question": "What is a Python list?",
            }
        ],
        "answers": [
            {
                "question_id": 1,
                "question": "What is a Python list?",
                "answer": "A list is an ordered collection of items.",
            }
        ],
        "evaluation": None,
    }

    save_response = client.post(
        "/api/interview/history",
        json=payload,
    )

    assert save_response.status_code == 200

    saved_data = save_response.json()
    assert "id" in saved_data
    assert saved_data["message"] == "Interview session saved."

    session_id = saved_data["id"]

    detail_response = client.get(
        f"/api/interview/history/{session_id}"
    )

    assert detail_response.status_code == 200

    detail = detail_response.json()
    assert detail["id"] == session_id
    assert detail["role"] == payload["role"]
    assert detail["difficulty"] == payload["difficulty"]
    assert detail["questions"] == payload["questions"]
    assert detail["answers"] == payload["answers"]
    assert detail["evaluation"] is None
