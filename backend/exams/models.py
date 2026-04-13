from django.db import models
from users.models import CustomUser
from academics.models import Subject, Section


class Exam(models.Model):
    EXAM_TYPE_CHOICES = (
        ('sessional1', 'Sessional 1'),
        ('sessional2', 'Sessional 2'),
        ('endsem', 'End Semester'),
        ('practical', 'Practical'),
        ('assignment', 'Assignment'),
        ('other', 'Other'),
    )
    title = models.CharField(max_length=200)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exams')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='exams')
    conducted_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='conducted_exams')
    date = models.DateField()
    max_marks = models.DecimalField(max_digits=5, decimal_places=2)
    passing_marks = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name} ({self.exam_type})"


class ExamResult(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='exam_results')
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    is_absent = models.BooleanField(default=False)
    remarks = models.CharField(max_length=200, blank=True, null=True)
    entered_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='entered_results')
    entered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['exam', 'student']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.exam.title} - {self.marks_obtained}"