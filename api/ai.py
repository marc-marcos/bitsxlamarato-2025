import joblib
import numpy as np
import pandas as pd
import io
from sklearn.impute import KNNImputer

MODEL_PATH = "../lr_gs.joblib"
SCALER_PATH = "../scaler.joblib"

model = None
scaler = None

def add_new_data():
    pass

def predict(inputs):
    global model
    load_model()
    
    # Process data
    inputs_processed = preprocess_once(inputs)

    # Predict
    return predict_processed(inputs_processed)


def predict_processed(input):
    probabilities = model.predict_proba(input)
    pred_class = model.predict(input)

    return (pred_class, probabilities)

def manual_one_hot_encoding(input_):
    """
    Takes an input list/array of 32 elements.
    Expands index 11 into 6 one-hot encoded variables.
    Returns a flat list of 37 elements.
    """
    # 1. Convert to list if it's a numpy array for easier slicing

    print(input_)

    # 2. Extract the value to be encoded (originally at index 11)
    # We assume the value is a float/int representing the category (e.g., 1.0 to 6.0)
    category_value = int(input_[11])
    
    # 3. Create the One-Hot Encoded (OHE) section
    # Initialize 6 zeros
    ohe_section = [0.0] * 6
    
    # Set the appropriate index to 1.0
    # SAFETY: This assumes your categories are 1-based (1, 2, 3, 4, 5, 6).
    # If category_value is 1, we set index 0. If 2, we set index 1, etc.
    # We add a bounds check to prevent errors if data is 0 or >6.
    if 1 <= category_value <= 6:
        ohe_section[category_value - 1] = 1.0
        
    # 4. Construct the final list
    # indices 0-10 + OHE section + indices 12-31
    final_row = input_[:11] + ohe_section + input_[12:]
    
    return [final_row]

def preprocess_once(input_):
    global scaler

    # Manual one hot encoding
    data_one_hot = manual_one_hot_encoding(input_)


    # Scaling
    data_scaled = scaler.transform(data_one_hot)

    return data_scaled


def retrain(csv_string):
    # Read from Sergio's CSV
    csv_buffer = io.StringIO(csv_string)
    new_csv = pd.read_csv(csv_buffer)

    # Manual one hot encode, maybe have to convert to np array

    one_hot_encoded = manual_one_hot_encoding(new_csv)

    # Scale to our values

    scaled = scaler.transform(one_hot_encoded)

    # Read from our CSV
    out_csv_df = pd.read_csv("dataset.csv")

    # Append from Sergio's dataframe to our data frame 

    new_df = pd.concat([scaled, out_csv_df], ignore_index=True)

    new_df.to_csv('dataset.csv', index=False)

    # Split into X and y

    y_ = new_df['grupo_de_riesgo_definitivo']
    x_ = new_df.drop('grupo_de_riesgo_definitivo', axis=1)

    model.fit(x_, y_)

    joblib.dump(model, MODEL_PATH)


def load_model():
    global model
    global scaler

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

def save_scaler(scaler):
    joblib.dump(scaler, SCALER_PATH)

def save_model(model):
    joblib.dump(model, MODEL_PATH)

## HARD IA

from copy import deepcopy
# Big ass function

def train_preprocess(df_in):
  df = df_in.copy(deep = True)

  # Calculated columns

  df[['fecha_de_recidi', 'fecha_qx']] = df[['fecha_de_recidi', 'fecha_qx']].apply(
    pd.to_datetime, dayfirst=True, errors='coerce'
  )

  df['disease_free_surv'] = (df['fecha_de_recidi'] - df['fecha_qx']).dt.days
  df['disease_free_surv'] = df['disease_free_surv'].fillna(-1).astype(int)

  df[['visita_control', 'f_muerte', 'fecha_qx']] = df[['visita_control', 'f_muerte', 'fecha_qx']].apply(
      pd.to_datetime, dayfirst=True, errors='coerce'
  )
  df['fecha_evento'] = df['f_muerte'].fillna(df['visita_control'])

  df['overall_survival'] = (df['fecha_evento'] - df['fecha_qx']).dt.days
  df['overall_survival'] = df['overall_survival'].fillna(-1).astype(int)
  df.drop(columns=['fecha_evento'], inplace=True)

  # Select columns

  columns_to_keep = [
    'edad', 'imc', 'tipo_histologico', 'valor_de_ca125', 'metasta_distan', 'ciclos_tto_NAdj',
    'asa', 'afectacion_linf', 'n_gangP_afec', 'recep_est_porcent',
    'beta_cateninap', 'FIGO2023', 'estadificacion_', 'Tributaria_a_Radioterapia',
    'visita_control', 'est_pcte', 'f_muerte', 'numero_de_recid', 'tto_recidiva',
    'Reseccion_macroscopica_complet', 'f_diag', 'Grado', 'ecotv_infiltsub',
    'ecotv_infiltobj', 'estadiaje_pre_i', 'tto_1_quirugico',
    'tamano_tumoral', 'AP_centinela_pelvico', 'AP_glanPaor', 'rece_de_Ppor',
    'estudio_genetico_r01', 'estudio_genetico_r02', 'estudio_genetico_r03',
    'estudio_genetico_r04', 'estudio_genetico_r05', 'estudio_genetico_r06',
    'Tratamiento_RT',
    'Tratamiento_sistemico', 'causa_muerte', 'libre_enferm',
    'fecha_de_recidi', 'tto_recidiva', 'Reseccion_macroscopica_complet'
  ]


  valid_columns = list(dict.fromkeys([col for col in columns_to_keep if col in df.columns]))

  df_selected = df[valid_columns]

  # Imputing NaNs

  from sklearn.impute import KNNImputer

  num_cols = df_selected.select_dtypes(include=[np.number]).columns

  if len(num_cols) > 0:
      print(f"Imputing {len(num_cols)} numeric columns with KNN...")
      imputer = KNNImputer(n_neighbors=5)

      df_selected[num_cols] = imputer.fit_transform(df[num_cols])
  else:
    return

  cat_cols = df_selected.select_dtypes(exclude=[np.number]).columns

  if len(cat_cols) > 0:
      print(f"Imputing {len(cat_cols)} categorical columns with Mode...")
      for col in cat_cols:
          if not df_selected[col].mode().empty:
              df_selected[col] = df_selected[col].fillna(df_selected[col].mode()[0])

  df_imputed = df_selected.reset_index(drop=True)

  # One hot encoding

  my_date_cols = ['f_muerte', 'visita_control', 'f_diag', 'fecha_de_recidi']

  df_with_dates = parse_date_columns(df_imputed, my_date_cols)

  # Scaling

  df_final = df_with_dates.copy(deep = True)

  cols_to_scale = df_final.select_dtypes(include=[np.number]).columns

  scaler = MinMaxScaler(feature_range=(0, 1))

  df_final[cols_to_scale] = scaler.fit_transform(df_final[cols_to_scale])

  return df_final, scaler, imputer


