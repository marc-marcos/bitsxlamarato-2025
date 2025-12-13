import joblib
import numpy as np

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


def retrain():
    pass

def load_model():
    global model
    global scaler

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

if __name__ == "__main__":
    # Load the model from the file
    load_model()

    dummy_input = np.random.rand(1, 31).astype(np.float64)
    dummy_input[0, 11] = 2.0
    dummy_input = dummy_input[0].tolist()

    (pred_class, probabilities) = predict(dummy_input)

