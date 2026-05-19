import json
import os
import time
from typing import Any, Dict

from services.errors import ServiceError
from services.gemini_service import generate_quiz_questions


def normalize_quiz_items(items: list, difficulty: str) -> list:
    normalized = []
    for item in items:
        if not isinstance(item, dict):
            continue
        question = item.get("question")
        answer = item.get("answer")
        if not question or not answer:
            continue
        normalized.append(
            {
                "question": question,
                "answer": answer,
                "type": item.get("type", "short_answer"),
                "difficulty": item.get("difficulty", difficulty),
                "explanation": item.get("explanation", ""),
                "options": item.get("options", []),
            }
        )
    return normalized


def generate_quiz_items(text: str, difficulty: str, min_questions: int = 10) -> list[dict[str, Any]]:
    quiz_items = generate_quiz_questions(text, difficulty)
    quiz_items = normalize_quiz_items(quiz_items, difficulty)
    if len(quiz_items) < min_questions:
        raise ServiceError("Gemini did not return enough questions.", status_code=502)
    return quiz_items[:min_questions]


def save_generated_quiz_file(upload_id: str, subject: str, quiz_items: list, output_folder: str) -> str:
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    quiz_id = f"quiz_{upload_id}_{timestamp}"
    os.makedirs(output_folder, exist_ok=True)
    quiz_path = os.path.join(output_folder, f"{quiz_id}.json")
    payload = {
        "subject": subject,
        "timestamp": timestamp,
        "questions": quiz_items,
    }
    with open(quiz_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    return quiz_id


def update_score_state(score_state: Dict[str, Dict[str, int]], session_id: str, is_correct: bool) -> Dict[str, int]:
    state = score_state.setdefault(session_id, {"correct": 0, "total": 0})
    state["total"] += 1
    if is_correct:
        state["correct"] += 1
    return state
