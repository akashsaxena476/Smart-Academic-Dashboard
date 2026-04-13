from django.contrib import admin
from .models import Department, Subject, Section, Timetable

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'semester', 'department', 'faculty']
    list_filter = ['semester', 'department']

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'semester', 'department']
    list_filter = ['semester', 'department']

@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ['section', 'subject', 'day', 'start_time', 'end_time']
    list_filter = ['day', 'section']