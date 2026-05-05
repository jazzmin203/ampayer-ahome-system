import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from django.contrib.auth import get_user_model

def activate_all_users():
    User = get_user_model()
    users = User.objects.all()
    
    if not users.exists():
        print("No hay usuarios en la base de datos. Creando superusuario por defecto...")
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Superusuario 'admin' creado con contraseña 'admin123'.")
        return

    count = 0
    for u in users:
        u.is_active = True
        u.set_password('password123')
        u.save()
        count += 1
        print(f"- Usuario activado y contraseña reseteada: {u.username}")
        
    print(f"\n¡Se han activado {count} usuarios y sus contraseñas ahora son 'password123'!")

if __name__ == "__main__":
    activate_all_users()
