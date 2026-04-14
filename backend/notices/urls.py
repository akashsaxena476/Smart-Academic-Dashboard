from django.urls import path
from . import views

urlpatterns = [
    # HOD
    path('create/', views.create_notice, name='create_notice'),
    path('hod/', views.get_hod_notices, name='get_hod_notices'),
    path('<int:notice_id>/delete/', views.delete_notice, name='delete_notice'),

    # Faculty
    path('faculty/', views.get_faculty_notices, name='get_faculty_notices'),

    # Student
    path('student/', views.get_student_notices, name='get_student_notices'),

    # Common
    path('<int:notice_id>/read/', views.mark_notice_read, name='mark_notice_read'),
]