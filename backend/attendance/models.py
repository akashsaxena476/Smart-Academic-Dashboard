from django.db import models
from users.models import CustomUser
from academics.models import Subject, Section


class AttendanceSession(models.Model):
    faculty = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attendance_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='attendance_sessions')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='attendance_sessions')
    date = models.DateField()
    start_time = models.TimeField()
    topic_covered = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['subject', 'section', 'date', 'start_time']

    def __str__(self):
        return f"{self.subject.name} - {self.section} - {self.date}"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
    )
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='absent')

    class Meta:
        unique_together = ['session', 'student']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.session} - {self.status}"