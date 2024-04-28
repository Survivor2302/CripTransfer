import datetime
import os
import uuid
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import smtplib
from email.message import EmailMessage
import json
from urllib.parse import quote
import datetime
import os
import time
import schedule  



app = FastAPI()

# SMTP
email = "foratoenzo91@gmail.com"
password = "uefnlmxflokqzmdd"
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login(email, password)


# BDD
# files = []
json_db_path = 'files_db.json'


app.add_middleware(
    CORSMiddleware,
    
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Initialise le fichier JSON s'il n'existe pas
def init_json_db():
    try:
        with open(json_db_path, 'x') as f:
            json.dump([], f)
    except FileExistsError:
        pass


init_json_db()


def read_json_db():
    with open(json_db_path, 'r') as f:
        return json.load(f)


def write_json_db(data):
    with open(json_db_path, 'w') as f:
        json.dump(data, f)


@app.get("/")
async def root():
    return {"message": "Hello World"}

# Fonction pour upload dans la bdd le fichier et envoyé le mail 
@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    password: str = Form(...),
    expiryTime: datetime.datetime = Form(...),
    singleUseLink: bool = Form(...),
    email: str = Form(...)
):

    file_id = str(uuid.uuid4())

    upload_folder = Path('uploads')
    upload_folder.mkdir(exist_ok=True)

    # crypte le fichier
    file_path = upload_folder.joinpath(file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Envoi de l'email
    send_email(file_id, email)

    # Ajout du fichier à la liste
    files = read_json_db()
    files.append({
        "file_id": file_id,
        "file_name": file.filename,
        "password": password,
        "expiration": expiryTime.isoformat(),
        "is_unique": singleUseLink,
    })
    write_json_db(files)

    return {"file_name": file.filename}

# fonction pour envoyer un email
def send_email(file_id, receiver_email):
    file_link = f"http://localhost:3000/download/{file_id}"
    msg = EmailMessage()
    msg.set_content(
        f"nAccédez au fichier ici: {file_link}", subtype='html')
    msg['Subject'] = 'Nouveau fichier uploadé'
    msg['From'] = email
    msg['To'] = receiver_email

    server.send_message(msg)
    print("Email envoyé")

# Fonction pour download un fichier
@app.post("/download/")
async def download_file(file_id: str = Form(...), password: str = Form(...)):
   
    files = read_json_db()

    # cherche le fichier dans la bdd
    try:
        file = next(file for file in files if file["file_id"] == file_id)

        # Vérifie le mdp
        if file["password"] != password:
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
        
        # Vérifie la date d'expiration
        expiration_time = datetime.datetime.fromisoformat(file["expiration"])
        current_time = datetime.datetime.now()

        if current_time > expiration_time:
            # Si le fichier est expiré on le supprime
            file_path = Path('uploads').joinpath(file["file_name"])

            # Supprime le fichier du dossier uploads
            if file_path.exists():
                file_path.unlink()  

            # Supprime le fichier de la bdd
            files = [f for f in files if f["file_id"] != file_id]
            write_json_db(files)

            
            return print("message : Le fichier est expiré et a été supprimé.")

        file_path = Path('uploads').joinpath(file["file_name"])

        # Renvoi le fichier dans la reponse
        response = FileResponse(file_path, headers={
            'Content-Disposition': f'attachment; filename="{quote(file["file_name"])}"'
        })
        
        return response

    except Exception as e:
        print(f"Erreur : {e}")
        raise HTTPException(status_code=500, detail="Une erreur s'est produite lors de la gestion de la requête")
    
@app.post("/delete_file/")
async def delete_file(file_id: str = Form(...)):
    try:
        
        files = read_json_db()

        # Cherche le fichier dans la bdd
        file = next(file for file in files if file["file_id"] == file_id)
        if file["is_unique"]:
            # Supprime le fichier de la bdd
            files = [f for f in files if f["file_id"] != file_id]
            write_json_db(files)

            # Supprime le fichier du dossier uploads
            file_path = Path('uploads').joinpath(file["file_name"])
            if file_path.exists():
                file_path.unlink()  

        return {"message": "Le fichier a été supprimé avec succès."}

    except StopIteration:    
        return {"error": "Fichier non trouvé."}

    except Exception as e:
        return {"error": f"Une erreur s'est produite : {e}"}
    
