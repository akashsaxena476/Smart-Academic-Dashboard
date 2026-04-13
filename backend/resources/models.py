from django.db import models
from users.models import CustomUser
from academics.models import Subject, Section


class Resource(models.Model):
    RESOURCE_TYPE_CHOICES = (
        ('notes', 'Notes'),
        ('assignment', 'Assignment'),
        ('reference', 'Reference Material'),
        ('pyq', 'Previous Year Questions'),
        ('other', 'Other'),
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES, default='notes')
    file = models.FileField(upload_to='resources/')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='resources')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='resources', null=True, blank=True)
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='uploaded_resources')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name} ({self.resource_type})"


class ResourceView(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='views')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='viewed_resources')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['resource', 'student']

    def __str__(self):
        return f"{self.student.get_full_name()} viewed {self.resource.title}"