def preprocess(df_in, scaler, imputer):
  df = df_in.copy(deep = True)
  # Calculated columns

  df[['fecha_de_recidi', 'fecha_qx']] = df[['fecha_de_recidi', 'fecha_qx']].apply(
    pd.to_datetime, dayfirst=True, errors='coerce'
  )

  df['disease_free_surv'] = (df['fecha_de_recidi'] - df['fecha_qx']).dt.days
  df['disease_free_surv'] = df['disease_free_surv'].fillna(-1).astype(int)

  df[['visita_control', 'f_muerte', 'fecha_qx']] = df[['visita_control', 'f_muerte', 'fecha_qx']].apply(
      pd.to_datetime, dayfirst=True, errors='coerce'
  )
  df['fecha_evento'] = df['f_muerte'].fillna(df['visita_control'])

  df['overall_survival'] = (df['fecha_evento'] - df['fecha_qx']).dt.days
  df['overall_survival'] = df['overall_survival'].fillna(-1).astype(int)
  df.drop(columns=['fecha_evento'], inplace=True)

  # Select columns

  columns_to_keep = [
    'edad', 'imc', 'tipo_histologico', 'valor_de_ca125', 'metasta_distan', 'ciclos_tto_NAdj',
    'asa', 'afectacion_linf', 'n_gangP_afec', 'recep_est_porcent',
    'beta_cateninap', 'FIGO2023', 'estadificacion_', 'Tributaria_a_Radioterapia',
    'visita_control', 'est_pcte', 'f_muerte', 'numero_de_recid', 'tto_recidiva',
    'Reseccion_macroscopica_complet', 'f_diag', 'Grado', 'ecotv_infiltsub',
    'ecotv_infiltobj', 'estadiaje_pre_i', 'tto_1_quirugico',
    'tamano_tumoral', 'AP_centinela_pelvico', 'AP_glanPaor', 'rece_de_Ppor',
    'estudio_genetico_r01', 'estudio_genetico_r02', 'estudio_genetico_r03',
    'estudio_genetico_r04', 'estudio_genetico_r05', 'estudio_genetico_r06',
    'Tratamiento_RT',
    'Tratamiento_sistemico', 'causa_muerte', 'libre_enferm',
    'fecha_de_recidi', 'tto_recidiva', 'Reseccion_macroscopica_complet'
  ]


  valid_columns = list(dict.fromkeys([col for col in columns_to_keep if col in df.columns]))

  df_selected = df[valid_columns]

  # Imputing NaNs


  num_cols = df_selected.select_dtypes(include=[np.number]).columns

  if len(num_cols) > 0:
      print(f"Imputing {len(num_cols)} numeric columns with KNN...")

      df_selected[num_cols] = imputer.transform(df[num_cols])

  cat_cols = df_selected.select_dtypes(exclude=[np.number]).columns

  if len(cat_cols) > 0:
      print(f"Imputing {len(cat_cols)} categorical columns with Mode...")
      for col in cat_cols:
          if not df_selected[col].mode().empty:
              df_selected[col] = df_selected[col].fillna(df_selected[col].mode()[0])

  df_imputed = df_selected.reset_index(drop=True)

  # One hot encoding

  my_date_cols = ['f_muerte', 'visita_control', 'f_diag', 'fecha_de_recidi']

  df_with_dates = parse_date_columns(df_imputed, my_date_cols)

  # Scaling

  df_final = df_with_dates.copy(deep = True)

  cols_to_scale = df_final.select_dtypes(include=[np.number]).columns

  df_final[cols_to_scale] = scaler.transform(df_final[cols_to_scale])

  return df_final

def parse_date_columns(df, date_col_names):
    """
    Parses specified columns into datetime objects.
    Returns a new DataFrame with the changes.
    """
    # Create a copy so we don't modify the original input dataframe in place
    df_out = df.copy()

    print(f"Parsing {len(date_col_names)} columns as dates...")

    for col in date_col_names:
        if col in df_out.columns:
            # errors='coerce' turns unparseable data into NaT (Not a Time)
            df_out[col] = pd.to_datetime(df_out[col], errors='coerce')
            print(f" -> Parsed '{col}'")
        else:
            print(f" -> Warning: Column '{col}' not found.")

    return df_out

## MAIN

if __name__ == "__main__":
    # Load the model from the file
    load_model()

    dummy_input = np.random.rand(1, 31).astype(np.float64)
    dummy_input[0, 11] = 2.0
    dummy_input = dummy_input[0].tolist()

    (pred_class, probabilities) = predict(dummy_input)
