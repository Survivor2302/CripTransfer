# Créer environnement virtuel

### Windows

```
python3 -m venv venv
```

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
