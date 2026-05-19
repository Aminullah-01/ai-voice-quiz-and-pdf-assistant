import json
import os
import re
from typing import Any, Dict, List

from dotenv import load_dotenv
from google import genai

from services.errors import ServiceError

load_dotenv()

MODEL_NAME = os.getenv("GEMINI_MODEL", "models/gemini-flash-latest")


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ServiceError("GEMINI_API_KEY is not set.", status_code=500)

    return genai.Client(api_key=api_key)


def _extract_json(text: str) -> Any:
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    if not match:
        raise ServiceError("Gemini response missing JSON payload.", status_code=502)
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise ServiceError("Gemini returned malformed JSON.", status_code=502) from exc


def generate_quiz_questions(text: str, difficulty: str = "Medium") -> List[Dict[str, Any]]:
    prompt = (
        "You are an education quiz generator. Return JSON ONLY as a list of 10 items. "
        "Each item must include: question, answer, type, difficulty, explanation, options (for MCQ). "
        "Types: multiple_choice, true_false, short_answer. "
        f"Difficulty: {difficulty}. Use the content below.\n\nContent:\n{text[:8000]}"
    )
    try:
        client = _get_client()
        result = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    except Exception as exc:
        raise ServiceError("Gemini quiz generation failed.", status_code=502) from exc
    data = _extract_json(result.text)
    if not isinstance(data, list):
        raise ServiceError("Gemini quiz response is not a list.", status_code=502)
    return data


def evaluate_answer(question: str, correct_answer: str, user_answer: str) -> Dict[str, Any]:
    prompt = (
        "You are a strict but helpful quiz evaluator. Return JSON ONLY with keys: "
        "is_correct (boolean), confidence (0-1), explanation, suggestion. "
        "Question: "
        f"{question}\nCorrect Answer: {correct_answer}\nUser Answer: {user_answer}"
    )
    try:
        client = _get_client()
        result = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    except Exception as exc:
        raise ServiceError("Gemini answer evaluation failed.", status_code=502) from exc
    data = _extract_json(result.text)
    if not isinstance(data, dict):
        raise ServiceError("Gemini evaluation response is invalid.", status_code=502)
    return data


def generate_explanation(question: str, answer: str) -> str:
    prompt = (
        "Provide a concise explanation (2-3 sentences) for the answer. "
        "Return plain text only. "
        f"Question: {question}\nAnswer: {answer}"
    )
    try:
        client = _get_client()
        result = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        return result.text.strip()
    except Exception as exc:
        raise ServiceError("Gemini explanation failed.", status_code=502) from exc
