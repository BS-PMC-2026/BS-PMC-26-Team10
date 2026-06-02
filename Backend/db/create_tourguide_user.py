"""
Run this script once to create a demo tour guide account.

Usage:
  cd Backend
  python db/create_tourguide_user.py

The script inserts a row into the admin_users table using bcrypt hashing,
matching exactly what the login endpoint expects.

Default credentials created:
  Email:    guide@chiland.com
  Password: Guide1234!

Change the values below before running if you want different credentials.
"""

import os
import sys
from pathlib import Path

# Ensure the Backend root is on the path regardless of where the script is invoked from
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

FIRST_NAME = "Yael"
LAST_NAME  = "Levi"
EMAIL      = "guide@chiland.com"
PASSWORD   = "Guide1234!"

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

from app.db2 import supabase

existing = supabase.table("admin_users").select("id").eq("email", EMAIL).execute()
if existing.data:
    print(f"A user with email '{EMAIL}' already exists (id={existing.data[0]['id']}). Nothing created.")
    sys.exit(0)

hashed = _pwd.hash(PASSWORD)

result = supabase.table("admin_users").insert({
    "first_name":    FIRST_NAME,
    "last_name":     LAST_NAME,
    "email":         EMAIL,
    "password_hash": hashed,
    "role":          "guide",
}).execute()

if result.data:
    print(f"Tour guide user created successfully!")
    print(f"  Name:     {FIRST_NAME} {LAST_NAME}")
    print(f"  Email:    {EMAIL}")
    print(f"  Password: {PASSWORD}")
    print()
    print("Log in at /staffLogin and then navigate to /tourguide")
else:
    print("Insert failed. Check your Supabase connection and table permissions.")
    sys.exit(1)
