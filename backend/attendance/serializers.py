from rest_framework import serializers
from .models import AttendanceSession, AttendanceRecord
from users.serializers import UserSerializer
from academics.serializers import SubjectSerializer, SectionSerializer


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_enrollment = serializers.CharField(source='student.student_profile.enrollment_number', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = '__all__'


class AttendanceSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)
    total_present = serializers.SerializerMethodField()
    total_absent = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = '__all__'

    def get_total_present(self, obj):
        return obj.records.filter(status='present').count()

    def get_total_absent(self, obj):
        return obj.records.filter(status='absent').count()


class StudentAttendanceSummarySerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    subject_name = serializers.CharField()
    subject_code = serializers.CharField()
    total_classes = serializers.IntegerField()
    total_present = serializers.IntegerField()
    total_absent = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()