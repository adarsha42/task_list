from django.conf import settings
from django.db import models

# Create your models here.


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    header = models.CharField(max_length=200)
    description = models.TextField()
    assignee_email = models.EmailField()
    deadline = models.DateTimeField()

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )

    notification_sent = models.BooleanField(default=False)

    def __str__(self):
        return self.header


class SchedulerConfig(models.Model):
    notify_hours_before = models.PositiveIntegerField(
        default=24,
        help_text="Send deadline notification this many hours before the deadline.",
    )

    class Meta:
        verbose_name = "Scheduler Configuration"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"Notify {self.notify_hours_before}h before deadline"
