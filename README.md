# Créer environnement virtuel

```
python3 -m venv venv
```

### Windows

```
.\venv\Scripts\activate
```

### macOS/Linux

```
source venv/bin/activate
```

# installer les dépendance

```
pip install -r requirements.txt
```

# lancer le projet :

```
uvicorn api:app --reload
```

# With Docker

```
docker-compose up --build
```

# With Make

```
make dev
```

#V1 
Pour la V1 le cryptage et le décryptage se passe dans le fichier api.py, nous avons utilisé fernet pour crypter. Les fichiers uploads sont stockés dans le fichier "uploads". Nous avons utilisé du HTML pour le front, dans le front il y a juste un formulaire pour upload et récup le fichier upload.

