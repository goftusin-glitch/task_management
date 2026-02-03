from passlib.context import CryptContext
import bcrypt
print(f"Bcrypt version in test: {bcrypt.__version__}")
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    h = pwd_context.hash("test")
    print(f"Hash: {h}")
    v = pwd_context.verify("test", h)
    print(f"Verify: {v}")
except Exception as e:
    import traceback
    traceback.print_exc()
