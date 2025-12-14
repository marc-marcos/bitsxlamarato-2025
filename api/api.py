from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.routing import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from groq import Groq
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from typing import List
import numpy as np
import csv
import os
import ai
import models
from schemas import UserCreate, Token, HiloChat, DatosPaciente, DatosPacienteToTrain
from database import engine, get_db

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "CLAVE_POR_DEFECTO_INSEGURA")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
ARCHIVO_CSV = "dataset.csv"

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

models.Base.metadata.create_all(bind=engine)

descripcionApi = """
Aquesta API proporciona eines d'Intel·ligència Artificial per al suport al diagnòstic i tractament del càncer d'endometri. Integra models de predicció de risc, un assistent conversacional mèdic basat en guies clíniques i gestió segura d'usuaris.

### Equip CheckTheRisk

* **Sergio Ortiz Olivares** - sergio.ortiz.olivares@estudiantat.upc.edu
* **Iván Moreno Santín** - ivan.moreno.santin@estudiantat.upc.edu
* **Marc Marcos Madruga** - marc.marcos@estudiantat.upc.edu
* **Hannah Rober** - hannah.rober@estudiantat.upc.edu

**Repositori GitHub:**
[https://github.com/marc-marcos/bitsxlamarato-2025](https://github.com/marc-marcos/bitsxlamarato-2025)
"""

app = FastAPI(
    title="CheckTheRisk API - bitsxlaMarató 2025",
    description=descripcionApi,
    )

origins = [
    "http://localhost:4200",    
    "http://127.0.0.1:4200",    
    "*"                         
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,     
    allow_methods=["*"],        
    allow_headers=["*"],        
)

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


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
        summary="Registrar un nou usuari",
        description="Crea un nou usuari amb nom d'usuari i contrasenya.",
        tags=["Autenticació"]
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
        summary="Iniciar sessió i obtenir un token d'accés",
        description="Inicia sessió amb nom d'usuari i contrasenya per obtenir un token JWT.",
        tags=["Autenticació"]
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
        summary="Processar dades JSON",
        description="Processa les dades JSON enviades en la sol·licitud.",
        tags=["IA"]
        )
        
def procesarDatos(datos: DatosPaciente):
    diccionario = datos.model_dump()
    campos_fecha = ["fecha_de_recidi", "fecha_qx", "visita_control"]
    
    for campo in campos_fecha:
        diccionario.pop(campo, None)

    array = list(diccionario.values())
    prediccionClase, probs = ai.predict(array)
    prediccionClase = int(prediccionClase)
    probs = probs[0].tolist()
    return {
        "prediccionClase": prediccionClase,
        "prob1": probs[0],
        "prob2": probs[1],
        "prob3": probs[2],
        "prob4": probs[3],
        "prob5": probs[4]
    }

@privateRouter.post(
        "/nuevaMuestra",
        summary="Afegir una nova mostra al dataset",
        description="Afegeix una nova mostra al fitxer CSV del dataset.",
        tags=["IA"]
        ) 

def nuevaMuestra(datos: DatosPacienteToTrain):
    
    diccionario = datos.model_dump()
    campos_fecha = ["fecha_de_recidi", "fecha_qx", "visita_control"]
    
    for campo in campos_fecha:
        diccionario.pop(campo, None)
    array = list(diccionario.values())
    
    status = ai.add_sample(array)
    if status:
        return {"mensaje": "Nueva muestra agregada"}
    else:
        return {"mensaje": "Error al agregar la nueva muestra"}
    
@privateRouter.post(
        "/reEntrenar",
        summary="Reentrenar el model",
        description="Reentrena el model d'IA amb les dades actuals del dataset.",
        tags=["IA"]
        )
def reEntrenar():
    status = ai.retrain()
    if status:
        return {"mensaje": "Modelo reentrenado correctamente"}
    else:
        return {"mensaje": "Error al reentrenar el modelo"}
    
@privateRouter.post(
        "/chatBot",
        summary="Xatbot mèdic per a càncer d'endometri",
        description="Interactua amb un xatbot especialitzat en càncer d'endometri basat en una referència clínica específica.",
        tags=["Xatbot"]
        )
def conversar(datos: HiloChat):
    try:
        TABLA_VII_CONTEXTO = """
        REFERENCIA CLÍNICA OBLIGATORIA (Tabla VII - Tratamiento adyuvante):
        
        1. RIESGO BAJO:
           - Perfil: Estadio IA endometrioide (bajo grado, ILV neg/focal) O Molecular (POLEmut I-II, MMRd/NSMP IA bajo grado).
           - TRATAMIENTO: No tratamiento adyuvante.
        
        2. RIESGO INTERMEDIO:
           - Perfil: Estadio IB endometrioide (bajo grado), IA alto grado, o IA no endometrioide sin invasión.
           - TRATAMIENTO: Braquiterapia (BT).
           - Nota: Se puede omitir BT en pacientes < 60 años.
        
        3. RIESGO INTERMEDIO-ALTO:
           - Perfil: Estadio I con ILV extensa, IB alto grado, o Estadio II.
           - TRATAMIENTO: 
             * Braquiterapia (BT) como base.
             * RTE +/- BT: Si hay ILV extensa y/o estadio II.
             * Considerar QT adyuvante: Si hay ILV extensa y/o alto grado.
        
        4. RIESGO ALTO:
           - Perfil: Estadio III-IVA sin residual, I-IVA no endometrioide (seroso, claras...) con invasión miometrial.
           - TRATAMIENTO: RTE (+/- boost BT) + QT (concurrente y adyuvante o QT-RT secuenciales).
        
        5. AVANZADOS (Estadio IVB o III-IVA con residual):
           - TRATAMIENTO: QT y valorar RTE +/- BT. Hormonoterapia (HT). Si progresión valorar inmunoterapia. RTE paliativa.
        
        GLOSARIO: ILV=Invasión Linfovascular, RTE=Radioterapia Externa, BT=Braquiterapia, QT=Quimioterapia.
        """

        prompt_medico = {
            "role": "system",
            "content": f"""
            Eres un Oncólogo Experto en Cáncer de Endometrio y Útero.
            
            TU FUENTE DE VERDAD:
            {TABLA_VII_CONTEXTO}
            
            TUS OBJETIVOS:
            1. Actuar como un consultor médico riguroso. BASA TUS RESPUESTAS EXCLUSIVAMENTE EN LA "REFERENCIA CLÍNICA OBLIGATORIA" PROVISTA ARRIBA.
            2. Distingue si el usuario aporta "Clasificación Molecular" (POLEmut, MMRd, p53abn) o si es "Desconocida". Si no lo dice, asume desconocida o pregunta.
            3. Si el usuario te da un nivel de riesgo (Bajo, Intermedio, Alto, etc.), sugiere el tratamiento exacto de la tabla.
            4. Sé conciso, empático y usa formato Markdown (listas y negritas).
            """
        }

        mensajes_para_la_ia = [prompt_medico] + [m.dict() for m in datos.historial]

        completion = client.chat.completions.create(
            messages=mensajes_para_la_ia,
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=800
        )

        respuesta_generada = completion.choices[0].message.content
        
        return {"respuesta": respuesta_generada}

    except Exception as e:
        return {"error": str(e)}






app.include_router(privateRouter)   
