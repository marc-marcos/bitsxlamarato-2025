import joblib
import numpy as np

MODEL_PATH = "model.joblib"
SCALER_PATH = "scaler.joblib"

model = None

def add_new_data():
    pass

def predict(inputs):
    global model
    # Process data

    inputs_processed = preprocess_once(inputs)

    # Predict

    return predict_processed(inputs_processed)


def predict_processed(input):
    probabilities = model.predict_proba(input)
    pred_class = model.predict(input)

    return (pred_class, probabilities)

def preprocess_once(input_):
    global scaler

    # Manual one hot encoding

    # Scaling
    data_scaled = scaler.transform(input_)

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

    dummy_input = np.random.rand(1, 37).astype(np.float64)

    (pred_class, probabilities) = predict(dummy_input)

    print(pred_class)
    print(probabilities)

    print(f"Generated input shape: {dummy_input.shape}")
    print(f"Input data:\n{dummy_input}")

