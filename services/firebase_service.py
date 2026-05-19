from firebase_admin import firestore

from firebase_config import db


def save_subject(subject: str) -> None:
    db.collection("subjects").document(subject).set(
        {"name": subject, "created_at": firestore.SERVER_TIMESTAMP},
        merge=True,
    )


def save_generated_quiz(subject: str, filename: str | None, questions: list, difficulty: str) -> None:
    db.collection("generated_quizzes").add(
        {
            "subject": subject,
            "pdf_filename": filename,
            "questions": questions,
            "difficulty": difficulty,
            "timestamp": firestore.SERVER_TIMESTAMP,
        }
    )


def save_speech_log(transcript: str) -> None:
    db.collection("speech_logs").add(
        {"transcript": transcript, "timestamp": firestore.SERVER_TIMESTAMP}
    )


def save_ai_feedback(payload: dict) -> None:
    db.collection("ai_feedback").add({**payload, "timestamp": firestore.SERVER_TIMESTAMP})


def save_quiz_result(payload: dict) -> None:
    db.collection("quiz_results").add({**payload, "timestamp": firestore.SERVER_TIMESTAMP})


def fetch_subjects(limit: int = 20) -> list:
    docs = db.collection("subjects").order_by(
        "created_at", direction=firestore.Query.DESCENDING
    ).limit(limit).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def fetch_quiz_history(limit: int = 10) -> list:
    docs = (
        db.collection("generated_quizzes")
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def fetch_quiz_results(limit: int = 10) -> list:
    docs = (
        db.collection("quiz_results")
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def calculate_analytics(results: list) -> dict:
    if not results:
        return {
            "total_quizzes": 0,
            "average_score": 0,
            "strongest_subject": "-",
            "weakest_subject": "-",
            "speech_accuracy": 0,
        }

    total_quizzes = len(results)
    average_score = round(
        sum(item.get("percentage", 0) for item in results) / total_quizzes
    )

    subject_scores: dict[str, list] = {}
    for item in results:
        subject = item.get("subject") or "-"
        subject_scores.setdefault(subject, []).append(item.get("percentage", 0))

    subject_averages = {
        subject: sum(scores) / len(scores) for subject, scores in subject_scores.items()
    }
    strongest_subject = max(subject_averages, key=subject_averages.get)
    weakest_subject = min(subject_averages, key=subject_averages.get)

    latest = results[0]
    speech_accuracy = latest.get("speech_accuracy") or 0

    return {
        "total_quizzes": total_quizzes,
        "average_score": average_score,
        "strongest_subject": strongest_subject,
        "weakest_subject": weakest_subject,
        "speech_accuracy": speech_accuracy,
    }
