
import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import User, League, Season, Category, Stadium, Team, Player, Game, GameAssignment

User = get_user_model()

def create_test_users():
    print("Creating test users...")
    roles = {
        'admin_user': User.Role.ADMIN_AMPAYER,
        'pres_user': User.Role.LEAGUE_PRESIDENT,
        'amp_1': User.Role.AMPAYER,
        'amp_2': User.Role.AMPAYER,
        'scorer_1': User.Role.SCORER,
        'scorer_2': User.Role.SCORER,
    }
    
    for username, role in roles.items():
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@example.com',
                'first_name': username.replace('_', ' ').title(),
                'last_name': 'Test',
                'role': role
            }
        )
        if created:
            user.set_password('pass123')
            user.save()
            print(f"Created {username} as {role}")
        else:
            print(f"{username} already exists")

def create_mock_data():
    print("Creating mock data...")
    
    # League & Season
    pres = User.objects.filter(role=User.Role.LEAGUE_PRESIDENT).first()
    league, _ = League.objects.get_or_create(
        slug='liga-bernal',
        defaults={'name': 'Liga Profe Bernal', 'city': 'Hermosillo', 'president': pres}
    )
    
    season, _ = Season.objects.get_or_create(
        league=league,
        name='Temporada Primavera 2024',
        defaults={'start_date': '2024-03-01', 'end_date': '2024-06-30', 'is_active': True}
    )
    
    cat, _ = Category.objects.get_or_create(
        season=season,
        name='Primera Fuerza',
        defaults={'description': 'Nivel profesional'}
    )
    
    stadium, _ = Stadium.objects.get_or_create(
        name='Estadio Municipal',
        defaults={'address': 'Av. Beisbol 123'}
    )
    
    # Teams
    team_a, _ = Team.objects.get_or_create(
        category=cat,
        name='Tigres de la Sierra',
        defaults={'short_name': 'TIG'}
    )
    team_b, _ = Team.objects.get_or_create(
        category=cat,
        name='Diablos Rojos',
        defaults={'short_name': 'DIA'}
    )
    
    # Game
    game, _ = Game.objects.get_or_create(
        local_team=team_a,
        visitor_team=team_b,
        date='2024-06-15',
        defaults={
            'season': season,
            'category': cat,
            'stadium': stadium,
            'time': '18:00',
            'status': Game.Status.PENDING
        }
    )
    
    # Assign Ampayer
    amp = User.objects.filter(role=User.Role.AMPAYER).first()
    GameAssignment.objects.get_or_create(
        game=game,
        official=amp,
        defaults={'role_in_game': 'Home Plate'}
    )
    
    # Assign Scorer
    scorer = User.objects.filter(role=User.Role.SCORER).first()
    game.scorer = scorer
    game.save()
    
    print("Mock data created successfully.")

if __name__ == "__main__":
    create_test_users()
    create_mock_data()
