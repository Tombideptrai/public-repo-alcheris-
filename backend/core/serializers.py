from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Block, Course, Enrollment, Lesson, LessonEnrollment, LessonProgress, Page, Profile


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field, '')
        if '@' in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                attrs[self.username_field] = user.username
        return super().validate(attrs)


class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ['id', 'type', 'panel', 'content', 'order']


class PageSerializer(serializers.ModelSerializer):
    blocks = BlockSerializer(many=True, read_only=True)

    class Meta:
        model = Page
        fields = ['id', 'title', 'group', 'layout', 'order', 'blocks']


class LessonListSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    content_types = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    can_view_content = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'course', 'title', 'description', 'module_name', 'order', 'thumbnail', 'price', 'is_published', 'is_free_preview', 'visibility', 'content_types', 'is_completed', 'can_view_content']

    def get_thumbnail(self, obj):
        request = self.context.get('request')
        if not obj.thumbnail:
            return None
        return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url

    def get_content_types(self, obj):
        return list(Block.objects.filter(page__lesson=obj).values_list('type', flat=True).distinct())

    def get_is_completed(self, obj):
        user = self.context['request'].user
        return bool(user.is_authenticated and LessonProgress.objects.filter(student=user, lesson=obj, is_completed=True).exists())

    def get_can_view_content(self, obj):
        user = self.context['request'].user
        return can_view_lesson(user, obj)


class LessonDetailSerializer(LessonListSerializer):
    pages = PageSerializer(many=True, read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta(LessonListSerializer.Meta):
        fields = LessonListSerializer.Meta.fields + ['pages', 'author_name', 'content_revision']


class CourseSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    thumbnail = serializers.SerializerMethodField()
    lessons = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'author_name', 'thumbnail', 'price', 'is_published', 'visibility', 'linear_progression', 'lessons', 'is_enrolled', 'created_at', 'updated_at']
        read_only_fields = ['author_name', 'lessons', 'is_enrolled', 'created_at', 'updated_at']

    def get_thumbnail(self, obj):
        request = self.context.get('request')
        if not obj.thumbnail:
            return None
        return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url

    def get_lessons(self, obj):
        request = self.context.get('request')
        lessons = obj.lessons.all()
        if request and request.user.is_authenticated and request.user == obj.author:
            return LessonListSerializer(lessons, many=True, context=self.context).data
        return LessonListSerializer(lessons.filter(is_published=True), many=True, context=self.context).data

    def get_is_enrolled(self, obj):
        user = self.context['request'].user
        return bool(user.is_authenticated and (user == obj.author or Enrollment.objects.filter(student=user, course=obj).exists()))


def can_view_lesson(user, lesson):
    if user.is_authenticated and (lesson.author_id == user.id or (lesson.course and lesson.course.author_id == user.id)):
        return True
    if lesson.course:
        return bool(user.is_authenticated and Enrollment.objects.filter(student=user, course=lesson.course).exists()) or (lesson.course.is_published and lesson.is_free_preview)
    return lesson.is_published and (lesson.visibility in {'public', 'unlisted'} or (user.is_authenticated and LessonEnrollment.objects.filter(student=user, lesson=lesson).exists()))
