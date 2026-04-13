from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=15, blank=True, null=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    enrollment_number = models.CharField(max_length=20, unique=True)
    branch = models.CharField(max_length=100)
    semester = models.IntegerField()
    section = models.CharField(max_length=5)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.enrollment_number}"


class FacultyProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='faculty_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    is_hod = models.BooleanField(default=False)
    hod_year_1 = models.BooleanField(default=False, verbose_name="HOD of 1st Year (Sem 1-2)")
    hod_year_2 = models.BooleanField(default=False, verbose_name="HOD of 2nd Year (Sem 3-4)")
    hod_year_3 = models.BooleanField(default=False, verbose_name="HOD of 3rd Year (Sem 5-6)")
    hod_year_4 = models.BooleanField(default=False, verbose_name="HOD of 4th Year (Sem 7-8)")

    def get_hod_semesters(self):
        semesters = []
        if self.hod_year_1: semesters.extend([1, 2])
        if self.hod_year_2: semesters.extend([3, 4])
        if self.hod_year_3: semesters.extend([5, 6])
        if self.hod_year_4: semesters.extend([7, 8])
        return semesters

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.employee_id}"