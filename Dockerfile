    import firebase_admin                                                                                                                                              
     from firebase_admin import credentials, firestore                                                                                                                  
     import os                                                                                                                                                          
                                                                                                                                                                        
     # Check if running on Cloud Run (K_SERVICE is a default env var)                                                                                                   
     if os.getenv('K_SERVICE'):                                                                                                                                         
         # In Cloud Run, initialize without explicit credentials                                                                                                        
         # It will automatically use the service's identity                                                                                                             
         if not firebase_admin._apps:                                                                                                                                   
            firebase_admin.initialize_app() 

  else:                                                                                                                                                              
        # Local development still uses the key file                                                                                                                    
        key_path = 'firebase/firebase_key.json'                                                                                                                        
        if os.path.exists(key_path):                                                                                                                                   
            cred = credentials.Certificate(key_path)                                                                                                                   
        if not firebase_admin._apps:                                                                                                                               
                firebase_admin.initialize_app(cred)                                                                                                                    
    else:                                                                                                                                                          
            raise FileNotFoundError(f"Local Firebase key not found at {key_path}")                                                                                     
                                                                                                                                                                       
            db = firestore.client()                                                                                                                                            
                               