from django.urls import path
from . import views

urlpatterns = [
    # Faculty
    path('upload/', views.upload_resource, name='upload_resource'),
    path('faculty/', views.get_faculty_resources, name='get_faculty_resources'),
    path('<int:resource_id>/', views.manage_resource, name='manage_resource'),

    # Student
    path('student/', views.get_student_resources, name='get_student_resources'),
    path('<int:resource_id>/viewed/', views.mark_resource_viewed, name='mark_resource_viewed'),
]