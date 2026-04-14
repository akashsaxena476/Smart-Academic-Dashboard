from django.db import models
from users.models import CustomUser


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('resource', 'New Resource'),
        ('marks', 'Marks Published'),
        ('attendance', 'Attendance Marked'),
        ('general', 'General'),
    )
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='general')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"