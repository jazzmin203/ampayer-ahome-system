from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.http import JsonResponse
import sys
import os
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
import datetime

from .models import (
    User, UserProfile, League, Season, Category, Stadium, Team, Player,
    Game, GameAssignment, AvailabilityBlock, Notification, LineupEntry, Play,
    UmpireReport
)
from .serializers import (
    UserSerializer, UserProfileSerializer, LeagueSerializer, SeasonSerializer,
    CategorySerializer, StadiumSerializer, TeamSerializer, PlayerSerializer,
    GameListSerializer, GameDetailSerializer, GameAssignmentSerializer,
    AvailabilityBlockSerializer, NotificationSerializer, LineupEntrySerializer,
    UserMinimalSerializer, PlaySerializer, UmpireReportSerializer
)
from .reports import generate_excel_boxscore, generate_pdf_boxscore, generate_digital_acta, generate_umpire_distribution_pdf

# -----------------------------------------------------------------------------
# 🛡️ PERMISSIONS
# -----------------------------------------------------------------------------

class IsManagementOrStaff(permissions.BasePermission):
    """
    Allows access to Staff users OR users with Management roles (President, Admin Ampayer).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Staff users (is_staff=True) always have access
        if request.user.is_staff:
            return True
            
        # Check custom roles
        return request.user.role in [User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER, User.Role.LEAGUE_PRESIDENT]

class IsGameEditorOrManagement(permissions.BasePermission):
    """
    Allocates write access to Game object owners (Scorers/Ampayers) or Management.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Management always access
        if request.user.is_staff or request.user.role in [User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER, User.Role.LEAGUE_PRESIDENT]:
            return True
            
        # Assigned Staff
        # Check Scorers
        if obj.scorer_1 == request.user or obj.scorer_2 == request.user:
            return True
            
        # Check Ampayers (if they need to verify)
        if obj.ampayer_1 == request.user or obj.ampayer_2 == request.user or obj.ampayer_3 == request.user:
            return True
            
        return False

