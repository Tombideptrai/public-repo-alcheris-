import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name='Profile', fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ('is_teacher', models.BooleanField(default=False)),
            ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.CreateModel(name='Course', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ('title', models.CharField(max_length=255)), ('description', models.TextField(blank=True)),
            ('thumbnail', models.FileField(blank=True, null=True, upload_to='thumbnails/')),
            ('price', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
            ('is_published', models.BooleanField(default=False)),
            ('visibility', models.CharField(choices=[('public', 'Listed'), ('unlisted', 'Link only')], default='public', max_length=20)),
            ('linear_progression', models.BooleanField(default=False)),
            ('created_at', models.DateTimeField(auto_now_add=True)), ('updated_at', models.DateTimeField(auto_now=True)),
            ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='courses', to=settings.AUTH_USER_MODEL)),
        ], options={'ordering': ['-updated_at']}),
        migrations.CreateModel(name='Lesson', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ('title', models.CharField(max_length=255)), ('description', models.CharField(blank=True, max_length=200)),
            ('module_name', models.CharField(default='Module 1', max_length=255)), ('order', models.PositiveIntegerField(default=0)),
            ('thumbnail', models.FileField(blank=True, null=True, upload_to='thumbnails/')),
            ('price', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
            ('is_published', models.BooleanField(default=False)), ('is_free_preview', models.BooleanField(default=False)),
            ('visibility', models.CharField(choices=[('private', 'Private'), ('public', 'Public'), ('unlisted', 'Unlisted')], default='private', max_length=20)),
            ('content_revision', models.PositiveIntegerField(default=1)), ('created_at', models.DateTimeField(auto_now_add=True)), ('updated_at', models.DateTimeField(auto_now=True)),
            ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lessons', to=settings.AUTH_USER_MODEL)),
            ('course', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='lessons', to='core.course')),
        ], options={'ordering': ['order', 'created_at']}),
        migrations.CreateModel(name='Page', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ('title', models.CharField(default='New Page', max_length=255)), ('group', models.CharField(blank=True, default='Module 1', max_length=255)),
            ('layout', models.CharField(default='split', max_length=20)), ('order', models.PositiveIntegerField(default=0)),
            ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pages', to='core.lesson')),
        ], options={'ordering': ['order']}),
        migrations.CreateModel(name='Block', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ('type', models.CharField(max_length=50)), ('panel', models.CharField(default='leftPanel', max_length=20)),
            ('content', models.JSONField(blank=True, default=dict)), ('order', models.PositiveIntegerField(default=0)),
            ('page', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='blocks', to='core.page')),
        ], options={'ordering': ['order']}),
        migrations.CreateModel(name='Enrollment', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)), ('created_at', models.DateTimeField(auto_now_add=True)),
            ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to='core.course')),
            ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.CreateModel(name='LessonEnrollment', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)), ('created_at', models.DateTimeField(auto_now_add=True)),
            ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson_enrollments', to='core.lesson')),
            ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lesson_enrollments', to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.CreateModel(name='LessonProgress', fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')), ('is_completed', models.BooleanField(default=False)), ('updated_at', models.DateTimeField(auto_now=True)),
            ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.lesson')), ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.AddConstraint(model_name='enrollment', constraint=models.UniqueConstraint(fields=('student', 'course'), name='one_course_enrollment')),
        migrations.AddConstraint(model_name='lessonenrollment', constraint=models.UniqueConstraint(fields=('student', 'lesson'), name='one_lesson_enrollment')),
        migrations.AddConstraint(model_name='lessonprogress', constraint=models.UniqueConstraint(fields=('student', 'lesson'), name='one_lesson_progress')),
    ]
