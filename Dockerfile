FROM python:3.11-slim

WORKDIR /app

# requirements.txt из корня
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# копируем только backend внутрь контейнера
COPY backend/ .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
