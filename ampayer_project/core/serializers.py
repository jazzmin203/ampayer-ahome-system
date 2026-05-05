from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    UserProfile, League, Season, Category, Stadium, Team, Player,
    Game, GameAssignment, AvailabilityBlock, Notification,
    LineupEntry, Play, UmpireReport
)

User = get_user_model()

# -----------------------------------------------------------------------------
# 👤 USER & AUTH SERIALIZERS
# -----------------------------------------------------------------------------

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'certification_level', 'years_experience', 'average_rating']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile']

class UserMinimalSerializer(serializers.ModelSerializer):
    """Lighter serializer for lists and dropdowns."""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role']

# -----------------------------------------------------------------------------
# 🏆 STRUCTURE SERIALIZERS
# -----------------------------------------------------------------------------

class StadiumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stadium
        fields = '__all__'

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    teams = TeamSerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = '__all__'

class SeasonSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Season
        fields = '__all__'

class LeagueSerializer(serializers.ModelSerializer):
    active_season = serializers.SerializerMethodField()
    
    class Meta:
        model = League
        fields = '__all__'
        
    def get_active_season(self, obj):
        active = obj.seasons.filter(is_active=True).first()
        if active:
            return SeasonSerializer(active).data
        return None

# -----------------------------------------------------------------------------
# ⚾ PLAYERS & ROSTERS
# -----------------------------------------------------------------------------

class PlayerSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Player
        fields = '__all__'

class LineupEntrySerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.last_name', read_only=True)
    
    class Meta:
        model = LineupEntry
        fields = '__all__'

# -----------------------------------------------------------------------------
# 🎮 GAME SERIALIZERS
# -----------------------------------------------------------------------------

class GameAssignmentSerializer(serializers.ModelSerializer):
    official = UserMinimalSerializer(read_only=True)
    official_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='official', write_only=True
    )
    
    game_date = serializers.DateField(source='game.date', read_only=True)
    game_title = serializers.CharField(source='game.title', read_only=True)
    assigned_at = serializers.DateTimeField(source='game.created_at', read_only=True) # or a real assigned field if added

    class Meta:
        model = GameAssignment
        fields = '__all__'

class GameListSerializer(serializers.ModelSerializer):
    """Optimized for listing games."""
    stadium_name = serializers.CharField(source='stadium.name', read_only=True)
    local_team_name = serializers.CharField(source='local_team.name', read_only=True)
    visitor_team_name = serializers.CharField(source='visitor_team.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    # Ampayer & Scorer names for display
    ampayer_1_name = serializers.SerializerMethodField()
    ampayer_2_name = serializers.SerializerMethodField()
    ampayer_3_name = serializers.SerializerMethodField()
    scorer_1_name = serializers.SerializerMethodField()
    scorer_2_name = serializers.SerializerMethodField()
    
    def get_ampayer_1_name(self, obj):
        return f"{obj.ampayer_1.first_name} {obj.ampayer_1.last_name}" if obj.ampayer_1 else None
    
    def get_ampayer_2_name(self, obj):
        return f"{obj.ampayer_2.first_name} {obj.ampayer_2.last_name}" if obj.ampayer_2 else None
    
    def get_ampayer_3_name(self, obj):
        return f"{obj.ampayer_3.first_name} {obj.ampayer_3.last_name}" if obj.ampayer_3 else None

    def get_scorer_1_name(self, obj):
        return f"{obj.scorer_1.first_name} {obj.scorer_1.last_name}" if obj.scorer_1 else None

    def get_scorer_2_name(self, obj):
        return f"{obj.scorer_2.first_name} {obj.scorer_2.last_name}" if obj.scorer_2 else None
    
    class Meta:
        model = Game
        fields = [
            'id', 'date', 'time', 'status', 'title',
            'stadium', 'stadium_name', 
            'local_team', 'local_team_name', 
            'visitor_team', 'visitor_team_name', 
            'category', 'category_name',
            'ampayer_1_name', 'ampayer_2_name', 'ampayer_3_name',
            'scorer_1_name', 'scorer_2_name',
            'scorer_1_name', 'scorer_2_name',
            'home_score', 'away_score', 'cancellation_reason'
        ]

class PlaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Play
        fields = '__all__'
        read_only_fields = ['game']

class GameDetailSerializer(serializers.ModelSerializer):
    """Full detail including assignments."""
    assignments = GameAssignmentSerializer(many=True, read_only=True)
    
    # Runners details
    runner_on_1b_info = PlayerSerializer(source='runner_on_1b', read_only=True)
    runner_on_2b_info = PlayerSerializer(source='runner_on_2b', read_only=True)
    runner_on_3b_info = PlayerSerializer(source='runner_on_3b', read_only=True)

    # Names for display
    stadium_name = serializers.CharField(source='stadium.name', read_only=True)
    local_team_name = serializers.CharField(source='local_team.name', read_only=True)
    visitor_team_name = serializers.CharField(source='visitor_team.name', read_only=True)

    plays = PlaySerializer(many=True, read_only=True)
    lineups = LineupEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = [
            'id', 'season', 'category', 'stadium', 'stadium_name', 
            'local_team', 'local_team_name', 
            'visitor_team', 'visitor_team_name',
            'date', 'time', 'status', 'home_score', 'away_score',
            'current_inning', 'inning_half', 'actual_start_time', 'actual_end_time',
            'outs', 'balls', 'strikes',
            'runner_on_1b', 'runner_on_2b', 'runner_on_3b',
            'runner_on_1b_info', 'runner_on_2b_info', 'runner_on_3b_info',
            'assignments', 'cancellation_reason', 'plays', 'lineups'
        ]


# -----------------------------------------------------------------------------
# 📅 AVAILABILITY
# -----------------------------------------------------------------------------

class AvailabilityBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityBlock
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'



class UmpireReportSerializer(serializers.ModelSerializer):
    umpire_name = serializers.CharField(source='umpire.username', read_only=True)
    
    class Meta:
        model = UmpireReport
        fields = '__all__'
        read_only_fields = ['umpire', 'game']

