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

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.SUPERUSER
        super().save(*args, **kwargs)

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
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    google_maps_url = models.URLField(blank=True, null=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    field_dimensions = models.JSONField(null=True, blank=True)
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
    first_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')
    jersey_number = models.PositiveIntegerField(null=True, blank=True)
    positions = models.CharField(max_length=100, blank=True, default='', help_text="Comma-separated positions (e.g., 'P, SS')")
    photo = models.ImageField(upload_to="player_photos/", null=True, blank=True)
    
    # Stats Summary (Cached for performance)
    avg = models.DecimalField(max_digits=4, decimal_places=3, default=0.000)
    hr = models.PositiveIntegerField(default=0)
    rbi = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"#{self.jersey_number if self.jersey_number is not None else ''} {self.first_name} {self.last_name}"


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
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    
    # Game Context
    current_inning = models.PositiveIntegerField(default=1)
    inning_half = models.CharField(max_length=10, choices=[('top', 'Top'), ('bottom', 'Bottom')], default='top')
    outs = models.IntegerField(default=0)
    balls = models.IntegerField(default=0)
    strikes = models.IntegerField(default=0)
    runner_on_1b = models.ForeignKey('Player', on_delete=models.SET_NULL, null=True, blank=True, related_name='games_on_1b')
    runner_on_2b = models.ForeignKey('Player', on_delete=models.SET_NULL, null=True, blank=True, related_name='games_on_2b')
    runner_on_3b = models.ForeignKey('Player', on_delete=models.SET_NULL, null=True, blank=True, related_name='games_on_3b')

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    cancellation_reason = models.TextField(blank=True, null=True, help_text="Motivo de la cancelación")
        
    # Staff Assignments
    # We can use M2M or separate model. Keeping separate model for detailed status (GameAssignment).
    # But for quick access we might want helpers.
    
    # Scorers
    scorer_1 = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="scored_games_1",
        help_text="Anotador Oficial"
    )
    scorer_2 = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="scored_games_2",
        help_text="Anotador Auxiliar"
    )

    # Multiple Ampayers (2-3 per game)
    ampayer_1 = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': User.Role.AMPAYER},
        related_name="games_as_ampayer_1"
    )
    ampayer_2 = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': User.Role.AMPAYER},
        related_name="games_as_ampayer_2"
    )
    ampayer_3 = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': User.Role.AMPAYER},
        related_name="games_as_ampayer_3"
    )

    # Result
    home_score = models.PositiveIntegerField(default=0)
    away_score = models.PositiveIntegerField(default=0)
    home_hits = models.PositiveIntegerField(default=0)
    away_hits = models.PositiveIntegerField(default=0)
    home_errors = models.PositiveIntegerField(default=0)
    away_errors = models.PositiveIntegerField(default=0)
    
    # Additional Game Info
    sponsor = models.CharField(max_length=200, blank=True, null=True, help_text="Patrocinador del juego")
    modality = models.CharField(max_length=100, blank=True, null=True, help_text="Modalidad del juego")
    
    # Post-Game Data
    winning_pitcher = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="games_won",
        help_text="Pitcher ganador"
    )
    losing_pitcher = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="games_lost",
        help_text="Pitcher perdedor"
    )
    game_highlights = models.TextField(blank=True, null=True, help_text="Lo más sobresaliente del juego")
    general_comments = models.TextField(blank=True, null=True, help_text="Comentarios generales")
    service_rating = models.CharField(
        max_length=20,
        choices=[('malo', 'Malo'), ('regular', 'Regular'), ('bueno', 'Bueno')],
        blank=True,
        null=True,
        help_text="Calificación del servicio"
    )
    
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
    A player in the batting order for a specific game with detailed offensive statistics.
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="lineups")
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    batting_order = models.PositiveIntegerField(help_text="1-9")
    field_position = models.CharField(max_length=10, help_text="P, C, 1B, etc.")
    
    # History and Substitution Info
    is_active = models.BooleanField(default=True, help_text="¿Sigue en el juego?")
    entry_inning = models.PositiveIntegerField(default=1, help_text="Entrada en la que entró")
    exit_inning = models.PositiveIntegerField(null=True, blank=True, help_text="Entrada en la que salió")
    
    # Offensive Statistics
    PA = models.PositiveIntegerField(default=0, help_text="Apariciones al plato")
    AB = models.PositiveIntegerField(default=0, help_text="Turnos al bat")
    R = models.PositiveIntegerField(default=0, help_text="Carreras anotadas")
    H = models.PositiveIntegerField(default=0, help_text="Hits")
    singles = models.PositiveIntegerField(default=0, help_text="Sencillos (1B)")
    doubles = models.PositiveIntegerField(default=0, help_text="Dobles (2B)")
    triples = models.PositiveIntegerField(default=0, help_text="Triples (3B)")
    HR = models.PositiveIntegerField(default=0, help_text="Home Runs")
    RBI = models.PositiveIntegerField(default=0, help_text="Carreras impulsadas")
    BB = models.PositiveIntegerField(default=0, help_text="Base por bolas")
    IBB = models.PositiveIntegerField(default=0, help_text="Base por bolas intencional")
    HBP = models.PositiveIntegerField(default=0, help_text="Golpeado por lanzamiento")
    SO = models.PositiveIntegerField(default=0, help_text="Ponches")
    SH = models.PositiveIntegerField(default=0, help_text="Toque de sacrificio")
    SF = models.PositiveIntegerField(default=0, help_text="Elevado de sacrificio")
    SB = models.PositiveIntegerField(default=0, help_text="Base robada")
    CS = models.PositiveIntegerField(default=0, help_text="Atrapado robando")
    LOB = models.PositiveIntegerField(default=0, help_text="Corredores dejados en base")
    TB = models.PositiveIntegerField(default=0, help_text="Total de bases")
    
    # Pitching Statistics
    IP_outs = models.PositiveIntegerField(default=0, help_text="Outs conseguidos como pitcher (3 = 1 entrada)")
    pitch_H = models.PositiveIntegerField(default=0, help_text="Hits permitidos")
    pitch_R = models.PositiveIntegerField(default=0, help_text="Carreras permitidas")
    pitch_ER = models.PositiveIntegerField(default=0, help_text="Carreras limpias permitidas")
    pitch_BB = models.PositiveIntegerField(default=0, help_text="Bases por bolas otorgadas")
    pitch_SO = models.PositiveIntegerField(default=0, help_text="Ponches recetados")
    pitch_HR = models.PositiveIntegerField(default=0, help_text="Home runs permitidos")
    pitch_win = models.BooleanField(default=False)
    pitch_loss = models.BooleanField(default=False)
    pitch_save = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['game', 'team', 'batting_order', 'entry_inning']
        # Relaxed unique_together to allow multiple players in the same batting order over time
        # unique_together = ('game', 'team', 'batting_order')

    def __str__(self):
        return f"{self.batting_order}. {self.player} ({self.field_position})"
    
    # Calculated Stats
    def calculate_avg(self):
        """Promedio de bateo (AVG/BA)"""
        return round(self.H / self.AB, 3) if self.AB > 0 else 0.000
    
    def calculate_obp(self):
        """Porcentaje de embasado (OBP)"""
        denominator = self.AB + self.BB + self.HBP + self.SF
        if denominator == 0:
            return 0.000
        numerator = self.H + self.BB + self.HBP
        return round(numerator / denominator, 3)
    
    def calculate_slg(self):
        """Slugging (SLG)"""
        if self.AB == 0:
            return 0.000
        total_bases = self.singles + (self.doubles * 2) + (self.triples * 3) + (self.HR * 4)
        return round(total_bases / self.AB, 3)
    
    def calculate_ops(self):
        """OPS = OBP + SLG"""
        return round(self.calculate_obp() + self.calculate_slg(), 3)

