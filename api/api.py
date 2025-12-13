from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.routing import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from dotenv import load_dotenv
import csv
import os


import models
from database import engine, get_db

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "CLAVE_POR_DEFECTO_INSEGURA")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

ARCHIVO_CSV = "dataset.csv"

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:4200",    # Puerto por defecto de Streamlit
    "http://127.0.0.1:4200",    # Lo mismo pero con IP
    "*"                         # Permite cualquier origen (útil para desarrollo)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Orígenes permitidos
    allow_credentials=True,     # Permitir cookies/tokens
    allow_methods=["*"],        # Permitir todos los verbos (GET, POST, PUT...)
    allow_headers=["*"],        # Permitir todos los headers (Authorization, etc.)
)

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


@app.post(
        "/register", 
        summary="Registrar un nuevo usuario",
        description="Crea un nuevo usuario con nombre de usuario y contraseña.",
        tags=["Autenticación"]
        )

def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"mensaje": "Usuario creado correctamente"}

@app.post(
        "/login", 
        response_model=Token,
        summary="Iniciar sesión y obtener un token de acceso",
        description="Inicia sesión con nombre de usuario y contraseña para obtener un token JWT.",
        tags=["Autenticación"]
        )

def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

privateRouter = APIRouter(
    dependencies=[Depends(get_current_user)] 
)

@privateRouter.post(
        "/procesarDatos",
        summary="Procesar datos JSON",
        description="Procesa los datos JSON enviados en la solicitud.",
        tags=["Datos"])
        
def procesar_datos_json(datos: dict):

    print(f"Datos procesados: {datos}")
    
    return {"status": "ok", "data": datos}

@privateRouter.post(
        "/nuevaMuestra",
        summary="Agregar nueva muestra al dataset",
        description="Agrega una nueva muestra al archivo CSV del dataset.",
        tags=["Datos"]
        ) 

def nueva_muestra(datos: dict):
    try:
        fileExists = os.path.isfile(ARCHIVO_CSV)
        columns = list(datos.keys())
        with open(ARCHIVO_CSV, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=columns)
            if not fileExists:
                writer.writeheader()
            writer.writerow(datos)
            return {
                "status": "ok",
                "message": "Nueva muestra agregada al dataset"
            }
    except Exception as e:
        return {"status": "error", "mensaje": str(e)}
    
app.include_router(privateRouter)   
