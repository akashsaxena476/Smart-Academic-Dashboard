from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Notice, NoticeRead
from users.models import CustomUser
from notifications.models import Notification


def is_hod(user):
    try:
        return user.faculty_profile.is_hod
    except:
        return False


def get_hod_semesters(user):
    try:
        profile = user.faculty_profile
        semesters = []
        if profile.hod_year_1: semesters.extend([1, 2])
        if profile.hod_year_2: semesters.extend([3, 4])
        if profile.hod_year_3: semesters.extend([5, 6])
        if profile.hod_year_4: semesters.extend([7, 8])
        return semesters
    except:
        return []


def serialize_notice(notice, user):
    try:
        is_read = NoticeRead.objects.filter(notice=notice, user=user).exists()
    except:
        is_read = False
    read_count = notice.read_by.count()

    return {
        'id': notice.id,
        'title': notice.title,
        'content': notice.content,
        'sent_by': notice.sent_by.get_full_name(),
        'sent_by_department': getattr(
            getattr(notice.sent_by, 'faculty_profile', None),
            'department', ''
        ),
        'recipient_type': notice.recipient_type,
        'target_year': notice.target_year,
        'target_semester': notice.target_semester,
        'target_section': notice.target_section,
        'is_active': notice.is_active,
        'is_read': is_read,
        'read_count': read_count,
        'created_at': notice.created_at,
    }


# ── HOD Views ─────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_notice(request):
    if not is_hod(request.user):
        return Response(
            {'error': 'Only HODs can create notices'},
            status=status.HTTP_403_FORBIDDEN
        )

    title = request.data.get('title')
    content = request.data.get('content')
    recipient_type = request.data.get('recipient_type', 'all_faculty')
    specific_recipient_ids = request.data.get('specific_recipients', [])
    target_year = request.data.get('target_year')
    target_semester = request.data.get('target_semester')
    target_section = request.data.get('target_section')

    if not title or not content:
        return Response(
            {'error': 'Title and content are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate specific faculty selection
    if recipient_type == 'specific_faculty' and not specific_recipient_ids:
        return Response(
            {'error': 'Please select at least one faculty member'},
            status=status.HTTP_400_BAD_REQUEST
        )

    notice = Notice.objects.create(
        title=title,
        content=content,
        sent_by=request.user,
        recipient_type=recipient_type,
        target_year=target_year if target_year else None,
        target_semester=int(target_semester) if target_semester else None,
        target_section=target_section if target_section else None,
        is_active=True
    )

    # Set specific faculty recipients
    if recipient_type == 'specific_faculty' and specific_recipient_ids:
        recipients = CustomUser.objects.filter(
            id__in=specific_recipient_ids,
            role='faculty'
        )
        notice.specific_recipients.set(recipients)

    # ── Create bell notifications ──────────────────────────────
    department = request.user.faculty_profile.department
    semesters = get_hod_semesters(request.user)

    if recipient_type == 'all_faculty':
        notify_users = CustomUser.objects.filter(
            role='faculty',
            faculty_profile__is_hod=False,
            faculty_profile__department=department
        )
    elif recipient_type == 'specific_faculty':
        notify_users = CustomUser.objects.filter(
            id__in=specific_recipient_ids,
            role='faculty'
        )
    elif recipient_type == 'all_students':
        notify_users = CustomUser.objects.filter(
            role='student',
            student_profile__semester__in=semesters,
            student_profile__branch=department
        )
    elif recipient_type == 'specific_students':
        query = CustomUser.objects.filter(
            role='student',
            student_profile__branch=department
        )
        if target_year:
            year_map = {'1': [1,2], '2': [3,4], '3': [5,6], '4': [7,8]}
            year_sems = year_map.get(target_year, [])
            query = query.filter(student_profile__semester__in=year_sems)
        if target_semester:
            query = query.filter(student_profile__semester=int(target_semester))
        if target_section:
            query = query.filter(student_profile__section=target_section)
        notify_users = query
    else:
        notify_users = CustomUser.objects.none()

    for user in notify_users:
        Notification.objects.create(
            recipient=user,
            title=f"📢 New Notice: {title}",
            message=f"HOD {request.user.get_full_name()} sent a notice — {title}",
            notification_type='general'
        )

    return Response({
        'message': 'Notice sent successfully',
        'notice': serialize_notice(notice, request.user)
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_hod_notices(request):
    if not is_hod(request.user):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    notices = Notice.objects.filter(sent_by=request.user)
    return Response([serialize_notice(n, request.user) for n in notices])


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notice(request, notice_id):
    if not is_hod(request.user):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    notice = get_object_or_404(Notice, id=notice_id, sent_by=request.user)
    notice.delete()
    return Response({'message': 'Notice deleted successfully'})


# ── Faculty Views ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_faculty_notices(request):
    if request.user.role != 'faculty':
        return Response(
            {'error': 'Only faculty can access this'},
            status=status.HTTP_403_FORBIDDEN
        )

    from django.db.models import Q
    notices = Notice.objects.filter(
        Q(recipient_type='all_faculty', is_active=True) |
        Q(recipient_type='specific_faculty',
          specific_recipients__in=[request.user],
          is_active=True)
    ).distinct().order_by('-created_at')

    return Response([serialize_notice(n, request.user) for n in notices])


# ── Student Views ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_notices(request):
    if request.user.role != 'student':
        return Response(
            {'error': 'Only students can access this'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        profile = request.user.student_profile
        semester = profile.semester
        section = profile.section
        branch = profile.branch

        year_map = {
            1: '1', 2: '1',
            3: '2', 4: '2',
            5: '3', 6: '3',
            7: '4', 8: '4',
        }
        year_group = year_map.get(semester, '')
    except:
        return Response([], status=status.HTTP_200_OK)

    from django.db.models import Q
    notices = Notice.objects.filter(
        is_active=True
    ).filter(
        Q(recipient_type='all_students') |
        Q(
            recipient_type='specific_students',
            target_year=year_group
        ) |
        Q(
            recipient_type='specific_students',
            target_semester=semester
        ) |
        Q(
            recipient_type='specific_students',
            target_section=section
        )
    ).distinct().order_by('-created_at')

    return Response([serialize_notice(n, request.user) for n in notices])


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notice_read(request, notice_id):
    notice = get_object_or_404(Notice, id=notice_id)
    NoticeRead.objects.get_or_create(notice=notice, user=request.user)
    return Response({'message': 'Notice marked as read'})