class Play(models.Model):
    """
    Granular play-by-play event.
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="plays")
    inning = models.PositiveIntegerField()
    half = models.CharField(max_length=10, choices=[('top', 'Top'), ('bottom', 'Bottom')])
    batter = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="plays_as_batter")
    pitcher = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="plays_as_pitcher")
    
    # Event
    # Event
    event_type = models.CharField(max_length=50, help_text="Single, Double, Out, etc.")
    description = models.TextField(blank=True, null=True)
    runs_scored = models.PositiveIntegerField(default=0)
    
    # Detailed Scoring
    outs_recorded = models.PositiveIntegerField(default=0)
    fielders_involved = models.CharField(
        max_length=50, 
        blank=True, 
        help_text="Posiciones involucradas (e.g., '6-3', 'F8')"
    )
    is_hit = models.BooleanField(default=False)
    is_error = models.BooleanField(default=False)
    error_player = models.ForeignKey(
        Player, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="errors_committed"
    )
    
    # Base Running (Simplified for now)
    runner_on_1st_moved_to = models.PositiveIntegerField(null=True, blank=True, help_text="Base 2, 3, or 4 (Home)")
    runner_on_2nd_moved_to = models.PositiveIntegerField(null=True, blank=True)
    runner_on_3rd_moved_to = models.PositiveIntegerField(null=True, blank=True)
    
    # Substitutions
    is_substitution = models.BooleanField(default=False)
    incoming_player = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name="sub_in")
    outgoing_player = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name="sub_out")
    position_change = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. 'P' or '1B'")

    # Special Events
    is_sacrifice = models.BooleanField(default=False)
    is_fielders_choice = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['game', 'inning', 'created_at']
    
    def __str__(self):
        return f"Inning {self.inning} ({self.half}): {self.event_type}"

class UmpireReport(models.Model):
    """
    Report submitted by an Umpire after a game.
    Visible to Admin and League President.
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="umpire_reports")
    umpire = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submitted_reports")
    content = models.TextField(help_text="Detalles del reporte (incidentes, estado del campo, etc.)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reporte de {self.umpire} para {self.game}"


class PitchingStats(models.Model):
    """
    Detailed pitching statistics for a player in a specific game.
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="pitching_stats")
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="pitching_performances")
    
    # Pitching Statistics
    IP = models.DecimalField(max_digits=4, decimal_places=1, default=0.0, help_text="Entradas lanzadas")
    BF = models.PositiveIntegerField(default=0, help_text="Bateadores enfrentados")
    H = models.PositiveIntegerField(default=0, help_text="Hits permitidos")
    R = models.PositiveIntegerField(default=0, help_text="Carreras")
    ER = models.PositiveIntegerField(default=0, help_text="Carreras limpias")
    BB = models.PositiveIntegerField(default=0, help_text="Bases por bolas")
    SO = models.PositiveIntegerField(default=0, help_text="Ponches")
    
    # Game Result
    is_winner = models.BooleanField(default=False, help_text="Pitcher ganador")
    is_loser = models.BooleanField(default=False, help_text="Pitcher perdedor")
    
    class Meta:
        unique_together = ('game', 'player')
        verbose_name_plural = "Pitching Stats"
    
    def __str__(self):
        return f"{self.player} - {self.game} ({self.IP} IP)"
    
    def calculate_era(self):
        """Efectividad (ERA)"""
        if self.IP == 0:
            return 0.00
        return round((self.ER * 9) / float(self.IP), 2)


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
    
    # Extended functionality
    notification_type = models.CharField(max_length=50, choices=[
        ('game_assignment', 'Asignación de Juego'),
        ('game_reminder', 'Recordatorio de Juego'),
        ('game_cancellation', 'Cancelación de Juego'),
        ('score_request', 'Solicitud de Anotación'),
        ('general_info', 'Información General'),
    ], default='general_info')
    
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pendiente'),
        ('accepted', 'Aceptada'),
        ('rejected', 'Rechazada'),
    ], default='pending')
    
    accepted_at = models.DateTimeField(null=True, blank=True)
    whatsapp_sent = models.BooleanField(default=False)
    whatsapp_message_id = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.user}"
