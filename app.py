import os
import time
from datetime import datetime
from typing import Dict

from flask import Flask, jsonify, render_template, request

from services.errors import ServiceError
from services.gemini_service import evaluate_answer as gemini_evaluate_answer
from services.firebase_service import (
    calculate_analytics,
    fetch_quiz_history,
    fetch_quiz_results,
    fetch_subjects,
    save_ai_feedback,
    save_generated_quiz as save_generated_quiz_record,
    save_quiz_result,
    save_speech_log,
    save_subject,
)
from services.pdf_service import clean_text, extract_text_from_pdf, save_pdf_upload
from services.quiz_service import (
    generate_quiz_items,
    save_generated_quiz_file,
    update_score_state,
)
from services.speech_service import recognize_audio_upload

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
GENERATED_FOLDER = "generated_questions"
ALLOWED_EXTENSIONS = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_FOLDER, exist_ok=True)

# Keep latest extracted text in memory for quick access
UPLOAD_TEXTS: Dict[str, str] = {}
UPLOADED_PDF_PATH: str | None = None
SCORE_STATE: Dict[str, Dict[str, int]] = {}


@app.errorhandler(ServiceError)
def handle_service_error(error: ServiceError):
    return jsonify({"success": False, "message": error.message}), error.status_code


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running"})


@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    print("PDF upload request received")
    global UPLOADED_PDF_PATH
    if "pdf" not in request.files:
        return jsonify({"success": False, "message": "No PDF file uploaded."}), 400

    try:
        file_storage = request.files["pdf"]
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        safe_name, upload_id, file_path = save_pdf_upload(
            file_storage, UPLOAD_FOLDER, ALLOWED_EXTENSIONS
        )
        print("Upload successful")
        UPLOAD_TEXTS[upload_id] = file_path
        UPLOADED_PDF_PATH = file_path
        print("Stored uploaded PDF path:", UPLOADED_PDF_PATH)
        return jsonify(
            {
                "success": True,
                "message": "PDF uploaded successfully",
                "upload_id": upload_id,
                "filename": safe_name,
                "filepath": file_path,
            }
        )
    except ServiceError:
        raise
    except Exception as exc:
        print("[upload-pdf] error:", exc)
        return jsonify({"success": False, "message": "Upload failed."}), 500


@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    subject = request.form.get("subject")
    difficulty = request.form.get("difficulty", "Medium")
    print("[generate-quiz] subject:", subject)

    if not subject:
        return jsonify({"success": False, "message": "Subject is required."}), 400

    file_storage = request.files.get("pdf")
    safe_name = None
    upload_id = f"{int(time.time())}_subject_only"
    text = ""

    try:
        if file_storage and file_storage.filename:
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            safe_name, upload_id, file_path = save_pdf_upload(
                file_storage, UPLOAD_FOLDER, ALLOWED_EXTENSIONS
            )
            print("PDF received")
            print("Extracting text...")
            raw_text = extract_text_from_pdf(file_path)
            text = clean_text(raw_text)
            if not text:
                return jsonify({"success": False, "message": "No readable text found in PDF."}), 400
        else:
            text = f"Subject: {subject}. Generate general study questions without a PDF."

        print("Generating questions...")
        quiz_items = generate_quiz_items(text, difficulty)

        quiz_id = save_generated_quiz_file(upload_id, subject, quiz_items, GENERATED_FOLDER)

        try:
            save_subject(subject)
            save_generated_quiz_record(subject, safe_name, quiz_items, difficulty)
        except Exception as exc:
            print("[generate-quiz] firestore error:", exc)

        return jsonify(
            {
                "success": True,
                "message": "Quiz generated successfully.",
                "quiz_id": quiz_id,
                "filename": safe_name,
                "difficulty": difficulty,
                "questions": quiz_items,
            }
        )
    except ServiceError:
        raise
    except Exception as exc:
        return jsonify({"success": False, "message": f"Quiz generation failed: {exc}"}), 500


