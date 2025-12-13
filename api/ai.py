import joblib
import numpy as np

MODEL_PATH = "model.joblib"
model = None

def add_new_data():
    pass

def predict(inputs):
    global model

    probabilities = model.predict_proba(dummy_input)
    pred_class = model.predict(dummy_input)

    return (pred_class, probabilities)

def preprocess_once(input_):
    pass

def retrain():
    pass

def load_model():
    global model

    model = joblib.load(MODEL_PATH)

if __name__ == "__main__":
    # Load the model from the file
    load_model()

    dummy_input = np.random.rand(1, 37).astype(np.float64)

    (pred_class, probabilities) = predict(dummy_input)

    print(pred_class)
    print(probabilities)

    print(f"Generated input shape: {dummy_input.shape}")
    print(f"Input data:\n{dummy_input}")

