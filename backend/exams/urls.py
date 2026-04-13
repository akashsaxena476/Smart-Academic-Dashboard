from django.urls import path
from . import views

urlpatterns = [
    # Faculty
    path('create/', views.create_exam, name='create_exam'),
    path('<int:exam_id>/', views.manage_exam, name='manage_exam'),
    path('<int:exam_id>/results/', views.enter_exam_results, name='enter_exam_results'),
    path('faculty/', views.get_faculty_exams, name='get_faculty_exams'),
path('download-pdf/', views.download_marks_pdf, name='download_marks_pdf'),
    # Student
    path('my-results/', views.get_student_results, name='get_student_results'),
    path('my-summary/', views.get_student_exam_summary, name='get_student_exam_summary'),
]