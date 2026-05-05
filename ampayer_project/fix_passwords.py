import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import User

users_to_fix = ['frank_bernal', 'president']
for username in users_to_fix:
    try:
        u = User.objects.get(username=username)
        u.set_password('pass123')
        u.is_active = True
        u.save()
        print(f"Password reset for: {username}")
    except User.DoesNotExist:
        print(f"User not found: {username}")
