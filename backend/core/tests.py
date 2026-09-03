from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Profile


class PublicCourseworkFlowTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user('teacher', email='teacher@example.com', password='StrongPass123!')
        Profile.objects.create(user=self.teacher, is_teacher=True)
        self.client.force_authenticate(self.teacher)

    def test_teacher_can_create_and_save_basic_lesson(self):
        lesson = self.client.post('/api/lessons/', {'title': 'Basics', 'module_name': 'Module 1'}, format='json')
        self.assertEqual(lesson.status_code, 201)
        lesson_id = lesson.data['id']
        saved = self.client.post(f'/api/lessons/{lesson_id}/autosave/', {
            'lesson': {'title': 'Basics', 'description': 'A basic lesson'},
            'pages': [{
                'id': 'page-client-1', 'title': 'Introduction', 'group': 'Module 1', 'layout': 'split',
                'leftPanel': [{'id': 'block-client-1', 'type': 'text', 'content': {'html': '<p>Hello</p>'}}],
                'rightPanel': [{'id': 'block-client-2', 'type': 'quiz', 'content': {'questions': []}}],
            }],
        }, format='json')
        self.assertEqual(saved.status_code, 200)
        detail = self.client.get(f'/api/lessons/{lesson_id}/')
        self.assertEqual(detail.status_code, 200)
        saved_types = [block['type'] for page in detail.data['pages'] for block in page['blocks']]
        self.assertIn('text', saved_types)
        self.assertIn('quiz', saved_types)
