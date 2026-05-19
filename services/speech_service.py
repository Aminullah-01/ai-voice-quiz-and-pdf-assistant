import os
import tempfile

import speech_recognition as sr
from pydub import AudioSegment

from services.errors import ServiceError


def recognize_audio_upload(audio_file) -> str:
    if not audio_file or audio_file.filename == "":
        raise ServiceError("Empty audio filename.", status_code=400)

    temp_input_path = None
    temp_output_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_in:
            audio_file.save(temp_in.name)
            temp_input_path = temp_in.name

        if os.path.getsize(temp_input_path) == 0:
            raise ServiceError("Empty audio upload.", status_code=400)

        temp_output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
        AudioSegment.from_file(temp_input_path, format="webm").export(
            temp_output_path, format="wav"
        )

        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_output_path) as source:
            audio_data = recognizer.record(source)

        if not audio_data.frame_data:
            raise ServiceError("Audio contains no data.", status_code=400)

        try:
            return recognizer.recognize_google(audio_data)
        except sr.UnknownValueError as exc:
            raise ServiceError("Speech not recognized.", status_code=400) from exc
        except sr.RequestError as exc:
            raise ServiceError("Speech service unavailable.", status_code=502) from exc
    finally:
        for path in [temp_input_path, temp_output_path]:
            if path and os.path.exists(path):
                os.remove(path)
