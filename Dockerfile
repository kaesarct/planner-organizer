FROM python:3.12.12-slim


WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000 5678

CMD ["python", "-u", "-m", "ptvsd", "--host", "0.0.0.0", "--port", "5678", "main.py"]