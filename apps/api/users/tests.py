from django.contrib.auth import get_user_model
from django.test import TestCase


class SessionAPITests(TestCase):
    def test_current_user_returns_401_when_signed_out(self):
        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"detail": "Not authenticated"})

    def test_login_session_and_logout(self):
        get_user_model().objects.create_user(username="frontend-user")
        response = self.client.post(
            "/api/auth/login",
            data={"identifier": "frontend-user"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").json(), response.json())
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
