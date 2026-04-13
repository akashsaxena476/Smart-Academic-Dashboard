from django.contrib import admin
from .models import Exam, ExamResult


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam_type', 'subject', 'section', 'date', 'max_marks', 'passing_marks']
    list_filter = ['exam_type', 'subject', 'section']
    search_fields = ['title']


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'marks_obtained', 'is_absent', 'entered_by']
    list_filter = ['exam__exam_type', 'exam__subject', 'is_absent']
    search_fields = ['student__username', 'student__first_name']