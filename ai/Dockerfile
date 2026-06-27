FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

COPY . .

EXPOSE 5005

ENV PORT=5005

CMD ["gunicorn", "--bind", "0.0.0.0:5005", "app:app"]
