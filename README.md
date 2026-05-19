# AI Voice Quiz & PDF Learning Assistant

## Overview
AI-powered educational assistant that turns PDFs into quizzes, evaluates answers with Gemini, supports voice input, and tracks analytics in Firebase Firestore.

## Features
- PDF upload and text extraction
- Gemini-powered quiz generation (MCQ, true/false, short answer)
- AI answer evaluation with explanations and suggestions
- Voice answer input and speech recognition
- Firebase-backed quiz history, results, and analytics

## Project Structure
```
ai-voice-quiz-pdf-assistant/
├── app.py
├── requirements.txt
├── .env
├── .gitignore
├── firebase/
│   └── firebase_key.json
├── services/
│   ├── gemini_service.py
│   ├── firebase_service.py
│   ├── speech_service.py
│   ├── pdf_service.py
│   └── quiz_service.py
├── static/
│   ├── style.css
│   ├── script.js
│   ├── audio/
│   └── results/
├── templates/
│   └── index.html
├── uploads/
├── docs/
└── README.md
```

## Setup
1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Environment Variables
Create a .env file:
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=models/gemini-flash-latest
FLASK_ENV=development
FIREBASE_KEY_PATH=firebase/firebase_key.json
```

## Firebase Setup
1. Create a Firebase project in Firebase Console.
2. Generate a service account key (JSON).
3. Save it as firebase/firebase_key.json.

## Run
```bash
python app.py
```
Open the local URL printed in the terminal.

## Production Deployment (Google Cloud Run)

### Local Docker Build
```bash
docker build -t ai-voice-quiz .
docker run -p 8080:8080 \
   -e PORT=8080 \
   -e GEMINI_API_KEY=your_key_here \
   -e GEMINI_MODEL=models/gemini-flash-latest \
   -e FIREBASE_KEY_PATH=firebase/firebase_key.json \
   ai-voice-quiz
```

### Cloud Run Deployment
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

gcloud artifacts repositories create ai-voice-quiz-repo \
   --repository-format=docker \
   --location=us-central1

gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/ai-voice-quiz-repo/ai-voice-quiz

gcloud run deploy ai-voice-quiz \
   --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/ai-voice-quiz-repo/ai-voice-quiz \
   --platform managed \
   --region us-central1 \
   --allow-unauthenticated \
   --set-env-vars GEMINI_API_KEY=YOUR_KEY,GEMINI_MODEL=models/gemini-flash-latest,FLASK_ENV=production
```

### Environment Variables
Set these in Cloud Run:
- GEMINI_API_KEY
- GEMINI_MODEL
- FLASK_ENV
- GOOGLE_APPLICATION_CREDENTIALS (preferred) or FIREBASE_KEY_PATH

### Firebase Credentials
For Cloud Run, mount a service account key as a secret and set GOOGLE_APPLICATION_CREDENTIALS to its path.
