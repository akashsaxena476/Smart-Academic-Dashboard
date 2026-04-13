from django.db import models
from users.models import CustomUser


class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    semester = models.IntegerField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='subjects')
    faculty = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects_taught')
    credits = models.IntegerField(default=3)

    def __str__(self):
        return f"{self.name} ({self.code}) - Sem {self.semester}"


class Section(models.Model):
    name = models.CharField(max_length=5)  # A, B, C
    semester = models.IntegerField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='sections')
    students = models.ManyToManyField(CustomUser, blank=True, related_name='sections')

    def __str__(self):
        return f"Section {self.name} - Sem {self.semester} ({self.department.code})"


class Timetable(models.Model):
    DAY_CHOICES = (
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
    )
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='timetable')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable')
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.section} - {self.subject.name} - {self.day}"