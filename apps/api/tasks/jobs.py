from datetime import timedelta
from zoneinfo import ZoneInfo

import django_rq
from django.core.mail import send_mail
from django.utils import timezone

from .models import SchedulerConfig, Task


def send_task_completed_email(task_id: int):
    task = Task.objects.get(id=task_id)

    send_mail(
        subject="Task Completed",
        message=(
            f'Task "{task.header}" has been completed.\n\n'
            f'Description:\n{task.description}'
        ),
        from_email=None,
        recipient_list=[task.assignee_email],
        fail_silently=False,
    )


def send_deadline_approaching_email(task_id: int):
    task = Task.objects.get(id=task_id)
    local_deadline = timezone.localtime(task.deadline, ZoneInfo(task.deadline_timezone))
    offset = local_deadline.strftime("%z")
    formatted_deadline = (
        f'{local_deadline:%d %b %Y at %I:%M %p} '
        f'({task.deadline_timezone}, UTC{offset[:3]}:{offset[3:]})'
    )

    send_mail(
        subject="Task Deadline Approaching",
        message=(
            f'Task "{task.header}" is approaching its deadline on {formatted_deadline}.\n\n'
            f'Description:\n{task.description}'
        ),
        from_email=None,
        recipient_list=[task.assignee_email],
        fail_silently=False,
    )


def check_approaching_deadlines():
    config = SchedulerConfig.load()
    hours_before = config.notify_hours_before

    now = timezone.now()
    cutoff = now + timedelta(hours=hours_before)

    tasks = Task.objects.filter(
        deadline__lte=cutoff,
        deadline__gt=now,
        notification_sent=False,
    ).exclude(status=Task.Status.COMPLETED)

    queue = django_rq.get_queue("default")

    for task in tasks:
        queue.enqueue(
            send_deadline_approaching_email,
            task.id,
        )

        task.notification_sent = True
        task.save(update_fields=["notification_sent"])
