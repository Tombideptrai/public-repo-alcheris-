from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from core.views import CourseViewSet, DashboardViewSet, EmailOrUsernameTokenObtainPairView, LessonViewSet, RegisterView, UserMeView

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('lessons', LessonViewSet, basename='lesson')
router.register('dashboard', DashboardViewSet, basename='dashboard')


def healthz(_request):
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
    return JsonResponse({'status': 'ok', 'database': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('healthz/', healthz),
    path('api/', include(router.urls)),
    path('api/token/', EmailOrUsernameTokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/users/me/', UserMeView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
