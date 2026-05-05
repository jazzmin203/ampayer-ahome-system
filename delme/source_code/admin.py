from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, UserProfile, League, Season, Category, Stadium, Team, Player,
    Game, GameAssignment, AvailabilityBlock, Notification, Play, LineupEntry
)

# -----------------------------------------------------------------------------
# 👤 USER MANAGEMENT
# -----------------------------------------------------------------------------

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'groups')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )

@admin.register(AvailabilityBlock)
class AvailabilityBlockAdmin(admin.ModelAdmin):
    list_display = ('user', 'start_time', 'end_time', 'is_available', 'reason')
    list_filter = ('is_available', 'user__role')
    search_fields = ('user__username', 'reason')

# -----------------------------------------------------------------------------
# 🏆 LEAGUE & TEAMS
# -----------------------------------------------------------------------------

class SeasonInline(admin.TabularInline):
    model = Season
    extra = 0

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = ('name', 'president', 'city', 'created_at')
    search_fields = ('name', 'city', 'president__username')
    inlines = [SeasonInline]
    prepopulated_fields = {"slug": ("name",)}

class CategoryInline(admin.TabularInline):
    model = Category
    extra = 0

@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('name', 'league', 'start_date', 'end_date', 'is_active')
    list_filter = ('league', 'is_active')
    inlines = [CategoryInline]

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'manager_name')
    list_filter = ('category__season', 'category')
    search_fields = ('name', 'manager_name')

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'jersey_number', 'team', 'positions', 'avg')
    list_filter = ('team__category', 'positions')
    search_fields = ('first_name', 'last_name', 'team__name')

@admin.register(Stadium)
class StadiumAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'manager_contact')
    search_fields = ('name',)

# -----------------------------------------------------------------------------
# 🎮 GAMES & SCORING
# -----------------------------------------------------------------------------

class GameAssignmentInline(admin.TabularInline):
    model = GameAssignment
    extra = 1

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'time', 'stadium', 'status', 'season')
    list_filter = ('status', 'date', 'season', 'stadium')
    search_fields = ('local_team__name', 'visitor_team__name')
    inlines = [GameAssignmentInline]
    date_hierarchy = 'date'

@admin.register(GameAssignment)
class GameAssignmentAdmin(admin.ModelAdmin):
    list_display = ('game', 'official', 'role_in_game', 'status')
    list_filter = ('status', 'role_in_game')

@admin.register(Play)
class PlayAdmin(admin.ModelAdmin):
    list_display = ('game', 'inning', 'half_inning', 'batter', 'result', 'rbi')
    list_filter = ('game', 'inning', 'result')
    search_fields = ('description', 'batter__last_name')

# -----------------------------------------------------------------------------
# 🔔 SYSTEM
# -----------------------------------------------------------------------------

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('title', 'message', 'user__username')
