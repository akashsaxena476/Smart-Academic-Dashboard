from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Exam, ExamResult
from .serializers import ExamSerializer, ExamResultSerializer
from academics.models import Subject, Section
from users.models import CustomUser
from notifications.models import Notification
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
# ─── FACULTY VIEWS ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_exam(request):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can create exams'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title')
    exam_type = request.data.get('exam_type')
    subject_id = request.data.get('subject')
    section_id = request.data.get('section')
    date = request.data.get('date')
    max_marks = request.data.get('max_marks')
    passing_marks = request.data.get('passing_marks')

    if not all([title, exam_type, subject_id, section_id, date, max_marks, passing_marks]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    subject = get_object_or_404(Subject, id=subject_id)
    section = get_object_or_404(Section, id=section_id)

    exam = Exam.objects.create(
        title=title,
        exam_type=exam_type,
        subject=subject,
        section=section,
        conducted_by=request.user,
        date=date,
        max_marks=float(max_marks),
        passing_marks=float(passing_marks)
    )

    serializer = ExamSerializer(exam)
    return Response({
        'message': 'Exam created successfully',
        'exam': serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enter_exam_results(request, exam_id):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can enter results'}, status=status.HTTP_403_FORBIDDEN)

    exam = get_object_or_404(Exam, id=exam_id, conducted_by=request.user)
    results_data = request.data.get('results', [])

    if not results_data:
        return Response({'error': 'Results data is required'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    updated = []

    for item in results_data:
        student = get_object_or_404(CustomUser, id=item.get('student_id'))
        is_absent = item.get('is_absent', False)
        marks_obtained = item.get('marks_obtained', 0) if not is_absent else 0
        remarks = item.get('remarks', '')

        result, created_flag = ExamResult.objects.update_or_create(
            exam=exam,
            student=student,
            defaults={
                'marks_obtained': marks_obtained,
                'is_absent': is_absent,
                'remarks': remarks,
                'entered_by': request.user
            }
        )

        if created_flag:
            created.append(student.get_full_name())
        else:
            updated.append(student.get_full_name())
        Notification.objects.update_or_create(
            recipient=student,
            title=f"Marks Published: {exam.title}",
            defaults={
                'message': f"Your marks for {exam.title} ({exam.subject.name}) have been published. Marks: {marks_obtained}/{exam.max_marks}",
                'notification_type': 'marks',
                'is_read': False
            }
        )

    return Response({
        'message': f'{len(created)} results created, {len(updated)} results updated',
        'exam': ExamSerializer(exam).data
    })


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_exam(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if request.method == 'GET':
        serializer = ExamSerializer(exam)
        return Response(serializer.data)

    if request.user.role != 'faculty' or exam.conducted_by != request.user:
        return Response({'error': 'You do not have permission to modify this exam'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = ExamSerializer(exam, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Exam updated successfully',
                'exam': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        exam.delete()
        return Response({'message': 'Exam deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_faculty_exams(request):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can access this'}, status=status.HTTP_403_FORBIDDEN)

    subject_id = request.query_params.get('subject_id')
    exam_type = request.query_params.get('exam_type')
    section_id = request.query_params.get('section_id')

    exams = Exam.objects.filter(conducted_by=request.user)

    if subject_id:
        exams = exams.filter(subject_id=subject_id)
    if exam_type:
        exams = exams.filter(exam_type=exam_type)
    if section_id:
        exams = exams.filter(section_id=section_id)

    exams = exams.order_by('-date')
    serializer = ExamSerializer(exams, many=True)
    return Response(serializer.data)


# ─── STUDENT VIEWS ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_results(request):
    if request.user.role != 'student':
        return Response({'error': 'Only students can access this'}, status=status.HTTP_403_FORBIDDEN)

    subject_id = request.query_params.get('subject_id')
    exam_type = request.query_params.get('exam_type')

    results = ExamResult.objects.filter(student=request.user)

    if subject_id:
        results = results.filter(exam__subject_id=subject_id)
    if exam_type:
        results = results.filter(exam__exam_type=exam_type)

    results = results.order_by('-exam__date')

    data = []
    for result in results:
        percentage = round(float(result.marks_obtained) / float(result.exam.max_marks) * 100, 2) if not result.is_absent else 0
        data.append({
            'subject_name': result.exam.subject.name,
            'subject_code': result.exam.subject.code,
            'exam_title': result.exam.title,
            'exam_type': result.exam.exam_type,
            'date': result.exam.date,
            'marks_obtained': result.marks_obtained,
            'max_marks': result.exam.max_marks,
            'passing_marks': result.exam.passing_marks,
            'is_passed': result.marks_obtained >= result.exam.passing_marks,
            'is_absent': result.is_absent,
            'percentage': percentage,
            'remarks': result.remarks
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_exam_summary(request):
    if request.user.role != 'student':
        return Response({'error': 'Only students can access this'}, status=status.HTTP_403_FORBIDDEN)

    try:
        profile = request.user.student_profile
        subjects = Subject.objects.filter(
            semester=profile.semester,
            department__name=profile.branch
        )
    except:
        return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

    summary = []
    for subject in subjects:
        results = ExamResult.objects.filter(
            student=request.user,
            exam__subject=subject
        )
        total_exams = results.count()
        passed = results.filter(is_absent=False, marks_obtained__gte=subject.exams.first().passing_marks).count() if subject.exams.exists() else 0

        summary.append({
            'subject_id': subject.id,
            'subject_name': subject.name,
            'subject_code': subject.code,
            'total_exams': total_exams,
            'exams_passed': passed,
        })

    return Response(summary)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_marks_pdf(request):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can download marks'}, status=status.HTTP_403_FORBIDDEN)

    exam_type = request.query_params.get('exam_type')
    subject_id = request.query_params.get('subject_id')
    section_id = request.query_params.get('section_id')

    exams = Exam.objects.filter(conducted_by=request.user)
    if exam_type:
        exams = exams.filter(exam_type=exam_type)
    if subject_id:
        exams = exams.filter(subject_id=subject_id)
    if section_id:
        exams = exams.filter(section_id=section_id)
    exams = exams.order_by('date')

    if not exams.exists():
        return Response({'error': 'No exams found for selected filters'}, status=status.HTTP_404_NOT_FOUND)

    # ── Setup PDF ─────────────────────────────────────────────
    response = HttpResponse(content_type='application/pdf')
    filename = f"Marks_Report_{datetime.now().strftime('%d%b%Y')}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition'

    doc = SimpleDocTemplate(
        response,
        pagesize=landscape(A4),
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )

    styles = getSampleStyleSheet()
    elements = []

# ── Custom Colors ─────────────────────────────────────────
    PRIMARY = colors.HexColor('#4F46E5')
    PRIMARY_LIGHT = colors.HexColor('#EEF2FF')
    SUCCESS = colors.HexColor('#059669')
    SUCCESS_LIGHT = colors.HexColor('#D1FAE5')
    DANGER = colors.HexColor('#DC2626')
    DANGER_LIGHT = colors.HexColor('#FEE2E2')
    GRAY = colors.HexColor('#6B7280')
    GRAY_LIGHT = colors.HexColor('#F9FAFB')
    DARK = colors.HexColor('#1E293B')
    WHITE = colors.white
    HEADER_BG = colors.HexColor('#1E3A5F')      # Dark navy - main title
    SUBHEADER_BG = colors.HexColor('#2D6A4F')   # Dark green - subtitle
    ALT_ROW = colors.HexColor('#F8FAFF')
    EXAM_HEADER_BG = colors.HexColor('#4F46E5') # Indigo - exam section header
    STATS_BG = colors.HexColor('#F0F9FF')
    STATS_BORDER = colors.HexColor('#BAE6FD')
    TABLE_HEADER_BG = colors.HexColor('#1E3A5F') # Dark navy - table header

    # ── Title Styles ──────────────────────────────────────────
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Normal'],
        fontSize=18,
        fontName='Helvetica-Bold',
        textColor=WHITE,
        alignment=TA_CENTER,
        leading=22,
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=9,
        fontName='Helvetica',
        textColor=colors.HexColor('#DBEAFE'),
        alignment=TA_CENTER,
        leading=13,
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
        textColor=WHITE,
        alignment=TA_LEFT,
        leftIndent=6,
        leading=14,
    )
    normal_center = ParagraphStyle(
        'NormalCenter',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
    )

# ── Main Title + Info Combined Banner ────────────────────
    info_text = f"Faculty: {request.user.get_full_name()}   |   Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p')}   |   Total Exams: {exams.count()}"
    banner_data = [
        [Paragraph("EXAM MARKS REPORT", title_style)],
        [Paragraph(info_text, subtitle_style)],
    ]
    banner_table = Table(banner_data, colWidths=[doc.width])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('BACKGROUND', (0, 1), (-1, 1), SUBHEADER_BG),
        ('TOPPADDING', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, 1), 7),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#818CF8')),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 0.4*cm))

    # ── Per Exam Section ──────────────────────────────────────
    exam_type_labels = {
        'sessional1': 'Sessional 1', 'sessional2': 'Sessional 2',
        'endsem': 'End Semester', 'practical': 'Practical',
        'assignment': 'Assignment', 'other': 'Other',
    }

    for exam in exams:
        results = exam.results.all().order_by('student__student_profile__enrollment_number')
        if not results.exists():
            continue

        # ── Exam Header ───────────────────────────────────────
        exam_header_data = [[
            Paragraph(
                f"{exam.title}   |   {exam_type_labels.get(exam.exam_type, exam.exam_type)}   |   "
                f"{exam.subject.name} ({exam.subject.code})   |   "
                f"Section {exam.section.name}   |   Date: {exam.date.strftime('%d %b %Y')}   |   "
                f"Max: {exam.max_marks}   |   Pass: {exam.passing_marks}",
                section_style
            )
        ]]
        exam_header_table = Table(exam_header_data, colWidths=[doc.width])
        exam_header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(exam_header_table)

        # ── Stats Row ─────────────────────────────────────────
        exam_title_style = ParagraphStyle(
            'ExamTitle',
            parent=styles['Normal'],
            fontSize=11,
            fontName='Helvetica-Bold',
            textColor=WHITE,
            alignment=TA_LEFT,
            leftIndent=4,
            leading=15,
        )
        exam_meta_style = ParagraphStyle(
            'ExamMeta',
            parent=styles['Normal'],
            fontSize=9,
            fontName='Helvetica',
            textColor=colors.HexColor('#E0F2FE'),
            alignment=TA_LEFT,
            leftIndent=4,
            leading=13,
        )
        exam_header_data = [
            [Paragraph(f"{exam.title}  —  {exam_type_labels.get(exam.exam_type, exam.exam_type)}", exam_title_style)],
            [Paragraph(
                f"Subject: {exam.subject.name} ({exam.subject.code})   |   Section: {exam.section.name}   |   "
                f"Date: {exam.date.strftime('%d %b %Y')}   |   Max Marks: {exam.max_marks}   |   Passing Marks: {exam.passing_marks}",
                exam_meta_style
            )],
        ]
        exam_header_table = Table(exam_header_data, colWidths=[doc.width])
        exam_header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), EXAM_HEADER_BG),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
            ('TOPPADDING', (0, 1), (-1, 1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.HexColor('#7DD3FC')),
        ]))
        elements.append(exam_header_table)

        # ── Results Table ─────────────────────────────────────
        col_widths = [1.2*cm, 3.5*cm, 4*cm, 2.5*cm, 2.5*cm, 2*cm, 2.5*cm, 2.5*cm, 3*cm]
        table_data = [[
            Paragraph('<b>#</b>', normal_center),
            Paragraph('<b>Enrollment No.</b>', normal_center),
            Paragraph('<b>Student Name</b>', normal_center),
            Paragraph('<b>Marks Obtained</b>', normal_center),
            Paragraph('<b>Max Marks</b>', normal_center),
            Paragraph('<b>Percentage</b>', normal_center),
            Paragraph('<b>Status</b>', normal_center),
            Paragraph('<b>Pass/Fail</b>', normal_center),
            Paragraph('<b>Remarks</b>', normal_center),
        ]]

        for idx, result in enumerate(results):
            percentage = round(float(result.marks_obtained) / float(exam.max_marks) * 100, 1) if not result.is_absent else 0
            is_passed = result.marks_obtained >= exam.passing_marks

            if result.is_absent:
                status_text = "Absent"
                pf_text = "—"
            elif is_passed:
                status_text = "Present"
                pf_text = "Pass"
            else:
                status_text = "Present"
                pf_text = "Fail"

            table_data.append([
                Paragraph(str(idx + 1), normal_center),
                Paragraph(getattr(result.student, 'student_profile', None) and result.student.student_profile.enrollment_number or "—", normal_center),
                Paragraph(result.student.get_full_name() or "—", normal_center),
                Paragraph("—" if result.is_absent else str(result.marks_obtained), normal_center),
                Paragraph(str(exam.max_marks), normal_center),
                Paragraph("—" if result.is_absent else f"{percentage}%", normal_center),
                Paragraph(status_text, normal_center),
                Paragraph(pf_text, normal_center),
                Paragraph(result.remarks or "—", normal_center),
            ])

        results_table = Table(table_data, colWidths=col_widths, repeatRows=1)

        # Base style
        table_style = [
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('TOPPADDING', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 9),
            # Data rows
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, ALT_ROW]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]

        # Color code each result row
        for idx, result in enumerate(results):
            row = idx + 1
            is_passed = result.marks_obtained >= exam.passing_marks
            if result.is_absent:
                table_style += [
                    ('BACKGROUND', (6, row), (6, row), colors.HexColor('#F3F4F6')),
                    ('TEXTCOLOR', (6, row), (7, row), GRAY),
                ]
            elif is_passed:
                table_style += [
                    ('BACKGROUND', (7, row), (7, row), SUCCESS_LIGHT),
                    ('TEXTCOLOR', (7, row), (7, row), SUCCESS),
                    ('FONTNAME', (7, row), (7, row), 'Helvetica-Bold'),
                ]
            else:
                table_style += [
                    ('BACKGROUND', (7, row), (7, row), DANGER_LIGHT),
                    ('TEXTCOLOR', (7, row), (7, row), DANGER),
                    ('FONTNAME', (7, row), (7, row), 'Helvetica-Bold'),
                ]

            # Color percentage cell
            if not result.is_absent:
                pct = float(result.marks_obtained) / float(exam.max_marks) * 100
                if pct >= 75:
                    table_style.append(('TEXTCOLOR', (5, row), (5, row), SUCCESS))
                else:
                    table_style.append(('TEXTCOLOR', (5, row), (5, row), DANGER))

        results_table.setStyle(TableStyle(table_style))
        elements.append(results_table)
        elements.append(Spacer(1, 0.5*cm))

    # ── Footer ────────────────────────────────────────────────
    footer_data = [[
        Paragraph(
            f"This report was generated automatically by Smart Academic Dashboard on {datetime.now().strftime('%d %B %Y at %I:%M %p')}",
            ParagraphStyle('footer', parent=styles['Normal'], fontSize=8, textColor=GRAY, alignment=TA_CENTER)
        )
    ]]
    footer_table = Table(footer_data, colWidths=[doc.width])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#E5E7EB')),
    ]))
    elements.append(footer_table)

    doc.build(elements)
    return response