import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

pwd = 'pass123'
print(f"{'USERNAME':30s} | {'ROL':20s} | {'ACTIVO':6s} | PASS=pass123")
print("-" * 85)
for u in User.objects.all().order_by('role', 'username'):
    ok = u.check_password(pwd)
    print(f"{u.username:30s} | {u.role:20s} | {str(u.is_active):6s} | {ok}")

print(f"\nTotal usuarios: {User.objects.count()}")
