from rest_framework import serializers
from .models import Exam, ExamResult


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_enrollment = serializers.CharField(source='student.student_profile.enrollment_number', read_only=True)
    is_passed = serializers.SerializerMethodField()

    class Meta:
        model = ExamResult
        fields = '__all__'

    def get_is_passed(self, obj):
        return obj.marks_obtained >= obj.exam.passing_marks


class ExamSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    conducted_by_name = serializers.CharField(source='conducted_by.get_full_name', read_only=True)
    results = ExamResultSerializer(many=True, read_only=True)
    total_students = serializers.SerializerMethodField()
    average_marks = serializers.SerializerMethodField()
    pass_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = '__all__'

    def get_total_students(self, obj):
        return obj.results.count()

    def get_average_marks(self, obj):
        results = obj.results.filter(is_absent=False)
        if results.exists():
            total = sum(r.marks_obtained for r in results)
            return round(float(total) / results.count(), 2)
        return 0

    def get_pass_count(self, obj):
        return obj.results.filter(
            is_absent=False,
            marks_obtained__gte=obj.passing_marks
        ).count()


class StudentExamSummarySerializer(serializers.Serializer):
    subject_name = serializers.CharField()
    subject_code = serializers.CharField()
    exam_title = serializers.CharField()
    exam_type = serializers.CharField()
    date = serializers.DateField()
    marks_obtained = serializers.DecimalField(max_digits=5, decimal_places=2)
    max_marks = serializers.DecimalField(max_digits=5, decimal_places=2)
    passing_marks = serializers.DecimalField(max_digits=5, decimal_places=2)
    is_passed = serializers.BooleanField()
    is_absent = serializers.BooleanField()
    percentage = serializers.FloatField()   