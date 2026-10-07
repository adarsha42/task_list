from django.core.mail import send_mail

from .models import Task


def send_task_completed_email(task_id: int):
    task = Task.objects.get(id=task_id)

    send_mail(
        subject="Task Completed",
        message=f'Task "{task.header}" has been completed.',
        from_email=None,
        recipient_list=[task.assignee_email],
        fail_silently=False,
    )
