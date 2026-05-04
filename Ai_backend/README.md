# FastAPI Project

A simple FastAPI backend application.

---

# Prerequisites

Make sure the following are installed:

- Python 3.9+
- pip

Check installation:

```bash
python --version
pip --version
```

---

# Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

---

# Create Virtual Environment

### Windows

```bash
python -m venv venv
```

### Mac / Linux

```bash
python3 -m venv venv
```

---

# Activate Virtual Environment

### Windows (PowerShell / CMD)

```bash
venv\Scripts\activate
```

### Mac / Linux

```bash
source venv/bin/activate
```

After activation you should see:

```
(venv)
```

---

# Install Dependencies

Install all required packages using `requirements.txt`.

```bash
pip install -r requirements.txt
```

---

# Run the Application

Start the FastAPI development server:

```bash
uvicorn main:app --reload
```

# API Access

Once the server starts, open:

### Application

```
http://127.0.0.1:8000
```

### Swagger API Docs

```
http://127.0.0.1:8000/docs
```

### ReDoc Documentation

```
http://127.0.0.1:8000/redoc
```

---

# Generate requirements.txt (for developers)

If new packages are installed:

```bash
pip freeze > requirements.txt
```

---

# Deactivate Virtual Environment

When finished working:

```bash
deactivate
```

---

# Production Run

Run without auto-reload:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
