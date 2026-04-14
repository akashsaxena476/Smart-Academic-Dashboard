from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Resource, ResourceView
from .serializers import ResourceSerializer
from academics.models import Subject, Section
from users.models import CustomUser
from notifications.models import Notification


# ─── FACULTY VIEWS ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resource(request):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can upload resources'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title')
    description = request.data.get('description', '')
    resource_type = request.data.get('resource_type', 'notes')
    subject_id = request.data.get('subject')
    file = request.FILES.get('file')

    if not title or not subject_id or not file:
        return Response({'error': 'Title, subject and file are required'}, status=status.HTTP_400_BAD_REQUEST)

    subject = get_object_or_404(Subject, id=subject_id)

    resource = Resource.objects.create(
        title=title,
        description=description,
        resource_type=resource_type,
        subject=subject,
        file=file,
        uploaded_by=request.user
    )

    serializer = ResourceSerializer(resource, context={'request': request})
    # Notify all students of this subject
    students = CustomUser.objects.filter(
    role='student',
    student_profile__semester=subject.semester,
    student_profile__branch=subject.department.name
)
    for student in students:
        Notification.objects.create(
        recipient=student,
        title=f"New Resource: {title}",
        message=f"{request.user.get_full_name()} uploaded '{title}' for {subject.name}",
        notification_type='resource'
    )
    return Response({
        'message': 'Resource uploaded successfully',
        'resource': serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_resource(request, resource_id):
    resource = get_object_or_404(Resource, id=resource_id)

    if request.method == 'GET':
        if request.user.role == 'student':
            if not hasattr(request.user, 'student_profile'):
                return Response({'error': 'Student profile not found'}, status=status.HTTP_403_FORBIDDEN)
            profile = request.user.student_profile
            if not (resource.subject.semester == profile.semester and resource.subject.department.name == profile.branch):
                return Response({'error': 'You do not have permission to view this resource'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'faculty':
            # Faculty can view their own resources or perhaps all, but for manage, maybe only own
            pass  # Allow for now
        else:
            return Response({'error': 'Invalid role'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ResourceSerializer(resource, context={'request': request})
        return Response(serializer.data)

    if request.user.role != 'faculty' or resource.uploaded_by != request.user:
        return Response({'error': 'You do not have permission to modify this resource'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = ResourceSerializer(resource, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Resource updated successfully',
                'resource': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        resource.delete()
        return Response({'message': 'Resource deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_faculty_resources(request):
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can access this'}, status=status.HTTP_403_FORBIDDEN)

    subject_id = request.query_params.get('subject_id')
    resource_type = request.query_params.get('resource_type')

    resources = Resource.objects.filter(uploaded_by=request.user)

    if subject_id:
        resources = resources.filter(subject_id=subject_id)
    if resource_type:
        resources = resources.filter(resource_type=resource_type)

    resources = resources.order_by('-uploaded_at')
    serializer = ResourceSerializer(resources, many=True, context={'request': request})
    return Response(serializer.data)


# ─── STUDENT VIEWS ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_resources(request):
    if request.user.role != 'student':
        return Response({'error': 'Only students can access this'}, status=status.HTTP_403_FORBIDDEN)

    subject_id = request.query_params.get('subject_id')
    resource_type = request.query_params.get('resource_type')

    if not hasattr(request.user, 'student_profile'):
        return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = request.user.student_profile
    resources = Resource.objects.filter(
        subject__semester=profile.semester,
        subject__department__name=profile.branch,
        is_active=True
    )

    if subject_id:
        resources = resources.filter(subject_id=subject_id)
    if resource_type:
        resources = resources.filter(resource_type=resource_type)

    resources = resources.order_by('-uploaded_at')
    serializer = ResourceSerializer(resources, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_resource_viewed(request, resource_id):
    if request.user.role != 'student':
        return Response({'error': 'Only students can mark resources as viewed'}, status=status.HTTP_403_FORBIDDEN)

    resource = get_object_or_404(Resource, id=resource_id)
    ResourceView.objects.get_or_create(resource=resource, student=request.user)
    return Response({'message': 'Resource marked as viewed'})