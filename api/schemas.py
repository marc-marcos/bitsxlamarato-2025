from pydantic import BaseModel, Field
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Mensaje(BaseModel):
    role: str       # "user" o "assistant"
    content: str

class HiloChat(BaseModel):
    historial: List[Mensaje]

class DatosPaciente(BaseModel):
    # --- DATOS GENERALES ---
    edad: float
    imc: float
    asa: float
    est_pcte: float

    # --- DATOS TUMORALES Y MARCADORES ---
    tipo_histologico: float
    valor_de_ca125: float
    Grado: float
    tamano_tumoral: float
    
    # --- RECEPTORES Y GENÉTICA ---
    recep_est_porcent: float
    rece_de_Ppor: float
    beta_cateninap: float
    
    # Genes (r01-r06)
    estudio_genetico_r01: float
    estudio_genetico_r02: float
    estudio_genetico_r03: float
    estudio_genetico_r04: float
    estudio_genetico_r05: float
    estudio_genetico_r06: float

    # --- ESTADIFICACIÓN Y ECOGRAFÍA ---
    FIGO2023: float
    estadificacion_: float
    estadiaje_pre_i: float
    ecotv_infiltsub: float
    ecotv_infiltobj: float

    # --- AFECTACIÓN Y METÁSTASIS ---
    metasta_distan: float
    afectacion_linf: float
    n_gangP_afec: float
    AP_centinela_pelvico: float
    AP_glanPaor: float

    # --- TRATAMIENTOS RECIBIDOS ---
    ciclos_tto_NAdj: float
    tto_1_quirugico: float
    Reseccion_macroscopica_complet: float
    Tratamiento_RT: float
    Tratamiento_sistemico: float
    Tributaria_a_Radioterapia: float

    # --- SEGUIMIENTO Y RESULTADOS ---
    numero_de_recid: float
    tto_recidiva: float
    libre_enferm: float
    causa_muerte: float
    grupo_de_riesgo_definitivo: float