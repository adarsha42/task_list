from django.db import models

# Create your models here.


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = (
            "pending",
            "Pending",
        )
        COMPLETED = "completed", "Completed"

    header = models.CharField(max_length=200)
    description = models.TextField()
    asignee_email = models.EmailField()
    deadline = models.DateTimeField()

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )

    notification_sent = models.BooleanField(default=False)

    def __str__(self):
        return self.header
