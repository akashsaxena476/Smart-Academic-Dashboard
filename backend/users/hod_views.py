from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from users.models import CustomUser, StudentProfile, FacultyProfile
from academics.models import Subject, Section, Department
from academics.models import Subject, Section, Department
from attendance.models import AttendanceSession, AttendanceRecord
from exams.models import Exam, ExamResult


def get_hod_semesters(user):
    try:
        profile = user.faculty_profile
        if not profile.is_hod:
            return None
        return profile.get_hod_semesters()
    except:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hod_overview(request):
    semesters = get_hod_semesters(request.user)
    if semesters is None:
        return Response({'error': 'Access denied. You are not a HOD.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        department = request.user.faculty_profile.department
    except:
        return Response({'error': 'Faculty profile not found'}, status=status.HTTP_404_NOT_FOUND)

    students = CustomUser.objects.filter(
        role='student',
        student_profile__semester__in=semesters,
        student_profile__branch=department
    )

    subjects_in_semesters = Subject.objects.filter(
        semester__in=semesters,
        department__name=department
    )
    faculty_ids = subjects_in_semesters.values_list('faculty', flat=True).distinct()
    faculty = CustomUser.objects.filter(id__in=faculty_ids, role='faculty')

    sections = Section.objects.filter(
        semester__in=semesters,
        department__name=department
    )

    total_sessions = AttendanceSession.objects.filter(
        subject__in=subjects_in_semesters
    ).count()

    # Fixed low attendance calculation
    low_attendance_count = 0
    for student in students:
        total_classes = AttendanceRecord.objects.filter(
            student=student,
            session__subject__in=subjects_in_semesters
        ).count()
        total_present = AttendanceRecord.objects.filter(
            student=student,
            session__subject__in=subjects_in_semesters,
            status='present'
        ).count()
        if total_classes > 0:
            percentage = (total_present / total_classes) * 100
            if percentage < 75:
                low_attendance_count += 1

    total_exams = Exam.objects.filter(
        subject__in=subjects_in_semesters
    ).count()

    return Response({
        'department': department,
        'semesters': semesters,
        'year_group': semesters,
        'total_students': students.count(),
        'total_faculty': faculty.count(),
        'total_sections': sections.count(),
        'total_subjects': subjects_in_semesters.count(),
        'total_sessions': total_sessions,
        'total_exams': total_exams,
        'low_attendance_students': low_attendance_count,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hod_students(request):
    semesters = get_hod_semesters(request.user)
    if semesters is None:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    department = request.user.faculty_profile.department
    semester_filter = request.query_params.get('semester')
    section_filter = request.query_params.get('section')
    search = request.query_params.get('search', '')

    students = CustomUser.objects.filter(
        role='student',
        student_profile__semester__in=semesters,
        student_profile__branch=department
    ).select_related('student_profile')

    if semester_filter:
        students = students.filter(student_profile__semester=semester_filter)
    if section_filter:
        students = students.filter(student_profile__section=section_filter)
    if search:
        students = students.filter(
            student_profile__enrollment_number__icontains=search
        ) | students.filter(
            first_name__icontains=search
        ) | students.filter(
            last_name__icontains=search
        )

    data = []
    for student in students:
        try:
            profile = student.student_profile
            total_classes = AttendanceRecord.objects.filter(student=student).count()
            total_present = AttendanceRecord.objects.filter(student=student, status='present').count()
            percentage = round((total_present / total_classes * 100), 1) if total_classes > 0 else 0
            data.append({
                'id': student.id,
                'name': student.get_full_name(),
                'username': student.username,
                'email': student.email,
                'enrollment_number': profile.enrollment_number,
                'branch': profile.branch,
                'semester': profile.semester,
                'section': profile.section,
                'overall_attendance': percentage,
                'is_at_risk': percentage < 75 and total_classes > 0,
                'total_classes': total_classes,
                'total_present': total_present,
            })
        except:
            pass

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hod_faculty(request):
    semesters = get_hod_semesters(request.user)
    if semesters is None:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    department = request.user.faculty_profile.department
    subjects_in_semesters = Subject.objects.filter(
        semester__in=semesters,
        department__name=department
    )
    faculty_ids = subjects_in_semesters.values_list('faculty', flat=True).distinct()
    faculty_list = CustomUser.objects.filter(id__in=faculty_ids, role='faculty').select_related('faculty_profile')

    data = []
    for faculty in faculty_list:
        subjects = subjects_in_semesters.filter(faculty=faculty)
        total_sessions = AttendanceSession.objects.filter(
            faculty=faculty,
            subject__in=subjects
        ).count()

        try:
            profile = faculty.faculty_profile
            employee_id = profile.employee_id
            designation = profile.designation or 'Faculty'
        except:
            employee_id = 'N/A'
            designation = 'Faculty'

        data.append({
            'id': faculty.id,
            'name': faculty.get_full_name(),
            'username': faculty.username,
            'email': faculty.email,
            'employee_id': employee_id,
            'designation': designation,
            'subjects_count': subjects.count(),
            'subjects': list(subjects.values('name', 'code', 'semester')),
            'total_sessions': total_sessions,
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hod_attendance(request):
    semesters = get_hod_semesters(request.user)
    if semesters is None:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    department = request.user.faculty_profile.department
    semester_filter = request.query_params.get('semester')
    subject_filter = request.query_params.get('subject_id')

    subjects = Subject.objects.filter(
        semester__in=semesters,
        department__name=department
    )
    if semester_filter:
        subjects = subjects.filter(semester=semester_filter)
    if subject_filter:
        subjects = subjects.filter(id=subject_filter)

    sections = Section.objects.filter(
        semester__in=semesters,
        department__name=department
    )

    data = []
    for section in sections:
        students = section.students.filter(role='student')
        section_data = {
            'section_id': section.id,
            'section_name': f"Section {section.name} - Sem {section.semester}",
            'semester': section.semester,
            'total_students': students.count(),
            'subjects': []
        }

        for subject in subjects.filter(semester=section.semester):
            total_sessions = AttendanceSession.objects.filter(
                subject=subject, section=section
            ).count()

            if total_sessions == 0:
                continue

            present_count = AttendanceRecord.objects.filter(
                session__subject=subject,
                session__section=section,
                status='present'
            ).count()

            total_records = AttendanceRecord.objects.filter(
                session__subject=subject,
                session__section=section
            ).count()

            avg_attendance = round(
                (present_count / total_records * 100), 1
            ) if total_records > 0 else 0

            section_data['subjects'].append({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'subject_code': subject.code,
                'faculty_name': subject.faculty.get_full_name() if subject.faculty else 'TBA',
                'total_sessions': total_sessions,
                'average_attendance': avg_attendance,
            })

        if section_data['subjects']:
            data.append(section_data)

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hod_exams(request):
    semesters = get_hod_semesters(request.user)
    if semesters is None:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    department = request.user.faculty_profile.department
    semester_filter = request.query_params.get('semester')
    exam_type_filter = request.query_params.get('exam_type')

    subjects = Subject.objects.filter(
        semester__in=semesters,
        department__name=department
    )
    if semester_filter:
        subjects = subjects.filter(semester=semester_filter)

    exams = Exam.objects.filter(subject__in=subjects).select_related(
        'subject', 'section', 'conducted_by'
    ).order_by('-date')

    if exam_type_filter:
        exams = exams.filter(exam_type=exam_type_filter)

    exam_type_labels = {
        'sessional1': 'Sessional 1', 'sessional2': 'Sessional 2',
        'endsem': 'End Semester', 'practical': 'Practical',
        'assignment': 'Assignment', 'other': 'Other',
    }

    data = []
    for exam in exams:
        results = exam.results.all()
        appeared = results.filter(is_absent=False).count()
        passed = results.filter(is_absent=False, marks_obtained__gte=exam.passing_marks).count()
        avg = round(
            sum(float(r.marks_obtained) for r in results.filter(is_absent=False)) / appeared, 1
        ) if appeared > 0 else 0

        data.append({
            'id': exam.id,
            'title': exam.title,
            'exam_type': exam_type_labels.get(exam.exam_type, exam.exam_type),
            'subject_name': exam.subject.name,
            'subject_code': exam.subject.code,
            'section_name': exam.section.name,
            'semester': exam.subject.semester,
            'conducted_by': exam.conducted_by.get_full_name(),
            'date': exam.date,
            'max_marks': exam.max_marks,
            'passing_marks': exam.passing_marks,
            'total_students': results.count(),
            'appeared': appeared,
            'passed': passed,
            'failed': appeared - passed,
            'average_marks': avg,
            'pass_percentage': round(passed / appeared * 100, 1) if appeared > 0 else 0,
        })

    return Response(data)