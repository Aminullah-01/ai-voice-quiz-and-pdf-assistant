import os

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# Prevent duplicate Firebase initialization
if not firebase_admin._apps:
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv(
        "FIREBASE_KEY_PATH", "firebase/firebase_key.json"
    )
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)

# Firestore database client
db = firestore.client()