@app.route("/recognize-answer", methods=["POST"])
def recognize_answer():
    if "audio" not in request.files:
        return jsonify({"success": False, "message": "No audio file uploaded."}), 400

    audio_file = request.files["audio"]
    try:
        text = recognize_audio_upload(audio_file)
        print("[recognize-answer] recognition successful:", text)
    except ServiceError:
        raise
    except Exception as exc:
        print("[recognize-answer] error:", exc)
        return jsonify({"success": False, "message": "Speech recognition failed."}), 502

    try:
        save_speech_log(text)
    except Exception as exc:
        print("[recognize-answer] firestore error:", exc)

    return jsonify(
        {
            "success": True,
            "text": text,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    )


@app.route("/evaluate-answer", methods=["POST"])
def evaluate_answer():
    data = request.get_json(silent=True) or {}
    user_answer = data.get("user_answer", "")
    correct_answer = data.get("correct_answer", "")
    question = data.get("question", "")
    subject = data.get("subject", "")
    session_id = data.get("session_id", "default")

    if not user_answer.strip():
        return jsonify({"success": False, "message": "Answer is empty."}), 400

    if not correct_answer.strip():
        return jsonify({"success": False, "message": "Missing correct answer."}), 400

    ai_feedback = gemini_evaluate_answer(question, correct_answer, user_answer)
    if not isinstance(ai_feedback, dict):
        return jsonify({"success": False, "message": "Invalid AI response."}), 502
    is_correct = bool(ai_feedback.get("is_correct"))
    confidence = ai_feedback.get("confidence", 0)
    explanation = ai_feedback.get("explanation", "")
    suggestion = ai_feedback.get("suggestion", "")

    score_state = update_score_state(SCORE_STATE, session_id, is_correct)

    try:
        save_ai_feedback(
            {
                "question": question,
                "subject": subject,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "confidence": confidence,
                "explanation": explanation,
                "suggestion": suggestion,
                "session_id": session_id,
            }
        )
    except Exception as exc:
        print("[evaluate-answer] firestore error:", exc)

    return jsonify(
        {
            "success": True,
            "is_correct": is_correct,
            "confidence": confidence,
            "explanation": explanation,
            "suggestion": suggestion,
            "score": score_state,
        }
    )


@app.route("/analytics", methods=["GET"])
def analytics():
    try:
        results = fetch_quiz_results(limit=100)
        analytics_data = calculate_analytics(results)
        return jsonify({"success": True, **analytics_data})
    except Exception as exc:
        print("[analytics] error:", exc)
        return jsonify({"success": False, "message": "Failed to load analytics."}), 500


@app.route("/subjects", methods=["GET"])
def list_subjects():
    try:
        subjects = fetch_subjects()
        return jsonify({"success": True, "subjects": subjects})
    except Exception as exc:
        print("[subjects] firestore error:", exc)
        return jsonify({"success": False, "message": "Failed to load subjects."}), 500


@app.route("/quiz-history", methods=["GET"])
def quiz_history():
    try:
        history = fetch_quiz_history()
        return jsonify({"success": True, "history": history})
    except Exception as exc:
        print("[quiz-history] firestore error:", exc)
        return jsonify({"success": False, "message": "Failed to load quiz history."}), 500


@app.route("/quiz-results", methods=["GET", "POST"])
def quiz_results():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        subject = data.get("subject")
        score = data.get("score")
        total = data.get("total")
        percentage = data.get("percentage")
        avg_response_time = data.get("avg_response_time")
        speech_accuracy = data.get("speech_accuracy")
        difficulty = data.get("difficulty")
        duration = data.get("duration")

        if score is None or total is None or subject is None:
            return jsonify({"success": False, "message": "Invalid result data."}), 400

        try:
            save_quiz_result(
                {
                    "subject": subject,
                    "score": score,
                    "total": total,
                    "percentage": percentage,
                    "avg_response_time": avg_response_time,
                    "speech_accuracy": speech_accuracy,
                    "difficulty": difficulty,
                    "duration": duration,
                }
            )
            return jsonify({"success": True, "message": "Results saved."})
        except Exception as exc:
            print("[quiz-results] firestore error:", exc)
            return jsonify({"success": False, "message": "Failed to save results."}), 500

    try:
        results = fetch_quiz_results()
        return jsonify({"success": True, "results": results})
    except Exception as exc:
        print("[quiz-results] firestore error:", exc)
        return jsonify({"success": False, "message": "Failed to load quiz results."}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
