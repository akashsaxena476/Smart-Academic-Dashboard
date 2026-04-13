from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Notice, NoticeRead
from users.models import CustomUser
from notifications.models import Notification

# ── HOD Views ─────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_notice(request):
    try:
        if not request.user.faculty_profile.is_hod:
            return Response({'error': 'Only HODs can create notices'}, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title')
    content = request.data.get('content')
    recipient_type = request.data.get('recipient_type', 'all')
    specific_recipient_ids = request.data.get('specific_recipients', [])

    if not title or not content:
        return Response({'error': 'Title and content are required'}, status=status.HTTP_400_BAD_REQUEST)

    notice = Notice.objects.create(
        title=title,
        content=content,
        sent_by=request.user,
        recipient_type=recipient_type,
        is_active=True
    )

    if recipient_type == 'specific' and specific_recipient_ids:
        recipients = CustomUser.objects.filter(id__in=specific_recipient_ids, role='faculty')
        notice.specific_recipients.set(recipients)

    if recipient_type == 'all':
        recipients = CustomUser.objects.filter(role='faculty')
    else:
        recipients = CustomUser.objects.filter(id__in=specific_recipient_ids, role='faculty')

    for recipient in recipients:
        Notification.objects.create(
            recipient=recipient,
            title=f"New Notice: {title}",
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
    try:
        if not request.user.faculty_profile.is_hod:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    notices = Notice.objects.filter(sent_by=request.user)
    return Response([serialize_notice(n, request.user) for n in notices])


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notice(request, notice_id):
    try:
        if not request.user.faculty_profile.is_hod:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    notice = get_object_or_404(Notice, id=notice_id, sent_by=request.user)
    notice.delete()
    return Response({'message': 'Notice deleted successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_faculty_notices(request):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can access notices'}, status=status.HTTP_403_FORBIDDEN)

    # Get all notices sent to all faculty
    all_notices = Notice.objects.filter(
        recipient_type='all',
        is_active=True
    )

    # Get notices specifically sent to this faculty
    specific_notices = Notice.objects.filter(
        recipient_type='specific',
        specific_recipients__in=[request.user],
        is_active=True
    )

    # Combine and remove duplicates
    from django.db.models import Q
    notices = Notice.objects.filter(
        Q(recipient_type='all', is_active=True) |
        Q(recipient_type='specific', specific_recipients__in=[request.user], is_active=True)
    ).distinct().order_by('-created_at')

    return Response([serialize_notice(n, request.user) for n in notices])

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notice_read(request, notice_id):
    notice = get_object_or_404(Notice, id=notice_id)
    NoticeRead.objects.get_or_create(notice=notice, faculty=request.user)
    return Response({'message': 'Notice marked as read'})


# ── Helper ─────────────────────────────────────────────────────

def serialize_notice(notice, user):
    is_read = NoticeRead.objects.filter(notice=notice, faculty=user).exists()
    read_count = notice.read_by.count()
    return {
        'id': notice.id,
        'title': notice.title,
        'content': notice.content,
        'sent_by': notice.sent_by.get_full_name(),
        'sent_by_department': getattr(notice.sent_by.faculty_profile, 'department', ''),
        'recipient_type': notice.recipient_type,
        'is_active': notice.is_active,
        'is_read': is_read,
        'read_count': read_count,
        'created_at': notice.created_at,
    }