# -----------------------------------------------------------------------------
# 🛠️ SYSTEM ENDPOINTS
# -----------------------------------------------------------------------------
class SeedDataView(APIView):
    permission_classes = [IsAuthenticated, IsManagementOrStaff]
    
    def post(self, request):
        try:
            from django.core.management import call_command
            import threading
            import os
            
            def run_sync_tasks():
                status_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sync_status.txt')
                try:
                    with open(status_file, 'w') as f:
                        f.write(f"Iniciando sincronización: {os.popen('date').read()}\n")
                    
                    print("Running migrations on production...")
                    call_command('migrate', interactive=False)
                    
                    with open(status_file, 'a') as f:
                        f.write("Migraciones completadas exitosamente.\n")
                    
                    # Ensure root is in path for import
                    import sys
                    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    if base_dir not in sys.path:
                        sys.path.append(base_dir)
                    
                    from seed_data import run as run_seed
                    print("Starting data seeding...")
                    run_seed()
                    
                    with open(status_file, 'a') as f:
                        f.write("Carga de datos (Seeding) completada exitosamente.\n")
                        f.write(f"Fin: {os.popen('date').read()}\n")
                except Exception as e:
                    error_msg = f"Error en sincronización: {str(e)}"
                    print(error_msg)
                    with open(status_file, 'a') as f:
                        f.write(f"FALLO: {error_msg}\n")
            
            thread = threading.Thread(target=run_sync_tasks)
            thread.start()
            
            return JsonResponse({
                'status': 'success', 
                'message': 'Sincronización iniciada (Migraciones + Carga de datos). Esto puede tardar un minuto.'
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

class SystemStatusView(APIView):
    permission_classes = [IsAuthenticated, IsManagementOrStaff]
    
    def get(self, request):
        from .models import League, Team, Stadium, User, Category
        from django.db import connection
        
        # Get migration status
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM django_migrations ORDER BY applied DESC LIMIT 5")
            recent_migrations = [row[0] for row in cursor.fetchall()]

        data = {
            'counts': {
                'leagues': League.objects.count(),
                'categories': Category.objects.count(),
                'teams': Team.objects.count(),
                'stadiums': Stadium.objects.count(),
                'users': {
                    'total': User.objects.count(),
                    'ampayers': User.objects.filter(role=User.Role.AMPAYER).count(),
                    'scorers': User.objects.filter(role=User.Role.SCORER).count(),
                    'admins': User.objects.filter(role__in=[User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER]).count(),
                }
            },
            'recent_migrations': recent_migrations,
            'database_status': 'Connected'
        }
        return JsonResponse(data)

class CheckSyncStatusView(APIView):
    permission_classes = [IsAuthenticated, IsManagementOrStaff]
    
    def get(self, request):
        import os
        status_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sync_status.txt')
        if os.path.exists(status_file):
            with open(status_file, 'r') as f:
                content = f.read()
            return JsonResponse({'status': 'exists', 'log': content})
        return JsonResponse({'status': 'not_found', 'message': 'No se ha iniciado ninguna sincronización reciente.'})

# -----------------------------------------------------------------------------
# 👤 USER VIEWS
# -----------------------------------------------------------------------------

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsManagementOrStaff]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        user = request.user
        # Ensure profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        serializer = UserProfileSerializer(user.profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AvailabilityBlockViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilityBlockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see only their availability unless admin
        if self.request.user.role in [User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER]:
            return AvailabilityBlock.objects.all()
        return AvailabilityBlock.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# -----------------------------------------------------------------------------
# 🏆 STRUCTURE VIEWS
# -----------------------------------------------------------------------------

class LeagueViewSet(viewsets.ModelViewSet):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer
    permission_classes = [IsAuthenticated]

class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['league', 'is_active']

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['season']

class StadiumViewSet(viewsets.ModelViewSet):
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [IsAuthenticated]

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['name']

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['team']
    search_fields = ['first_name', 'last_name', 'team__name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            # Allow Scorers to add/edit players on the fly
            if self.request.user and self.request.user.is_authenticated:
                if self.request.user.role == User.Role.SCORER:
                    return [permissions.IsAuthenticated()]
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagementOrStaff()]
        return [IsAuthenticated()]

# -----------------------------------------------------------------------------
# 🎮 GAME VIEWS
# -----------------------------------------------------------------------------

# from .reports import generate_excel_boxscore, generate_pdf_boxscore

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'season', 'category', 'date']
    search_fields = ['local_team__name', 'visitor_team__name', 'stadium__name']
    ordering_fields = ['date', 'time']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if not user.is_authenticated:
            return qs.none()

        # -------------------------------------------------------
        # 📅 DATE FILTER: By default only show today + future games
        # Pass ?include_past=true to see all games (management only)
        # -------------------------------------------------------
        include_past = self.request.query_params.get('include_past', 'false').lower() == 'true'
        today = datetime.date.today()

        if not include_past:
            # Exclude games from past days (keep today and future)
            qs = qs.filter(date__gte=today)

        if user.role in [User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER]:
            return qs
            
        if user.role == User.Role.LEAGUE_PRESIDENT:
            return qs.filter(season__league__president=user)
            
        if user.role in [User.Role.AMPAYER, User.Role.SCORER]:
            # For retrieve and export_boxscore, we permit access if they are authenticated
            # but list and update remain restricted.
            if self.action in ['retrieve', 'export_boxscore']:
                return qs

            # Assigned games only for list/summary views
            return qs.filter(
                Q(assignments__official=user) | 
                Q(scorer_1=user) | Q(scorer_2=user) |
                Q(ampayer_1=user) | Q(ampayer_2=user) | Q(ampayer_3=user)
            ).distinct()
            
        return qs

    
    @action(detail=True, methods=['get'], url_path='export_boxscore')
    def export_boxscore(self, request, pk=None):
        """Export game box score as Excel or PDF"""
        game = self.get_object()
        format_type = request.query_params.get('format', 'excel')  # 'excel' or 'pdf'
        
        if format_type == 'excel':
            return generate_excel_boxscore(game)
        else:
            return generate_pdf_boxscore(game)

    @action(detail=True, methods=['get'], url_path='export_digital_acta')
    def export_digital_acta(self, request, pk=None):
        """Export comprehensive game history as PDF"""
        game = self.get_object()
        return generate_digital_acta(game)

    @action(detail=False, methods=['get'], url_path='export_distribution')
    def export_distribution(self, request):
        """
        Export a professional PDF showing all games with their assigned
        umpires and scorers. Optionally filter by ?season=ID or ?category=ID.
        Only accessible by management roles.
        """
        if not request.user.role in [User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER, User.Role.LEAGUE_PRESIDENT]:
            if not request.user.is_staff:
                from rest_framework.response import Response as DRFResponse
                return DRFResponse({'error': 'No autorizado'}, status=403)

        qs = Game.objects.all()
        season_id = request.query_params.get('season')
        category_id = request.query_params.get('category')
        include_past = request.query_params.get('include_past', 'false').lower() == 'true'

        if not include_past:
            import datetime as dt
            qs = qs.filter(date__gte=dt.date.today())
        if season_id:
            qs = qs.filter(season_id=season_id)
        if category_id:
            qs = qs.filter(category_id=category_id)

        return generate_umpire_distribution_pdf(qs)

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            # Use detail for single, list for list - actually we want list for list
            if self.action == 'list':
                return GameListSerializer
            return GameDetailSerializer
        return GameDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'assign']:
            return [IsManagementOrStaff()]
        elif self.action in ['update', 'partial_update', 'record_play', 'confirm_assignment', 'reject_assignment']:
            return [IsGameEditorOrManagement()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Manually assign staff (Ampayers & Scorers) to this game.
        Creates GameAssignment records and sends notifications.
        """
        game = self.get_object()
        conflicts = []
        
        # 0. Check for duplicates in the same request
        selected_ids = [
            request.data.get('ampayer_1_id'), request.data.get('ampayer_2_id'), request.data.get('ampayer_3_id'),
            request.data.get('scorer_1_id'), request.data.get('scorer_2_id')
        ]
        ids_only = [str(sid) for sid in selected_ids if sid]
        if len(ids_only) != len(set(ids_only)):
            conflicts.append("No puedes asignar a la misma persona en múltiples roles para el mismo juego.")

        def check_conflicts(user_id, role_label):
            if not user_id: return None
            try:
                user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return None
            
            # 1. Check for overlapping games (2 hour window)
            import datetime
            game_time = datetime.datetime.combine(game.date, game.time)
            
            overlapping = Game.objects.filter(
                date=game.date,
            ).filter(
                Q(ampayer_1=user) | Q(ampayer_2=user) | Q(ampayer_3=user) |
                Q(scorer_1=user) | Q(scorer_2=user)
            ).exclude(id=game.id)
            
            for other_game in overlapping:
                other_time = datetime.datetime.combine(other_game.date, other_game.time)
                if abs((game_time - other_time).total_seconds()) < 7200: # 2 hours
                    conflicts.append(f"{user.get_full_name()} ya está asignado al juego {other_game} a las {other_game.time}")
            
            return user

        try:
            # 1. Map and Validate
            staff_ids = {
                'ampayer_1': request.data.get('ampayer_1_id'),
                'ampayer_2': request.data.get('ampayer_2_id'),
                'ampayer_3': request.data.get('ampayer_3_id'),
                'scorer_1': request.data.get('scorer_1_id'),
                'scorer_2': request.data.get('scorer_2_id'),
            }

            for field, user_id in staff_ids.items():
                if not user_id or user_id == "" or str(user_id) == "0":
                    setattr(game, field, None)
                else:
                    user = check_conflicts(user_id, field)
                    if user:
                        setattr(game, field, user)
                        # Create/Update Assignment record
                        role_label = 'Ampayer' if 'ampayer' in field else 'Anotador'
                        GameAssignment.objects.update_or_create(
                            game=game, official=user,
                            defaults={'role_in_game': role_label, 'status': GameAssignment.Status.ASSIGNED, 'notified_at': timezone.now()}
                        )
                        # Notify
                        Notification.objects.get_or_create(
                            user=user, game=game, notification_type='game_assignment', status='pending',
                            defaults={'title': "Nueva Asignación", 'message': f"Asignado como {role_label} al juego {game}"}
                        )

            if conflicts:
                return Response({'status': 'conflict', 'errors': conflicts}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Update Game Status
            has_assignments = any([game.ampayer_1, game.ampayer_2, game.ampayer_3, game.scorer_1, game.scorer_2])
            if has_assignments:
                if game.status == Game.Status.PENDING:
                    game.status = Game.Status.ASSIGNED
            else:
                game.status = Game.Status.PENDING

            game.save()
            return Response({'status': 'success', 'message': 'Asignaciones actualizadas correctamente.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def confirm_assignment(self, request, pk=None):
        """
        Official confirms their own assignment.
        """
        game = self.get_object()
        user = request.user
        
        assignment, created = GameAssignment.objects.get_or_create(
            game=game, 
            official=user,
            defaults={'status': GameAssignment.Status.ACCEPTED}
        )
        if not created:
            assignment.status = GameAssignment.Status.ACCEPTED
            assignment.save()

        if not assignment.responded_at:
             assignment.responded_at = timezone.now()
             assignment.save()

        # Create notification if confirming
        Notification.objects.create(
            user=user,
            title="Juego Confirmado",
            message=f"Has confirmado el juego {game}",
            game=game
        )
        
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject_assignment(self, request, pk=None):
        """
        Official rejects their assignment.
        """
        game = self.get_object()
        user = request.user
        
        assignment, created = GameAssignment.objects.get_or_create(
            game=game, 
            official=user,
            defaults={'status': GameAssignment.Status.REJECTED}
        )
        if not created:
            assignment.status = GameAssignment.Status.REJECTED
            assignment.save()
            
        if not assignment.responded_at:
             assignment.responded_at = timezone.now()
             assignment.save()
        
        # Notify admin (Assuming superuser for now)
        # In real app query connection
        
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a game and notify all assigned staff.
        """
        game = self.get_object()
        reason = request.data.get('reason', 'Sin motivo especificado')
        
        game.status = Game.Status.CANCELLED
        game.cancellation_reason = reason
        game.save()
        
        # Notify Assigned Staff
        assignments = GameAssignment.objects.filter(game=game, status=GameAssignment.Status.ASSIGNED)
        for assignment in assignments:
            Notification.objects.create(
                user=assignment.official,
                title="Juego Cancelado",
                message=f"El juego {game} ha sido cancelado through. Motivo: {reason}",
                game=game,
                notification_type='game_cancellation'
            )
            assignment.status = GameAssignment.Status.REVOKED
            assignment.save()
            
        return Response({'status': 'cancelled', 'message': 'Juego cancelado y personal notificado.'})


    @action(detail=True, methods=['post'])
    def remove_inning(self, request, pk=None):
        game = self.get_object()
        if game.current_inning > 9:
            game.current_inning -= 1
            game.save()
            return Response({'status': 'inning removed', 'current_inning': game.current_inning})
        return Response({'error': 'No se pueden eliminar las entradas reglamentarias (mínimo 9)'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def record_play(self, request, pk=None):
        """
        Record a granular play and update score and game state (outs, inning).
        """
        game = self.get_object()
        serializer = PlaySerializer(data=request.data)
        if serializer.is_valid():
            play = serializer.save(game=game)
            
            # --- Score Update ---
            if play.runs_scored > 0:
                if play.half == 'top':
                    game.away_score += play.runs_scored
                else:
                    game.home_score += play.runs_scored
            
            # --- Automatic State Management ---
            
            # 1. Update Outs
            # If the client sends 'outs' explicitly, use it (manual override).
            # Otherwise, calculate based on the play.
            if 'outs' in request.data:
                game.outs = request.data['outs']
            else:
                # Safety fallback: if outs_recorded is 0 but it's an out event, force 1 out
                if play.outs_recorded == 0 and any(x in play.event_type.lower() for x in ['out', 'strikeout', 'choice']):
                    play.outs_recorded = 1
                    play.save()
                game.outs += play.outs_recorded

            # 2. Inning Transition Logic (3 Outs)
            if game.outs >= 3:
                # End of half-inning
                game.outs = 0
                game.balls = 0
                game.strikes = 0
                
                # Clear all runners
                game.runner_on_1b = None
                game.runner_on_2b = None
                game.runner_on_3b = None
                
                # Switch sides
                if game.inning_half == 'top':
                    game.inning_half = 'bottom'
                else:
                    game.inning_half = 'top'
                    game.current_inning += 1
            else:
                # Same half-inning: Update other state usually cleared on switch
                if 'balls' in request.data:
                    game.balls = request.data['balls']
                if 'strikes' in request.data:
                    game.strikes = request.data['strikes']
                
                # Handle runners updates
                for base in ['runner_on_1b', 'runner_on_2b', 'runner_on_3b']:
                    if base in request.data:
                        val = request.data[base]
                        if val in [None, '', 'null', 0]:
                            setattr(game, base, None)
                        else:
                            setattr(game, f"{base}_id", val)

            # 4. Handle Lineup Statistics (LineupEntry)
            try:
                # IMPORTANT: Find the ACTIVE lineup entry for the batter
                lineup_entry = LineupEntry.objects.get(game=game, player=play.batter, is_active=True)
                lineup_entry.PA += 1
                event = play.event_type.lower()
                
                if event in ['single', 'double', 'triple', 'homerun']:
                    lineup_entry.H += 1
                    lineup_entry.AB += 1
                    if event == 'single': lineup_entry.singles += 1
                    elif event == 'double': lineup_entry.doubles += 1
                    elif event == 'triple': lineup_entry.triples += 1
                    elif event == 'homerun': 
                        lineup_entry.HR += 1
                        lineup_entry.R += 1
                elif event == 'walk':
                    lineup_entry.BB += 1
                elif event == 'hit_by_pitch':
                    lineup_entry.HBP += 1
                elif 'out' in event or event == 'strikeout':
                    if not request.data.get('is_sacrifice', False):
                        lineup_entry.AB += 1
                    if event == 'strikeout':
                        lineup_entry.SO += 1
                elif 'error' in event:
                    lineup_entry.AB += 1

                if play.runs_scored > 0:
                    lineup_entry.RBI += play.runs_scored

                lineup_entry.save()
            except LineupEntry.DoesNotExist:
                pass

            # 5. Handle Pitcher Statistics
            try:
                # Find the active pitcher entry for the DEFENSIVE team
                # Defensive team is opposite of play.half (top half -> home team is defensive)
                pitcher_team = game.local_team if play.half == 'top' else game.visitor_team
                pitcher_entry = LineupEntry.objects.get(game=game, team=pitcher_team, player=play.pitcher, is_active=True)
                
                pitcher_entry.IP_outs += play.outs_recorded
                
                event = play.event_type.lower()
                if event in ['single', 'double', 'triple', 'homerun']:
                    pitcher_entry.pitch_H += 1
                    if event == 'homerun':
                        pitcher_entry.pitch_HR += 1
                elif event == 'walk':
                    pitcher_entry.pitch_BB += 1
                elif event == 'strikeout':
                    pitcher_entry.pitch_SO += 1
                
                if play.runs_scored > 0:
                    pitcher_entry.pitch_R += play.runs_scored
                    # For simplicity, assuming all runs are earned for now. 
                    # Real logic would check if errors occurred.
                    pitcher_entry.pitch_ER += play.runs_scored
                
                pitcher_entry.save()
            except LineupEntry.DoesNotExist:
                pass

            game.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def delete_play(self, request, pk=None):
        """
        Deletes a specific play and attempts to reverse its statistical impact.
        """
        game = self.get_object()
        play_id = request.data.get('play_id')
        if not play_id:
            return Response({"error": "Falta play_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            play = Play.objects.get(id=play_id, game=game)
            
            # 1. Reverse Game Score
            if play.runs_scored > 0:
                if play.half == 'top':
                    game.away_score = max(0, game.away_score - play.runs_scored)
                else:
                    game.home_score = max(0, game.home_score - play.runs_scored)

            # 2. Reverse Batter Stats
            try:
                batter_entry = LineupEntry.objects.filter(game=game, player=play.batter, is_active=True).first()
                if batter_entry:
                    batter_entry.PA = max(0, batter_entry.PA - 1)
                event = play.event_type.lower()
                
                if event in ['single', 'double', 'triple', 'homerun']:
                    batter_entry.H = max(0, batter_entry.H - 1)
                    batter_entry.AB = max(0, batter_entry.AB - 1)
                    if event == 'single': batter_entry.singles = max(0, batter_entry.singles - 1)
                    elif event == 'double': batter_entry.doubles = max(0, batter_entry.doubles - 1)
                    elif event == 'triple': batter_entry.triples = max(0, batter_entry.triples - 1)
                    elif event == 'homerun': 
                        batter_entry.HR = max(0, batter_entry.HR - 1)
                        batter_entry.R = max(0, batter_entry.R - 1)
                elif event == 'walk':
                    batter_entry.BB = max(0, batter_entry.BB - 1)
                elif event == 'hit_by_pitch':
                    batter_entry.HBP = max(0, batter_entry.HBP - 1)
                elif 'out' in event or event == 'strikeout':
                    # Sacrifice flies/hits usually don't count as AB. 
                    # Assuming for now we just reverse what we added.
                    batter_entry.AB = max(0, batter_entry.AB - 1)
                    if event == 'strikeout':
                        batter_entry.SO = max(0, batter_entry.SO - 1)
                elif 'error' in event:
                    batter_entry.AB = max(0, batter_entry.AB - 1)

                if play.runs_scored > 0:
                    batter_entry.RBI = max(0, batter_entry.RBI - play.runs_scored)
                
                batter_entry.save()
            except LineupEntry.DoesNotExist:
                pass

            # 3. Reverse Pitcher Stats
            try:
                pitcher_team = game.local_team if play.half == 'top' else game.visitor_team
                pitcher_entry = LineupEntry.objects.filter(game=game, team=pitcher_team, player=play.pitcher, is_active=True).first()
                
                if pitcher_entry:
                    pitcher_entry.IP_outs = max(0, pitcher_entry.IP_outs - play.outs_recorded)
                game.outs = max(0, game.outs - play.outs_recorded) # Also reverse game outs if still in same inning
                
                event = play.event_type.lower()
                if event in ['single', 'double', 'triple', 'homerun']:
                    pitcher_entry.pitch_H = max(0, pitcher_entry.pitch_H - 1)
                    if event == 'homerun':
                        pitcher_entry.pitch_HR = max(0, pitcher_entry.pitch_HR - 1)
                elif event == 'walk':
                    pitcher_entry.pitch_BB = max(0, pitcher_entry.pitch_BB - 1)
                elif event == 'strikeout':
                    pitcher_entry.pitch_SO = max(0, pitcher_entry.pitch_SO - 1)
                
                if play.runs_scored > 0:
                    pitcher_entry.pitch_R = max(0, pitcher_entry.pitch_R - play.runs_scored)
                    pitcher_entry.pitch_ER = max(0, pitcher_entry.pitch_ER - play.runs_scored)
                
                pitcher_entry.save()
            except LineupEntry.DoesNotExist:
                pass

            # 4. Delete the Play
            play.delete()
            game.save()
            
            return Response({"status": "deleted", "message": "Jugada eliminada y estadísticas revertidas."})
        except Play.DoesNotExist:
            return Response({"error": "Jugada no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def substitution(self, request, pk=None):
        """
        Record a player substitution and update lineup.
        """
        game = self.get_object()
        incoming_id = request.data.get('incoming_player')
        outgoing_id = request.data.get('outgoing_player')
        team_id = request.data.get('team')
        position = request.data.get('position')
        
        if not all([incoming_id, outgoing_id, team_id]):
            return Response({"error": "Faltan datos (jugador entrante, saliente o equipo)"}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # 1. Get the current active entry for this slot
            # Note: We need to know WHICH slot the player is in. 
            # Usually substitution is called for a specific batting order slot.
            batting_order = request.data.get('batting_order')
            
            if batting_order:
                old_entry = LineupEntry.objects.get(game=game, batting_order=batting_order, team_id=team_id, is_active=True)
            else:
                # Fallback to player ID if batting_order not provided (less robust)
                old_entry = LineupEntry.objects.get(game=game, player_id=outgoing_id, team_id=team_id, is_active=True)
            
            # 2. Mark old entry as inactive
            old_entry.is_active = False
            old_entry.exit_inning = game.current_inning
            old_entry.save()
            
            # 3. Create new LineupEntry for history
            new_entry = LineupEntry.objects.create(
                game=game,
                team_id=team_id,
                player_id=incoming_id,
                batting_order=old_entry.batting_order,
                field_position=position or old_entry.field_position,
                is_active=True,
                entry_inning=game.current_inning
            )
            
            # 4. Create Play record for history
            Play.objects.create(
                game=game,
                inning=game.current_inning,
                half=game.inning_half,
                batter_id=incoming_id,
                pitcher_id=request.data.get('pitcher', 0) or 0,
                event_type='substitution',
                is_substitution=True,
                incoming_player_id=incoming_id,
                outgoing_player_id=outgoing_id,
                position_change=position or old_entry.field_position
            )
            
            return Response({"message": "Sustitución registrada con éxito", "new_entry_id": new_entry.id}, status=status.HTTP_200_OK)
        except LineupEntry.DoesNotExist:
            return Response({"error": "Jugador saliente o slot de lineup no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def start_game(self, request, pk=None):
        game = self.get_object()
        if not game.actual_start_time:
            game.actual_start_time = timezone.now()
            game.status = Game.Status.IN_PROGRESS
            game.save()
        return Response({'status': 'started', 'start_time': game.actual_start_time})

    @action(detail=True, methods=['post'])
    def end_game(self, request, pk=None):
        game = self.get_object()
        if not game.actual_end_time:
            game.actual_end_time = timezone.now()
            game.status = Game.Status.FINISHED
            game.save()
        return Response({'status': 'ended', 'end_time': game.actual_end_time})

    @action(detail=True, methods=['post'])
    def save_lineup(self, request, pk=None):
        """
        Create or update lineup entries for a game.
        Payload: { 'lineup': [ { 'player': id, 'batting_order': 1, 'team': id, 'field_position': 'P' }, ... ] }
        """
        game = self.get_object()
        lineup_data = request.data.get('lineup', [])
        
        created_entries = []
        for entry in lineup_data:
            player_id = entry.get('player')
            if not player_id or player_id == 0:
                continue
                
            lineup_entry, created = LineupEntry.objects.update_or_create(
                game=game,
                team_id=entry.get('team'),
                batting_order=entry.get('batting_order'),
                defaults={
                    'player_id': player_id,
                    'field_position': entry.get('field_position', '')
                }
            )
            created_entries.append(LineupEntrySerializer(lineup_entry).data)
            
        return Response({'status': 'lineup saved', 'entries': created_entries})

    @action(detail=True, methods=['get'])
    def lineups(self, request, pk=None):
        """
        Get lineups/rosters for both teams in the game.
        """
        game = self.get_object()
        
        # Get players for local and visitor teams
        local_players = Player.objects.filter(team=game.local_team)
        visitor_players = Player.objects.filter(team=game.visitor_team)
        
        return Response({
            'local_team': {
                'id': game.local_team.id,
                'name': game.local_team.name,
                'players': PlayerSerializer(local_players, many=True).data
            },
            'visitor_team': {
                'id': game.visitor_team.id,
                'name': game.visitor_team.name,
                'players': PlayerSerializer(visitor_players, many=True).data
            }
        })


class GameAssignmentViewSet(viewsets.ModelViewSet):
    queryset = GameAssignment.objects.all()
    serializer_class = GameAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see their own assignments, management sees all
        if self.request.user.role in [User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER, User.Role.LEAGUE_PRESIDENT]:
            return GameAssignment.objects.all()
        return GameAssignment.objects.filter(official=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        # If status changed to accepted/rejected, update timestamp
        if instance.status in [GameAssignment.Status.ACCEPTED, GameAssignment.Status.REJECTED]:
            if not instance.responded_at:
                instance.responded_at = timezone.now()
                instance.save()



class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """
        Respond to a notification (accept/reject).
        If linked to a Game Assignment, update that too.
        """
        notification = self.get_object()
        # Allow passing status in body
        response_status = request.data.get('status')
        
        if response_status not in ['accepted', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update Notification
        notification.status = response_status
        notification.accepted_at = timezone.now()
        notification.is_read = True
        notification.save()
        
        # Update linked Assignment if applicable
        if notification.notification_type == 'game_assignment' and notification.game:
            # Find assignment for this game and user
            assignment = GameAssignment.objects.filter(
                game=notification.game,
                official=request.user
            ).first()
            
            if assignment:
                if response_status == 'accepted':
                    assignment.status = GameAssignment.Status.ACCEPTED
                else:
                    assignment.status = GameAssignment.Status.REJECTED
                
                assignment.responded_at = timezone.now()
                assignment.save()
        
        return Response(NotificationSerializer(notification).data)

class UmpireReportViewSet(viewsets.ModelViewSet):
    queryset = UmpireReport.objects.all()
    serializer_class = UmpireReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [User.Role.SUPERUSER, User.Role.ADMIN_AMPAYER]:
            return UmpireReport.objects.all()
        elif user.role == User.Role.LEAGUE_PRESIDENT:
            # President only sees reports for their league's games
            return UmpireReport.objects.filter(game__season__league__president=user)
        else:
            return UmpireReport.objects.filter(umpire=user)

    def perform_create(self, serializer):
        report = serializer.save(umpire=self.request.user)
        
        # Notify Admin/President
        # Not implementing generic 'notify all admins' helper yet, just placeholder logic
        pass


# -----------------------------------------------------------------------------
# 📥 IMPORT VIEWS
# -----------------------------------------------------------------------------

from rest_framework.parsers import MultiPartParser
from .import_utils import parse_teams_excel, parse_players_excel, parse_stadiums_excel, parse_games_excel

class ImportViewSet(viewsets.ViewSet):
    """
    ViewSet for bulk importing data via Excel files.
    """
    parser_classes = [MultiPartParser]
    permission_classes = [IsManagementOrStaff]

    @action(detail=False, methods=['post'])
    def teams(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            results = parse_teams_excel(file_obj)
            return Response(results)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def players(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            results = parse_players_excel(file_obj)
            return Response(results)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def stadiums(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            results = parse_stadiums_excel(file_obj)
            return Response(results)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def games(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            results = parse_games_excel(file_obj)
            return Response(results)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
