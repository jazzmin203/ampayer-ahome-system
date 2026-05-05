from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, LeagueViewSet, SeasonViewSet, CategoryViewSet,
    StadiumViewSet, TeamViewSet, PlayerViewSet, GameViewSet,
    NotificationViewSet, AvailabilityBlockViewSet, GameAssignmentViewSet,
    ImportViewSet, UmpireReportViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'leagues', LeagueViewSet)
router.register(r'seasons', SeasonViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'stadiums', StadiumViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'players', PlayerViewSet)
router.register(r'games', GameViewSet)
router.register(r'assignments', GameAssignmentViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reports', UmpireReportViewSet)
router.register(r'import', ImportViewSet, basename='import')
router.register(r'availability', AvailabilityBlockViewSet, basename='availability')

urlpatterns = [
    # Auth
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API
    path('', include(router.urls)),
]
