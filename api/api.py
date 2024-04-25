from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil


app = FastAPI()

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
    upload_folder = Path('uploads')
    upload_folder.mkdir(exist_ok=True)
    file_path = upload_folder / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}
