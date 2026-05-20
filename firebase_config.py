import firebase_admin                                                                                                                                              
from firebase_admin import credentials, firestore                                                                                                                  
import os                                                                                                                                                          
                                                                                                                                                                        
     # Check if running on Cloud Run (K_SERVICE is a default env var)                                                                                                   
if os.getenv('K_SERVICE'):                                                                                                                                         
         # IN THE CLOUD: Use the default service account (No key file needed!)                                                                                          
         if not firebase_admin._apps:                                                                                                                                   
             firebase_admin.initialize_app()                                                                                                                            
else:
       # LOCALLY: Use your JSON key file                                                                                                                              
        key_path = os.path.join(os.path.dirname(__file__), 'firebase_key.json')                                                                                        
        if os.path.exists(key_path):                                                                                                                                   
            cred = credentials.Certificate(key_path)                                                                                                                   
            if not firebase_admin._apps:                                                                                                                               
                firebase_admin.initialize_app(cred)                                                                                                                    
        else:                                                                                                                                                          
            # If you don't have the key locally, it will show this error                                                                                               
            print("Warning: Firebase key not found. Local Firestore will not work.")                                                                                   
                                                                                                                                                                       
db = firestore.client()