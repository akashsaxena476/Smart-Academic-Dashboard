from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Department, Subject, Section, Timetable
from academics.models import Subject, Section
from .serializers import DepartmentSerializer, SubjectSerializer, SectionSerializer, TimetableSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_departments(request):
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subjects(request):
    user = request.user

    if user.role == 'student':
        try:
            profile = user.student_profile
            subjects = Subject.objects.filter(
                semester=profile.semester,
                department__name=profile.branch
            )
        except:
            subjects = Subject.objects.none()

    elif user.role == 'faculty':
        subjects = Subject.objects.filter(faculty=user)

    else:
        subjects = Subject.objects.all()

    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sections(request):
    sections = Section.objects.all()
    serializer = SectionSerializer(sections, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timetable(request):
    user = request.user

    if user.role == 'student':
        try:
            profile = user.student_profile
            sections = user.sections.all()
            timetable = Timetable.objects.filter(section__in=sections)
        except:
            timetable = Timetable.objects.none()

    elif user.role == 'faculty':
        subjects = Subject.objects.filter(faculty=user)
        timetable = Timetable.objects.filter(subject__in=subjects)

    else:
        timetable = Timetable.objects.all()

    serializer = TimetableSerializer(timetable, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_timetable(request):
    user = request.user
    try:
        sections = user.sections.all()
        timetable = Timetable.objects.filter(
            section__in=sections
        ).order_by('day', 'start_time').select_related('subject', 'subject__faculty', 'section')
    except:
        return Response([])

    data = []
    for t in timetable:
        data.append({
            'id': t.id,
            'day': t.day,
            'subject_name': t.subject.name,
            'subject_code': t.subject.code,
            'faculty_name': t.subject.faculty.get_full_name() if t.subject.faculty else 'TBA',
            'section': t.section.name,
            'start_time': t.start_time.strftime('%I:%M %p'),
            'end_time': t.end_time.strftime('%I:%M %p'),
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_faculty_timetable(request):
    user = request.user
    subjects = Subject.objects.filter(faculty=user)
    timetable = Timetable.objects.filter(
        subject__in=subjects
    ).order_by('day', 'start_time').select_related('subject', 'section')

    data = []
    for t in timetable:
        data.append({
            'id': t.id,
            'day': t.day,
            'subject_name': t.subject.name,
            'subject_code': t.subject.code,
            'section': t.section.name,
            'semester': t.section.semester,
            'start_time': t.start_time.strftime('%I:%M %p'),
            'end_time': t.end_time.strftime('%I:%M %p'),
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students_attendance_summary(request):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can access this'}, status=status.HTTP_403_FORBIDDEN)

    section_id = request.query_params.get('section_id')
    subject_id = request.query_params.get('subject_id')

    if not section_id:
        return Response({'error': 'section_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    section = get_object_or_404(Section, id=section_id)
    students = section.students.filter(role='student').order_by('student_profile__enrollment_number')

    if subject_id:
        subjects = Subject.objects.filter(id=subject_id, faculty=request.user)
    else:
        subjects = Subject.objects.filter(faculty=request.user)

    data = []
    for student in students:
        try:
            profile = student.student_profile
            enrollment = profile.enrollment_number
            branch = profile.branch
            semester = profile.semester
        except:
            enrollment = "N/A"
            branch = "N/A"
            semester = "N/A"

        subject_wise = []
        overall_present = 0
        overall_total = 0

        for subject in subjects:
            total_classes = AttendanceSession.objects.filter(
                subject=subject,
                section=section
            ).count()
            total_present = AttendanceRecord.objects.filter(
                student=student,
                session__subject=subject,
                session__section=section,
                status='present'
            ).count()
            total_absent = total_classes - total_present
            percentage = round((total_present / total_classes * 100), 1) if total_classes > 0 else 0

            overall_present += total_present
            overall_total += total_classes

            subject_wise.append({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'subject_code': subject.code,
                'total_classes': total_classes,
                'total_present': total_present,
                'total_absent': total_absent,
                'percentage': percentage,
            })

        overall_percentage = round((overall_present / overall_total * 100), 1) if overall_total > 0 else 0

        data.append({
            'student_id': student.id,
            'name': student.get_full_name(),
            'username': student.username,
            'enrollment_number': enrollment,
            'branch': branch,
            'semester': semester,
            'overall_present': overall_present,
            'overall_total': overall_total,
            'overall_percentage': overall_percentage,
            'subject_wise': subject_wise,
            'is_at_risk': overall_percentage < 75 and overall_total > 0,
        })

    return Response({
        'section': f"Section {section.name} - Sem {section.semester}",
        'total_students': len(data),
        'students': data
    })