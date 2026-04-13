from django.contrib import admin
from .models import Notice, NoticeRead


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ['title', 'sent_by', 'recipient_type', 'is_active', 'created_at']
    list_filter = ['recipient_type', 'is_active']
    search_fields = ['title', 'content']


@admin.register(NoticeRead)
class NoticeReadAdmin(admin.ModelAdmin):
    list_display = ['notice', 'faculty', 'read_at']