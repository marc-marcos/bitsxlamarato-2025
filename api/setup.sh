#!/bin/bash

VENV_NAME="venv"
REQUIREMENTS_FILE="requirements.txt"
API_FILE="api:app"  

set -e

if [ ! -d "$VENV_NAME" ]; then
    python3 -m venv $VENV_NAME
else
    echo "Entorno virtual ya existente."
fi

source $VENV_NAME/bin/activate

if [ -f "$REQUIREMENTS_FILE" ]; then
    pip install -r $REQUIREMENTS_FILE
else
    echo "No se encontró $REQUIREMENTS_FILE."
fi

uvicorn $API_FILE --reload --host 127.0.0.1 --port 8000