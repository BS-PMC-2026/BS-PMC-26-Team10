import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="postgres",
        user="postgres",
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT")
    )