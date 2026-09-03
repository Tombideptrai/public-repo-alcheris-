from django.contrib import admin

from .models import Block, Course, Enrollment, Lesson, LessonEnrollment, LessonProgress, Page, Profile

admin.site.register([Profile, Course, Lesson, Page, Block, Enrollment, LessonEnrollment, LessonProgress])
