import datetime
import uuid
from fastapi import FastAPI, Form, Request, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import smtplib
from email.message import EmailMessage
import base64

app = FastAPI()

# SMTP
email = "foratoenzo91@gmail.com"
password = "uefnlmxflokqzmdd"
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login(email, password)


# BDD
files = []


app.add_middleware(
    CORSMiddleware,
    # Vous pouvez remplacer "*" par l'URL de votre application React
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    experation_date = datetime.datetime.now() + datetime.timedelta(days=7)
    is_unique = True
    file_id = uuid.uuid4()
    print(file_id)

    upload_folder = Path('uploads')
    upload_folder.mkdir(exist_ok=True)
    # Encode the filename to a safe format
    safe_filename = base64.urlsafe_b64encode(file.filename.encode()).decode()
    file_path = upload_folder / safe_filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Envoi de l'email
    send_email(safe_filename, 'lebou23@gmail.com')

    # Ajout du fichier à la liste
    files.append(
        {
            "file_id": file_id,
            "filename": safe_filename,
            "expiration": experation_date,
            "is_unique": is_unique,
            "is_already_downloaded": False,
        }
    )

    return {"filename": safe_filename}


def send_email(filename, receiver_email):
    file_link = f"http://localhost:3000/download/{filename}"
    msg = EmailMessage()
    msg.set_content(
        f"Un nouveau fichier a été uploadé: {filename}\nAccédez au fichier ici: {file_link}", subtype='html')
    msg['Subject'] = 'Nouveau fichier uploadé'
    msg['From'] = email
    msg['To'] = receiver_email

    server.send_message(msg)
    print("Email envoyé")


# Fonction pour télécharger le fichier
@app.post("/download/{file_id}/")
async def download_file(request: Request, file_id: str, password: str = Form(...)):

    try:
        file = next(
            (file for file in files if file["file_id"] == file_id), None)
        if file is None:
            raise HTTPException(status_code=404, detail="File not found")

        if datetime.datetime.now() > file["expiration"]:
            files.remove(file)
            raise HTTPException(status_code=404, detail="File expired")

        if password != "password":
            raise HTTPException(status_code=401, detail="Wrong password")

        file_path = Path("uploads") / file["filename"]

        if file["is_unique"]:
            if file["is_already_downloaded"]:
                files.remove(file)
                file_path.unlink()
                raise HTTPException(
                    status_code=404, detail="File already downloaded")
            else:
                file["is_already_downloaded"] = True

        # uncrypt the file

        return FileResponse(file_path, headers={"Content-Disposition": f"attachment; filename={file['filename']}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
