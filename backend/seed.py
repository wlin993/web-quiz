"""Seed sample quizzes into the DB: uv run python seed.py"""
import yaml
import requests
from pathlib import Path

BASE = "http://localhost:8000"

paths = sorted(Path("quizzes").glob("*.yaml"))
if not paths:
    print("No YAML files found in quizzes/")
    raise SystemExit(1)

print("Available quizzes:")
for i, p in enumerate(paths, 1):
    quiz = yaml.safe_load(p.read_text())
    print(f"  {i}) {quiz['title']}")

print("\nEnter numbers to seed (e.g. 1 3 5), or press Enter for all:")
raw = input("> ").strip()

if raw:
    indices = []
    for token in raw.split():
        if not token.isdigit() or not (1 <= int(token) <= len(paths)):
            print(f"Invalid selection: {token}")
            raise SystemExit(1)
        indices.append(int(token) - 1)
    selected = [paths[i] for i in indices]
else:
    selected = paths

print()
for path in selected:
    quiz = yaml.safe_load(path.read_text())
    payload = {
        "title": quiz["title"],
        "description": quiz.get("description", ""),
        "questions": [],
    }
    for q in quiz["questions"]:
        options = [str(o) for o in q["options"]]
        correct = str(q["correct"])
        if correct not in options:
            raise ValueError(f"{path.name}: correct '{correct}' not in options {options}")
        payload["questions"].append({
            "text": q["text"],
            "options": options,
            "correct_index": options.index(correct),
        })
    r = requests.post(f"{BASE}/api/quizzes", json=payload)
    print(f"  {r.status_code} {r.json()['title']}")
