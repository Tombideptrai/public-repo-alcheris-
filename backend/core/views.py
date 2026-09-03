from copy import deepcopy
import uuid

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Block, Course, Enrollment, Lesson, LessonEnrollment, LessonProgress, Page, Profile
from .serializers import CourseSerializer, EmailOrUsernameTokenObtainPairSerializer, LessonDetailSerializer, LessonListSerializer, can_view_lesson


ALLOWED_BLOCK_TYPES = {'text', 'paragraph', 'h1', 'h2', 'h3', 'image', 'video', 'quiz'}


def user_data(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return {'id': user.id, 'username': user.username, 'email': user.email, 'role': 'teacher' if profile.is_teacher else 'student', 'is_teacher': profile.is_teacher}


def is_lesson_owner(user, lesson):
    return user.is_authenticated and lesson.author_id == user.id


def is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def create_first_page(lesson):
    page = Page.objects.create(lesson=lesson, title='Page 1', group=lesson.module_name or 'Module 1', order=0)
    Block.objects.create(page=page, type='h1', panel='leftPanel', content={'html': '<h1>Start writing</h1>'}, order=0)
    return page


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        username = (request.data.get('username') or email).strip()
        password = request.data.get('password') or ''
        role = request.data.get('role') or 'student'
        if role not in {'teacher', 'student'}:
            return Response({'detail': 'Choose teacher or student.'}, status=status.HTTP_400_BAD_REQUEST)
        if not email or not username:
            return Response({'detail': 'Email and username are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(Q(username__iexact=username) | Q(email__iexact=email)).exists():
            return Response({'detail': 'An account with that email or username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(password)
        except ValidationError as exc:
            return Response({'detail': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, email=email, password=password)
        Profile.objects.create(user=user, is_teacher=role == 'teacher')
        refresh = RefreshToken.for_user(user)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh), 'user': user_data(user)}, status=status.HTTP_201_CREATED)


class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(user_data(request.user))


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Course.objects.select_related('author').prefetch_related('lessons')
        if self.request.query_params.get('mine') and user.is_authenticated:
            return queryset.filter(author=user)
        if self.request.query_params.get('enrolled') and user.is_authenticated:
            return queryset.filter(enrollments__student=user)
        if user.is_authenticated:
            return queryset.filter(Q(is_published=True, visibility='public') | Q(author=user) | Q(enrollments__student=user)).distinct()
        return queryset.filter(is_published=True, visibility='public')

    def perform_create(self, serializer):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        if not profile.is_teacher:
            raise PermissionDenied('Only teacher accounts can create courses.')
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.author_id != self.request.user.id:
            raise PermissionDenied('You can only edit your own course.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author_id != self.request.user.id:
            raise PermissionDenied('You can only delete your own course.')
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        if not course.is_published and course.author_id != request.user.id:
            return Response({'detail': 'Course is not published.'}, status=status.HTTP_403_FORBIDDEN)
        Enrollment.objects.get_or_create(student=request.user, course=course)
        return Response({'enrolled': True})


class LessonViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Lesson.objects.select_related('author', 'course').prefetch_related('pages__blocks')
        if self.request.query_params.get('mine') and user.is_authenticated:
            queryset = queryset.filter(author=user)
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if self.request.query_params.get('standalone'):
            queryset = queryset.filter(course__isnull=True)
        if user.is_authenticated:
            return queryset.filter(Q(author=user) | Q(course__author=user) | Q(course__enrollments__student=user) | Q(lesson_enrollments__student=user) | Q(course__is_published=True, is_free_preview=True) | Q(course__isnull=True, is_published=True, visibility__in=['public', 'unlisted'])).distinct()
        return queryset.filter(Q(course__is_published=True, is_free_preview=True) | Q(course__isnull=True, is_published=True, visibility__in=['public', 'unlisted'])).distinct()

    def get_serializer_class(self):
        return LessonDetailSerializer if self.action == 'retrieve' else LessonListSerializer

    def perform_create(self, serializer):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        if not profile.is_teacher:
            raise PermissionDenied('Only teacher accounts can create lessons.')
        course = serializer.validated_data.get('course')
        if course and course.author_id != self.request.user.id:
            raise PermissionDenied('You can only add lessons to your own course.')
        lesson = serializer.save(author=self.request.user)
        create_first_page(lesson)

    def perform_update(self, serializer):
        if not is_lesson_owner(self.request.user, serializer.instance):
            raise PermissionDenied('You can only edit your own lesson.')
        serializer.save()

    def perform_destroy(self, instance):
        if not is_lesson_owner(self.request.user, instance):
            raise PermissionDenied('You can only delete your own lesson.')
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def purchase(self, request, pk=None):
        lesson = self.get_object()
        if lesson.course_id:
            return Response({'detail': 'Enroll in the course instead.'}, status=status.HTTP_400_BAD_REQUEST)
        if not lesson.is_published and lesson.author_id != request.user.id:
            return Response({'detail': 'Lesson is not published.'}, status=status.HTTP_403_FORBIDDEN)
        LessonEnrollment.objects.get_or_create(student=request.user, lesson=lesson)
        return Response({'enrolled': True})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_complete(self, request, pk=None):
        lesson = self.get_object()
        if not can_view_lesson(request.user, lesson):
            raise PermissionDenied('You do not have access to this lesson.')
        progress, _ = LessonProgress.objects.get_or_create(student=request.user, lesson=lesson)
        progress.is_completed = bool(request.data.get('is_completed', not progress.is_completed))
        progress.save(update_fields=['is_completed', 'updated_at'])
        return Response({'is_completed': progress.is_completed})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def duplicate(self, request, pk=None):
        source = self.get_object()
        if not is_lesson_owner(request.user, source):
            raise PermissionDenied('You can only duplicate your own lesson.')
        with transaction.atomic():
            duplicate = Lesson.objects.create(
                course=source.course, author=request.user,
                title=request.data.get('title') or f'{source.title} (copy)', description=source.description,
                module_name=request.data.get('module_name') or source.module_name, order=source.order + 1,
                visibility='private', is_published=False,
            )
            for page in source.pages.all():
                new_page = Page.objects.create(lesson=duplicate, title=page.title, group=page.group, layout=page.layout, order=page.order)
                for block in page.blocks.all():
                    Block.objects.create(page=new_page, type=block.type, panel=block.panel, content=deepcopy(block.content), order=block.order)
        return Response(LessonDetailSerializer(duplicate, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def attach_to_course(self, request, pk=None):
        lesson = self.get_object()
        course = Course.objects.filter(pk=request.data.get('course_id'), author=request.user).first()
        if not is_lesson_owner(request.user, lesson) or not course:
            raise PermissionDenied('You can only attach your lesson to your own course.')
        lesson.course = course
        lesson.module_name = request.data.get('module_name') or lesson.module_name
        lesson.order = request.data.get('order', lesson.order)
        lesson.save(update_fields=['course', 'module_name', 'order', 'updated_at'])
        return Response(LessonDetailSerializer(lesson, context={'request': request}).data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reorder(self, request):
        ids = request.data.get('ordered_ids') or []
        lessons = {str(lesson.id): lesson for lesson in Lesson.objects.filter(id__in=ids, author=request.user)}
        for order, lesson_id in enumerate(ids):
            if str(lesson_id) in lessons:
                Lesson.objects.filter(pk=lesson_id).update(order=order)
        return Response({'ok': True})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def autosave(self, request, pk=None):
        lesson = self.get_object()
        if not is_lesson_owner(request.user, lesson):
            raise PermissionDenied('You can only save your own lesson.')
        data = request.data
        with transaction.atomic():
            lesson_patch = data.get('lesson') or {}
            for field in ['title', 'description', 'module_name', 'is_free_preview', 'is_published', 'visibility', 'price']:
                if field in lesson_patch:
                    setattr(lesson, field, lesson_patch[field])
            lesson.content_revision += 1
            lesson.save()
            id_map = {'pages': {}, 'blocks': {}}
            received_page_ids = set()
            for page_index, page_data in enumerate(data.get('pages') or []):
                raw_id = str(page_data.get('serverId') or page_data.get('id') or '')
                page = Page.objects.filter(pk=raw_id, lesson=lesson).first() if is_uuid(raw_id) else None
                if page is None:
                    page = Page.objects.create(lesson=lesson)
                    if page_data.get('id'):
                        id_map['pages'][str(page_data['id'])] = str(page.id)
                received_page_ids.add(str(page.id))
                page.title = page_data.get('title') or 'Untitled page'
                page.group = page_data.get('group') or 'Module 1'
                page.layout = page_data.get('layout') or 'split'
                page.order = page_index
                page.save()
                for panel_name in ['leftPanel', 'rightPanel']:
                    for block_index, block_data in enumerate(page_data.get(panel_name) or []):
                        block_type = block_data.get('type')
                        if block_type not in ALLOWED_BLOCK_TYPES:
                            return Response({'detail': f'Unsupported block type: {block_type}'}, status=status.HTTP_400_BAD_REQUEST)
                        raw_block_id = str(block_data.get('serverId') or block_data.get('id') or '')
                        block = Block.objects.filter(pk=raw_block_id, page__lesson=lesson).first() if is_uuid(raw_block_id) else None
                        if block is None:
                            block = Block.objects.create(page=page, type=block_type)
                            if block_data.get('id'):
                                id_map['blocks'][str(block_data['id'])] = str(block.id)
                        block.page = page
                        block.type = block_type
                        block.panel = panel_name
                        block.content = block_data.get('content') or {}
                        block.order = block_index
                        block.save()
            for page_id in data.get('deleted_page_ids') or []:
                if is_uuid(page_id):
                    Page.objects.filter(pk=page_id, lesson=lesson).delete()
            for block_id in data.get('deleted_block_ids') or []:
                if is_uuid(block_id):
                    Block.objects.filter(pk=block_id, page__lesson=lesson).delete()
        return Response({'lesson': LessonDetailSerializer(lesson, context={'request': request}).data, 'id_map': id_map})


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def teacher_stats(self, request):
        return Response({'total_students': Enrollment.objects.filter(course__author=request.user).values('student').distinct().count(), 'total_courses': Course.objects.filter(author=request.user).count(), 'average_rating': 0})

    @action(detail=False, methods=['get'])
    def student_progress(self, request):
        courses = Course.objects.filter(enrollments__student=request.user).prefetch_related('lessons')
        results = []
        for course in courses:
            lessons = list(course.lessons.filter(is_published=True))
            complete = LessonProgress.objects.filter(student=request.user, lesson__in=lessons, is_completed=True).count()
            next_lesson = next((lesson for lesson in lessons if not LessonProgress.objects.filter(student=request.user, lesson=lesson, is_completed=True).exists()), lessons[0] if lessons else None)
            results.append({'type': 'course', 'course_id': str(course.id), 'title': course.title, 'thumbnail': course.thumbnail.url if course.thumbnail else None, 'total_lessons': len(lessons), 'completed_lessons': complete, 'progress_percent': round(complete * 100 / len(lessons)) if lessons else 0, 'next_lesson_id': str(next_lesson.id) if next_lesson else None})
        return Response(results)
