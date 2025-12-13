## CheckTheRisk

Prototipo de hackathon para el reto **Hack the Uterus! — NEST (NSMP Endometrial Stratification Tool)**.

La aplicación está pensada para personal clínico y permite:
- **Login** (con soporte de *modo demo* sin backend).
- **Dashboard** (actualmente: importación y vista previa de CSV/JSON).

> Aviso: prototipo de hackathon. No sustituye el juicio clínico ni guías clínicas.

### Frontends

Este repo incluye:

- `main.py` y `views/`: UI original en **Flet (Python)**.
- `web/`: UI web en **Angular + Angular Material** (migración).

### Ejecutar (Angular)

Requiere Node + gestor de paquetes (recomendado `pnpm`).

```bash
cd web
pnpm install
pnpm start
```

Por defecto busca el backend en `http://localhost:8000` (ajustable en `web/src/environments/environment.ts`).

### Ejecutar (Flet)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Por defecto busca el backend en `http://localhost:8000` (ajustable en `core/config.py`).

### Endpoints esperados (backend futuro)

- `POST /auth/login` → `{ access_token, user }`
- `GET /auth/me`
- `POST /risk/predict` → `{ risk_score, risk_category, probabilities, explanation, recommendations }`
- `POST /patients/upload` (CSV)
