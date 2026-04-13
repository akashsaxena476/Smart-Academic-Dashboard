from django.contrib import admin
from .models import Resource, ResourceView


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'resource_type', 'uploaded_by', 'uploaded_at', 'is_active']
    list_filter = ['resource_type', 'subject', 'is_active']
    search_fields = ['title', 'description']


@admin.register(ResourceView)
class ResourceViewAdmin(admin.ModelAdmin):
    list_display = ['student', 'resource', 'viewed_at']
    list_filter = ['resource__subject']