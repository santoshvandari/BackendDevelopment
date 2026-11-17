# Survey Builder Backend

FastAPI + SQLModel backend for creating surveys, submitting responses, and viewing analytics.

---

## Quickstart

```bash
# 1. Activate virtual environment
source venv/bin/activate

# 2. Setup environment variables
cp .env.example .env

# 3. Start server
uvicorn main:app --reload --port 8000
```

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Authentication

Uses a single admin account defined strictly via environment variables with **HttpOnly** cookies.

- Generate password hash for `.env`:
  ```bash
  python -c "from pwdlib import PasswordHash; print(PasswordHash.recommended().hash('YOUR_PASSWORD'))"
  ```

---

## Endpoints

### Auth
- `POST /api/auth/token` - Login (sets HttpOnly cookie)
- `POST /api/auth/logout` - Logout (clears cookie)
- `GET /api/auth/me` - Get current admin info

### Surveys
- `GET /api/surveys/?page=1&page_size=10` - List surveys (paginated)
- `POST /api/surveys/` - Create survey with questions & options *(Admin)*
- `GET /api/surveys/{id}` - Get survey details
- `PUT /api/surveys/{id}` - Update survey *(Admin)*
- `DELETE /api/surveys/{id}` - Delete survey *(Admin)*

### Responses & Analytics
- `POST /api/surveys/{id}/responses` - Submit answers (public)
- `GET /api/surveys/{id}/analytics` - Aggregated results *(Admin)*
