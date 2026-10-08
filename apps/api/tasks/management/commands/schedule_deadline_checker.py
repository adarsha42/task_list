from datetime import datetime, timezone

import django_rq
from django.core.management.base import BaseCommand
from rq_scheduler import Scheduler


class Command(BaseCommand):
    help = "Schedule the approaching-deadline checker"

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=int,
            default=3600,
        )

    def handle(self, *args, **options):
        interval = options["interval"]

        connection = django_rq.get_connection("default")

        scheduler = Scheduler(
            queue_name="default",
            connection=connection,
        )

        # Cancel any previously registered jobs to avoid duplicates on restart
        for job in scheduler.get_jobs():
            scheduler.cancel(job)
            self.stdout.write(f"Cancelled existing job: {job.id}")

        scheduler.schedule(
            scheduled_time=datetime.now(timezone.utc),
            func="tasks.jobs.check_approaching_deadlines",
            interval=interval,
            repeat=None,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Deadline checker scheduled every {interval}s. "
                f"Notification window is configured via the API."
            )
        )
