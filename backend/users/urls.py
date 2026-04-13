from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import hod_views

urlpatterns = [
    path('register/', views.register_student, name='register_student'),
    path('login/', views.login_user, name='login_user'),
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', views.change_password, name='change_password'),

    # HOD URLs
    path('hod/overview/', hod_views.hod_overview, name='hod_overview'),
    path('hod/students/', hod_views.hod_students, name='hod_students'),
    path('hod/faculty/', hod_views.hod_faculty, name='hod_faculty'),
    path('hod/attendance/', hod_views.hod_attendance, name='hod_attendance'),
    path('hod/exams/', hod_views.hod_exams, name='hod_exams'),
]