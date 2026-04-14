from django.db import models
from users.models import CustomUser


class Notice(models.Model):
    RECIPIENT_TYPE_CHOICES = (
        ('all_faculty', 'All Faculty'),
        ('specific_faculty', 'Specific Faculty'),
        ('all_students', 'All Students'),
        ('specific_students', 'Specific Students'),
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    sent_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_notices')
    recipient_type = models.CharField(max_length=20, choices=RECIPIENT_TYPE_CHOICES, default='all_faculty')

    # Faculty recipients
    specific_recipients = models.ManyToManyField(
        CustomUser, blank=True, related_name='received_notices'
    )

    # Student filters
    target_year = models.CharField(max_length=1, blank=True, null=True)
    target_semester = models.IntegerField(blank=True, null=True)
    target_section = models.CharField(max_length=5, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — by {self.sent_by.get_full_name()}"


class NoticeRead(models.Model):
    notice = models.ForeignKey(Notice, on_delete=models.CASCADE, related_name='read_by')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='read_notices')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['notice', 'user']

    def __str__(self):
        return f"{self.user.get_full_name()} read {self.notice.title}"