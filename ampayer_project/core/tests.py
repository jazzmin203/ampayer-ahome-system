from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from .models import Game, Team, Category, Season, League, Stadium, Player, User, LineupEntry, Play

class ScoringLogicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Setup basic data
        self.user = User.objects.create_user(username='ampayer', password='password', role=User.Role.AMPAYER)
        self.client.force_authenticate(user=self.user)
        
        self.league = League.objects.create(name="Test League", slug="test-league", city="Test City") # Added city
        self.season = Season.objects.create(league=self.league, name="Test Season", start_date="2024-01-01", end_date="2024-12-31")
        self.category = Category.objects.create(season=self.season, name="Major")
        self.stadium = Stadium.objects.create(name="Test Stadium")
        
        self.local_team = Team.objects.create(category=self.category, name="Local Team", short_name="LOC")
        self.visitor_team = Team.objects.create(category=self.category, name="Visitor Team", short_name="VIS")
        
        # Create players for batter/pitcher fields
        self.batter = Player.objects.create(team=self.visitor_team, first_name="Batter", last_name="One", jersey_number=1, positions="OF")
        self.pitcher = Player.objects.create(team=self.local_team, first_name="Pitcher", last_name="One", jersey_number=1, positions="P")

        self.game = Game.objects.create(
            season=self.season,
            category=self.category,
            stadium=self.stadium,
            local_team=self.local_team,
            visitor_team=self.visitor_team,
            date=timezone.now().date(),
            time=timezone.now().time(),
            status=Game.Status.IN_PROGRESS,
            current_inning=1,
            inning_half='top',
            outs=0,
            ampayer_1=self.user # Assign user so they have permission
        )
        
        self.record_play_url = reverse('game-record-play', args=[self.game.id])

    def test_record_out_increments_outs(self):
        """Test that recording an out increments the outs counter."""
        data = {
            'event_type': 'Strikeout',
            'outs_recorded': 1,
            'inning': 1,
            'half': 'top',
            'batter': self.batter.id,
            'pitcher': self.pitcher.id
        }
        response = self.client.post(self.record_play_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.game.refresh_from_db()
        self.assertEqual(self.game.outs, 1)
        self.assertEqual(self.game.inning_half, 'top')

    def test_inning_transition_top_to_bottom(self):
        """Test transition from Top to Bottom after 3rd out."""
        self.game.outs = 2
        self.game.save()
        
        data = {
            'event_type': 'Strikeout',
            'outs_recorded': 1,
            'inning': 1,
            'half': 'top',
            'batter': self.batter.id,
            'pitcher': self.pitcher.id
        }
        response = self.client.post(self.record_play_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.game.refresh_from_db()
        self.assertEqual(self.game.outs, 0)
        self.assertEqual(self.game.inning_half, 'bottom')
        self.assertEqual(self.game.current_inning, 1) # Still inning 1

    def test_inning_transition_bottom_to_next_top(self):
        """Test transition from Bottom to Top of next inning after 3rd out."""
        self.game.outs = 2
        self.game.inning_half = 'bottom'
        self.game.save()
        
        data = {
            'event_type': 'Strikeout',
            'outs_recorded': 1,
            'inning': 1,
            'half': 'bottom',
            'batter': self.batter.id, # Technically should be local team batter but for logic test it's fine
            'pitcher': self.pitcher.id
        }
        response = self.client.post(self.record_play_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.game.refresh_from_db()
        self.assertEqual(self.game.outs, 0)
        self.assertEqual(self.game.inning_half, 'top')
        self.assertEqual(self.game.current_inning, 2)

class LineupStatsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='ampayer2', password='password', role=User.Role.AMPAYER)
        self.client.force_authenticate(user=self.user)
        
        self.league = League.objects.create(name="Stat League", slug="stat-league", city="Stat City")
        self.season = Season.objects.create(league=self.league, name="2024", start_date="2024-01-01", end_date="2024-12-31")
        self.category = Category.objects.create(season=self.season, name="Stats")
        self.stadium = Stadium.objects.create(name="Stat Stadium")
        
        self.local_team = Team.objects.create(category=self.category, name="L", short_name="L")
        self.visitor_team = Team.objects.create(category=self.category, name="V", short_name="V")
        
        self.batter = Player.objects.create(team=self.visitor_team, first_name="B", last_name="1", jersey_number=10, positions="OF")
        self.pitcher = Player.objects.create(team=self.local_team, first_name="P", last_name="1", jersey_number=20, positions="P")
        
        self.game = Game.objects.create(
            season=self.season, category=self.category, stadium=self.stadium,
            local_team=self.local_team, visitor_team=self.visitor_team,
            date=timezone.now().date(), time=timezone.now().time(),
            status=Game.Status.IN_PROGRESS, current_inning=1, inning_half='top',
            ampayer_1=self.user
        )
        
        self.record_play_url = reverse('game-record-play', args=[self.game.id])
        self.save_lineup_url = reverse('game-save-lineup', args=[self.game.id])

    def test_save_lineup_creates_entries(self):
        """Test that save_lineup correctly creates LineupEntry records."""
        data = {
            'lineup': [
                {
                    'player': self.batter.id,
                    'batting_order': 1,
                    'team': self.visitor_team.id,
                    'field_position': 'CF'
                }
            ]
        }
        response = self.client.post(self.save_lineup_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertTrue(LineupEntry.objects.filter(game=self.game, player=self.batter).exists())
        entry = LineupEntry.objects.get(game=self.game, player=self.batter)
        self.assertEqual(entry.field_position, 'CF')

    def test_record_hit_updates_stats(self):
        """Test that recording a hit updates LineupEntry stats."""
        # First ensure lineup exists
        LineupEntry.objects.create(
            game=self.game, team=self.visitor_team, player=self.batter,
            batting_order=1, field_position='CF'
        )
        
        data = {
            'event_type': 'Single',
            'runs_scored': 0,
            'inning': 1,
            'half': 'top',
            'batter': self.batter.id,
            'pitcher': self.pitcher.id,
            'runner_on_1b': self.batter.id # Batter moves to 1B
        }
        response = self.client.post(self.record_play_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        entry = LineupEntry.objects.get(game=self.game, player=self.batter)
        self.assertEqual(entry.PA, 1)
        self.assertEqual(entry.AB, 1)
        self.assertEqual(entry.H, 1)
        self.assertEqual(entry.singles, 1)

    def test_record_homerun_updates_stats_and_score(self):
        """Test that recording a HR updates stats, runs and team score."""
        LineupEntry.objects.create(
            game=self.game, team=self.visitor_team, player=self.batter,
            batting_order=1, field_position='CF'
        )
        
        data = {
            'event_type': 'Homerun',
            'runs_scored': 1,
            'rbi': 1,
            'inning': 1,
            'half': 'top',
            'batter': self.batter.id,
            'pitcher': self.pitcher.id
        }
        response = self.client.post(self.record_play_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        entry = LineupEntry.objects.get(game=self.game, player=self.batter)
        self.assertEqual(entry.H, 1)
        self.assertEqual(entry.HR, 1)
        self.assertEqual(entry.R, 1)
        self.assertEqual(entry.RBI, 1)
        
        self.game.refresh_from_db()
        self.assertEqual(self.game.away_score, 1)
