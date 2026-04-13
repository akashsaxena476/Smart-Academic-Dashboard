from django.db import models
from users.models import CustomUser


class Notice(models.Model):
    RECIPIENT_TYPE_CHOICES = (
        ('all', 'All Faculty'),
        ('specific', 'Specific Faculty'),
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    sent_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_notices')
    recipient_type = models.CharField(max_length=10, choices=RECIPIENT_TYPE_CHOICES, default='all')
    specific_recipients = models.ManyToManyField(CustomUser, blank=True, related_name='received_notices')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — by {self.sent_by.get_full_name()}"


class NoticeRead(models.Model):
    notice = models.ForeignKey(Notice, on_delete=models.CASCADE, related_name='read_by')
    faculty = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='read_notices')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['notice', 'faculty']

    def __str__(self):
        return f"{self.faculty.get_full_name()} read {self.notice.title}"