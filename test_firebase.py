from firebase_config import db

doc_ref = db.collection("test").document("sample")

doc_ref.set({
    "message": "Firebase connected successfully"
})

print("Firebase connection successful")