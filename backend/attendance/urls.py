from django.urls import path
from . import views

urlpatterns = [
    # Faculty
    path('create-session/', views.create_attendance_session, name='create_attendance_session'),
    path('section-students/', views.get_section_students, name='get_section_students'),
    path('session/<int:session_id>/', views.manage_attendance_session, name='manage_attendance_session'),
    path('faculty-sessions/', views.get_faculty_sessions, name='get_faculty_sessions'),

    # Student
    path('my-summary/', views.get_student_attendance_summary, name='get_student_attendance_summary'),
    path('my-detail/', views.get_student_attendance_detail, name='get_student_attendance_detail'),
    path('download-excel/', views.download_attendance_excel, name='download_attendance_excel'),
    path('students-summary/', views.get_students_attendance_summary, name='get_students_attendance_summary'),
]