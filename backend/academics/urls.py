from django.urls import path
from . import views

urlpatterns = [
    path('departments/', views.get_departments, name='get_departments'),
    path('subjects/', views.get_subjects, name='get_subjects'),
    path('sections/', views.get_sections, name='get_sections'),
    path('timetable/', views.get_timetable, name='get_timetable'),
    path('student-timetable/', views.get_student_timetable, name='get_student_timetable'),
    path('faculty-timetable/', views.get_faculty_timetable, name='get_faculty_timetable'),
]