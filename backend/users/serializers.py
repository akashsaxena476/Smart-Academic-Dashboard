from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ObjectDoesNotExist
from .models import CustomUser, StudentProfile, FacultyProfile


class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    # Student profile fields
    enrollment_number = serializers.CharField()
    branch = serializers.CharField()
    semester = serializers.IntegerField()
    section = serializers.CharField()
    date_of_birth = serializers.DateField(required=False)
    address = serializers.CharField(required=False)

    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'username', 'email',
            'password', 'confirm_password', 'phone',
            'enrollment_number', 'branch', 'semester', 'section',
            'date_of_birth', 'address'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        # Extract profile fields
        profile_data = {
            'enrollment_number': validated_data.pop('enrollment_number'),
            'branch': validated_data.pop('branch'),
            'semester': validated_data.pop('semester'),
            'section': validated_data.pop('section'),
            'date_of_birth': validated_data.pop('date_of_birth', None),
            'address': validated_data.pop('address', None),
        }
        validated_data.pop('confirm_password')

        # Create user
        user = CustomUser.objects.create_user(
            **validated_data,
            role='student'
        )

        # Create student profile
        StudentProfile.objects.create(user=user, **profile_data)
        return user


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'


class FacultyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyProfile
        fields = [
            'id', 'employee_id', 'department', 'designation',
            'joining_date', 'is_hod', 'hod_year_1', 'hod_year_2',
            'hod_year_3', 'hod_year_4'
        ]


class UserSerializer(serializers.ModelSerializer):
    student_profile = serializers.SerializerMethodField()
    faculty_profile = serializers.SerializerMethodField()
    is_hod = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'first_name', 'last_name', 'username',
            'email', 'role', 'phone', 'profile_pic',
            'student_profile', 'faculty_profile', 'is_hod'
        ]

    def get_student_profile(self, obj):
        try:
            return StudentProfileSerializer(obj.student_profile).data
        except ObjectDoesNotExist:
            return None

    def get_faculty_profile(self, obj):
        try:
            return FacultyProfileSerializer(obj.faculty_profile).data
        except ObjectDoesNotExist:
            return None

    def get_is_hod(self, obj):
        try:
            return obj.faculty_profile.is_hod
        except:
            return False