import bcrypt
try:
    print(f"Bcrypt version: {bcrypt.__version__}")
except:
    print("No bcrypt.__version__")

try:
    print(f"Bcrypt about: {bcrypt.__about__}")
except AttributeError:
    print("No bcrypt.__about__")

try:
    print(f"Bcrypt about version: {bcrypt.__about__.__version__}")
except:
    pass
