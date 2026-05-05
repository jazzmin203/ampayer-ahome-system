import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Verificar los 3 usuarios clave
test_users = ['pres_ahome', 'mario_alberto', 'moreno_ahumada']

for username in test_users:
    try:
        u = User.objects.get(username=username)
        can_login = u.check_password('pass123')
        print(f"User: {u.username:25s} | Role: {u.role:20s} | Active: {u.is_active} | Password OK: {can_login}")
        if not can_login:
            print(f"  -> Resetting password...")
            u.set_password('pass123')
            u.save()
            print(f"  -> Password reset to 'pass123'")
    except User.DoesNotExist:
        print(f"User: {username:25s} | NOT FOUND!")

print("\n--- All users by role ---")
for role_val, role_label in User.Role.choices:
    count = User.objects.filter(role=role_val).count()
    print(f"  {role_label}: {count}")
