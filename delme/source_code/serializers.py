from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    UserProfile, League, Season, Category, Stadium, Team, Player,
    Game, GameAssignment, AvailabilityBlock, Notification,
    LineupEntry, Play
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
    
    class Meta:
        model = GameAssignment
        fields = '__all__'

class GameListSerializer(serializers.ModelSerializer):
    """Optimized for listing games."""
    stadium_name = serializers.CharField(source='stadium.name', read_only=True)
    local_team_name = serializers.CharField(source='local_team.name', read_only=True)
    visitor_team_name = serializers.CharField(source='visitor_team.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Game
        fields = [
            'id', 'date', 'time', 'status', 'title',
            'stadium_name', 'local_team_name', 'visitor_team_name', 'category_name'
        ]

class GameDetailSerializer(serializers.ModelSerializer):
    """Full detail including assignments."""
    assignments = GameAssignmentSerializer(many=True, read_only=True)
    # Could include lineups here if needed
    
    class Meta:
        model = Game
        fields = '__all__'


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
