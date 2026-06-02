"""Run once to populate the DB with sample quizzes: uv run python seed.py"""
import requests

BASE = "http://localhost:8000"

quizzes = [
    {
        "title": "JavaScript Basics",
        "description": "Test your knowledge of JS fundamentals",
        "questions": [
            {"text": "What does typeof null return?", "options": ["null", "object", "undefined", "string"], "correct_index": 1},
            {"text": "Which method removes the last element of an array?", "options": ["shift()", "pop()", "splice()", "slice()"], "correct_index": 1},
            {"text": "What is the output of 0.1 + 0.2 === 0.3 in JS?", "options": ["true", "false", "NaN", "undefined"], "correct_index": 1},
            {"text": "Which keyword declares a block-scoped variable?", "options": ["var", "let", "function", "static"], "correct_index": 1},
            {"text": "What does === check?", "options": ["Value only", "Type only", "Value and type", "Reference"], "correct_index": 2},
        ],
    },
    {
        "title": "Python Fundamentals",
        "description": "Core Python concepts",
        "questions": [
            {"text": "What is the output of type([]) in Python?", "options": ["<class list>", "<class array>", "list", "array"], "correct_index": 0},
            {"text": "Which of these creates a tuple?", "options": ["[1, 2]", "{1, 2}", "(1, 2)", "<1, 2>"], "correct_index": 2},
            {"text": "What does len(\"hello\") return?", "options": ["4", "5", "6", "Error"], "correct_index": 1},
        ],
    },
]

for q in quizzes:
    r = requests.post(f"{BASE}/api/quizzes", json=q)
    print(r.status_code, r.json()["title"])
