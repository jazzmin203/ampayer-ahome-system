from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import datetime

# ==============================================================================
# 👤 USERS & ROLES
# ==============================================================================

class User(AbstractUser):
    """
    Custom User model.
    Roles determine access levels:
    - SUPERUSER: Platform owner.
    - ADMIN_AMPAYER: Manages referees.
    - LEAGUE_PRESIDENT: Manages specific leagues.
    - AMPAYER: The official on the field.
    - SCORER: Annotated games.
    """
    class Role(models.TextChoices):
        SUPERUSER = "superuser", _("SuperUsuario")
        ADMIN_AMPAYER = "admin_ampayer", _("Administrador de Ampayers")
        LEAGUE_PRESIDENT = "league_president", _("Presidente de Liga")
        AMPAYER = "ampayer", _("Ampayer")
        SCORER = "scorer", _("Anotador")

    role = models.CharField(
        max_length=20, 
        choices=Role.choices, 
        default=Role.AMPAYER
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class UserProfile(models.Model):
    """
    Extended profile for users.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    # Fields for Ampayers/Scorers
    certification_level = models.CharField(max_length=50, blank=True, help_text="Nivel de certificación")
    years_experience = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    
    def __str__(self):
        return f"Profile of {self.user.username}"


# ==============================================================================
# 🏆 LEAGUE MANAGEMENT
# ==============================================================================

class League(models.Model):
    """
    A baseball/softball league.
    """
    president = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        limit_choices_to={'role': User.Role.LEAGUE_PRESIDENT},
        related_name="leagues_managed"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    city = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Season(models.Model):
    """
    A specific season/tournament within a league (e.g., 'Spring 2024').
    """
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="seasons")
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.league.name}"

class Category(models.Model):
    """
    Divisions or Categories (e.g., 'Major', 'Veterans', 'U-12').
    """
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return f"{self.name} ({self.season.name})"


class Stadium(models.Model):
    """
    Venues for games.
    """
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    # E.g., Contact person for the field
    manager_contact = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

# ==============================================================================
# ⚾ TEAMS & PLAYERS
# ==============================================================================

class Team(models.Model):
    """
    A team participating in a category.
    """
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=10, blank=True)
    manager_name = models.CharField(max_length=200, blank=True)
    logo = models.ImageField(upload_to="team_logos/", null=True, blank=True)
    
    # Legacy field kept for compatibility, but `category` is preferred now
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="teams", null=True, blank=True)

    def __str__(self):
        return f"{self.name}"

class Player(models.Model):
    """
    A player on a team.
    """
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="players")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    jersey_number = models.PositiveIntegerField()
    positions = models.CharField(max_length=100, help_text="Comma-separated positions (e.g., 'P, SS')")
    photo = models.ImageField(upload_to="player_photos/", null=True, blank=True)
    
    # Stats Summary (Cached for performance)
    avg = models.DecimalField(max_digits=4, decimal_places=3, default=0.000)
    hr = models.PositiveIntegerField(default=0)
    rbi = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"#{self.jersey_number} {self.first_name} {self.last_name}"


# ==============================================================================
# 🎮 GAME MANAGEMENT
# ==============================================================================

class Game(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", _("Pendiente")
        ASSIGNED = "assigned", _("Asignado")
        CONFIRMED = "confirmed", _("Confirmado")
        IN_PROGRESS = "in_progress", _("En Juego")
        FINISHED = "finished", _("Finalizado")
        CANCELLED = "cancelled", _("Cancelado")
        SUSPENDED = "suspended", _("Suspendido")

    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="games", null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="games")
    stadium = models.ForeignKey(Stadium, on_delete=models.CASCADE, related_name="games")
    
    local_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="home_games")
    visitor_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="away_games")
    
    date = models.DateField()
    time = models.TimeField()
    expected_duration = models.DurationField(default=datetime.timedelta(hours=2))
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Staff Assignments
    # We can use M2M or separate model. Keeping separate model for detailed status (GameAssignment).
    # But for quick access we might want helpers.
    
    scorer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        limit_choices_to={'role': User.Role.SCORER},
        related_name="scored_games"
    )

    # Result
    home_score = models.PositiveIntegerField(default=0)
    away_score = models.PositiveIntegerField(default=0)
    
    # Validations
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "time"]

    def __str__(self):
        return f"{self.local_team} vs {self.visitor_team} ({self.date})"
    
    def title(self):
        return f"{self.local_team.short_name} vs {self.visitor_team.short_name}"


class GameAssignment(models.Model):
    """
    Tracks the assignment of officials (Ampayers) to a game.
    """
    class Status(models.TextChoices):
        ASSIGNED = "assigned", _("Asignado")
        ACCEPTED = "accepted", _("Aceptado")
        REJECTED = "rejected", _("Rechazado")
        REVOKED = "revoked", _("Revocado")

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="assignments")
    official = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assignments")
    role_in_game = models.CharField(max_length=50, default="Base Umpire", help_text="e.g., Home Plate, First Base")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ASSIGNED)
    
    notified_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('game', 'official')

    def __str__(self):
        return f"{self.official} - {self.game}"


# ==============================================================================
# 📝 SCORING & STATS (ADVANCED)
# ==============================================================================

class LineupEntry(models.Model):
    """
    A player in the batting order for a specific game.
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="lineups")
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    batting_order = models.PositiveIntegerField(help_text="1-9")
    field_position = models.CharField(max_length=10, help_text="P, C, 1B, etc.")
    
    class Meta:
        ordering = ['game', 'team', 'batting_order']
        unique_together = ('game', 'team', 'batting_order')

    def __str__(self):
        return f"{self.batting_order}. {self.player} ({self.field_position})"

class Play(models.Model):
    """
    Play-by-play granular data.
    The heart of the digital scoring system.
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="plays")
    inning = models.PositiveIntegerField()
    half_inning = models.CharField(max_length=10, choices=[('top', 'Top'), ('bottom', 'Bottom')])
    
    batter = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="at_bats")
    pitcher = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="pitched_against")
    
    # Action details
    result = models.CharField(max_length=50, help_text="Single, Strikeout, Walk, HR, etc.")
    description = models.CharField(max_length=255, blank=True)
    
    # Quantifiers
    rbi = models.PositiveIntegerField(default=0)
    runs_scored = models.PositiveIntegerField(default=0)
    outs_recorded = models.PositiveIntegerField(default=0)
    
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inning {self.inning} ({self.half_inning}): {self.result}"


# ==============================================================================
# 📅 AVAILABILITY & OPTIMIZATION (AI)
# ==============================================================================

class AvailabilityBlock(models.Model):
    """
    Time blocks when an Official is NOT available (or Available).
    Used by the AI Engine.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="availability")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    reason = models.CharField(max_length=100, blank=True)
    is_available = models.BooleanField(default=False, help_text="If False, this user cannot be assigned.")

    def __str__(self):
        status = "Available" if self.is_available else "Unavailable"
        return f"{self.user}: {status} {self.start_time}"

class OptimizationRequest(models.Model):
    """
    Log of AI optimization runs.
    """
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="pending") # pending, processing, completed, failed
    result_summary = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Optimization {self.id} - {self.status}"


# ==============================================================================
# 🔔 NOTIFICATIONS
# ==============================================================================

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional link to objects
    game = models.ForeignKey(Game, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.user}"
