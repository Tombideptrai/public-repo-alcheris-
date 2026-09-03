import uuid

from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_teacher = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.user.username} ({"teacher" if self.is_teacher else "student"})'


class Course(models.Model):
    VISIBILITY_CHOICES = [('public', 'Listed'), ('unlisted', 'Link only')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    author = models.ForeignKey(User, related_name='courses', on_delete=models.CASCADE)
    thumbnail = models.FileField(upload_to='thumbnails/', blank=True, null=True)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    is_published = models.BooleanField(default=False)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    linear_progression = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class Lesson(models.Model):
    VISIBILITY_CHOICES = [('private', 'Private'), ('public', 'Public'), ('unlisted', 'Unlisted')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, related_name='lessons', on_delete=models.CASCADE, null=True, blank=True)
    author = models.ForeignKey(User, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=200, blank=True)
    module_name = models.CharField(max_length=255, default='Module 1')
    order = models.PositiveIntegerField(default=0)
    thumbnail = models.FileField(upload_to='thumbnails/', blank=True, null=True)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    is_published = models.BooleanField(default=False)
    is_free_preview = models.BooleanField(default=False)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='private')
    content_revision = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']


class Page(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson = models.ForeignKey(Lesson, related_name='pages', on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default='New Page')
    group = models.CharField(max_length=255, default='Module 1', blank=True)
    layout = models.CharField(max_length=20, default='split')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']


class Block(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(Page, related_name='blocks', on_delete=models.CASCADE)
    type = models.CharField(max_length=50)
    panel = models.CharField(max_length=20, default='leftPanel')
    content = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']


class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, related_name='enrollments', on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name='enrollments', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['student', 'course'], name='one_course_enrollment')]


class LessonEnrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, related_name='lesson_enrollments', on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, related_name='lesson_enrollments', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['student', 'lesson'], name='one_lesson_enrollment')]


class LessonProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['student', 'lesson'], name='one_lesson_progress')]
