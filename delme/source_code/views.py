from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    User, UserProfile, League, Season, Category, Stadium, Team, Player,
    Game, GameAssignment, AvailabilityBlock, Notification, LineupEntry
)
from .serializers import (
    UserSerializer, UserProfileSerializer, LeagueSerializer, SeasonSerializer,
    CategorySerializer, StadiumSerializer, TeamSerializer, PlayerSerializer,
    GameListSerializer, GameDetailSerializer, GameAssignmentSerializer,
    AvailabilityBlockSerializer, NotificationSerializer, LineupEntrySerializer,
    UserMinimalSerializer
)

# -----------------------------------------------------------------------------
# 👤 USER VIEWS
# -----------------------------------------------------------------------------

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

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
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['team']
    search_fields = ['first_name', 'last_name', 'team__name']

# -----------------------------------------------------------------------------
# 🎮 GAME VIEWS
# -----------------------------------------------------------------------------

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'date', 'season', 'stadium']
    ordering_fields = ['date', 'time']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            # Use detail for single, list for list - actually we want list for list
            if self.action == 'list':
                return GameListSerializer
            return GameDetailSerializer
        return GameDetailSerializer

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Manually assign an official to this game.
        """
        game = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'Base Umpire')
        
        user = get_object_or_404(User, pk=user_id)
        
        # Check conflicts (Simple check)
        # In a real scenario, this logic would be in a Service/Model
        assignment, created = GameAssignment.objects.get_or_create(
            game=game,
            official=user,
            defaults={'role_in_game': role, 'status': GameAssignment.Status.ASSIGNED}
        )
        
        if not created:
            return Response({'detail': 'User already assigned to this game.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Notify
        Notification.objects.create(
            user=user,
            title="Nueva Asignación",
            message=f"Has sido asignado al juego {game}",
            game=game
        )
        
        game.status = Game.Status.ASSIGNED
        game.save()
        
        return Response({'status': 'assigned'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def confirm_assignment(self, request, pk=None):
        """
        Official confirms their own assignment.
        """
        game = self.get_object()
        user = request.user
        
        assignment = get_object_or_404(GameAssignment, game=game, official=user)
        assignment.status = GameAssignment.Status.ACCEPTED
        assignment.responded_at = Notification.objects.create(
            user=user,
            title="Juego Confirmado",
            message=f"Has confirmado el juego {game}",
            game=game
        ).created_at # Hacky timestamp use
        assignment.save()
        
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject_assignment(self, request, pk=None):
        """
        Official rejects their assignment.
        """
        game = self.get_object()
        user = request.user
        
        assignment = get_object_or_404(GameAssignment, game=game, official=user)
        assignment.status = GameAssignment.Status.REJECTED
        assignment.save()
        
        # Notify admin (Assuming superuser for now)
        # In real app query connection
        
        return Response({'status': 'rejected'})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'read'})
