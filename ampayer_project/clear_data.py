import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampayer_project.settings')
django.setup()

from core.models import (
    League, Season, Category, Stadium, Team, Player, 
    Game, GameAssignment, LineupEntry, Play, 
    UmpireReport, PitchingStats, AvailabilityBlock, 
    OptimizationRequest, Notification
)

def clear_data():
    print("Cleaning database...")
    
    # Order matters for foreign keys
    Play.objects.all().delete()
    print("- Plays cleared")
    
    LineupEntry.objects.all().delete()
    print("- LineupEntries cleared")
    
    PitchingStats.objects.all().delete()
    print("- PitchingStats cleared")
    
    GameAssignment.objects.all().delete()
    print("- GameAssignments cleared")
    
    Notification.objects.all().delete()
    print("- Notifications cleared")
    
    UmpireReport.objects.all().delete()
    print("- UmpireReports cleared")
    
    OptimizationRequest.objects.all().delete()
    print("- OptimizationRequests cleared")
    
    # Now Games (referencing teams, seasons, players)
    Game.objects.all().delete()
    print("- Games cleared")
    
    # Availability
    AvailabilityBlock.objects.all().delete()
    print("- AvailabilityBlocks cleared")
    
    # Players
    Player.objects.all().delete()
    print("- Players cleared")
    
    # Teams
    Team.objects.all().delete()
    print("- Teams cleared")
    
    # Hierarchy
    Category.objects.all().delete()
    print("- Categories cleared")
    
    Season.objects.all().delete()
    print("- Seasons cleared")
    
    League.objects.all().delete()
    print("- Leagues cleared")
    
    # Stadiums
    Stadium.objects.all().delete()
    print("- Stadiums cleared")

    print("\nDatabase clean! Users preserved. bitumen.")

if __name__ == "__main__":
    clear_data()
