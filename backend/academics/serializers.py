from rest_framework import serializers
from .models import Department, Subject, Section, Timetable
from users.serializers import UserSerializer


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)

    class Meta:
        model = Subject
        fields = '__all__'


class SectionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = '__all__'

    def get_student_count(self, obj):
        return obj.students.count()


class TimetableSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = Timetable
        fields = '__all__'