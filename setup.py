import os
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path("backend")
VENV_DIR = BACKEND_DIR / ".venv"

def run(cmd):
    print(f"> {cmd}")
    subprocess.check_call(cmd, shell=True)

def main():
    print("=== SmartCart Backend Auto-Setup ===")

    # 1. Check backend folder exists
    if not BACKEND_DIR.exists():
        print("Error: backend/ directory not found. Run this from the project root.")
        sys.exit(1)

    # 2. Create venv if missing
    if not VENV_DIR.exists():
        print("Creating virtual environment...")
        run(f"{sys.executable} -m venv {VENV_DIR}")
    else:
        print("Virtual environment already exists.")

    # 3. Install dependencies
    pip_path = (
        VENV_DIR / "Scripts" / "pip.exe"  # Windows
        if os.name == "nt"
        else VENV_DIR / "bin" / "pip"     # macOS/Linux
    )

    print("Installing dependencies from backend/requirements.txt...")
    requirements = BACKEND_DIR / "requirements.txt"

    if not requirements.exists():
        print("Error: backend/requirements.txt not found.")
        sys.exit(1)

    run(f"\"{pip_path}\" install -r \"{requirements}\"")

    print("\n=== Setup Complete ===")
    print("Your backend environment is ready!")
    print("To run the backend, execute:")
    if os.name == "nt":
        print("  backend\\.venv\\Scripts\\activate && uvicorn app.main:app --reload")
    else:
        print("  source backend/.venv/bin/activate && uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
