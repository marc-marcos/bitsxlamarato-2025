from pydantic import BaseModel, Field
from typing import List
from datetime import date

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Mensaje(BaseModel):
    role: str       
    content: str

class HiloChat(BaseModel):
    historial: List[Mensaje]

class DatosPaciente(BaseModel):
    edad: float
    imc: float
    asa: float
    est_pcte: float

    tipo_histologico: float
    valor_de_ca125: float
    Grado: float
    tamano_tumoral: float
    
    recep_est_porcent: float
    rece_de_Ppor: float
    beta_cateninap: float
    
    estudio_genetico: float

    FIGO2023: float
    estadificacion_: float
    estadiaje_pre_i: float
    ecotv_infiltsub: float
    ecotv_infiltobj: float

    metasta_distan: float
    afectacion_linf: float
    n_gangP_afec: float
    AP_centinela_pelvico: float
    AP_glanPaor: float

    ciclos_tto_NAdj: float
    tto_1_quirugico: float
    Reseccion_macroscopica_complet: float
    Tratamiento_RT: float
    Tratamiento_sistemico: float
    Tributaria_a_Radioterapia: float

    numero_de_recid: float
    tto_recidiva: float
    libre_enferm: float
    causa_muerte: float

    fecha_de_recidi: str
    fecha_qx: str
    visita_control: str

class DatosPacienteToTrain(BaseModel):
    edad: float
    imc: float
    asa: float
    est_pcte: float

    tipo_histologico: float
    valor_de_ca125: float
    Grado: float
    tamano_tumoral: float
    
    recep_est_porcent: float
    rece_de_Ppor: float
    beta_cateninap: float
    
    estudio_genetico: float

    FIGO2023: float
    estadificacion_: float
    estadiaje_pre_i: float
    ecotv_infiltsub: float
    ecotv_infiltobj: float

    metasta_distan: float
    afectacion_linf: float
    n_gangP_afec: float
    AP_centinela_pelvico: float
    AP_glanPaor: float

    ciclos_tto_NAdj: float
    tto_1_quirugico: float
    Reseccion_macroscopica_complet: float
    Tratamiento_RT: float
    Tratamiento_sistemico: float
    Tributaria_a_Radioterapia: float

    numero_de_recid: float
    tto_recidiva: float
    libre_enferm: float
    causa_muerte: float

    grupo_de_riesgo_definitivo: float

    fecha_de_recidi: str
    fecha_qx: str
    visita_control: str
