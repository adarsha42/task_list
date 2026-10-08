from datetime import datetime

from ninja import Field, Schema


class TaskCreate(Schema):
    header: str
    description: str
    assignee_email: str
    deadline: datetime


class TaskUpdate(Schema):
    header: str
    description: str
    assignee_email: str
    deadline: datetime


class TaskOut(Schema):
    id: int
    header: str
    description: str
    assignee_email: str
    deadline: datetime
    status: str
    notification_sent: bool


class SchedulerConfigOut(Schema):
    notify_hours_before: int


class SchedulerConfigUpdate(Schema):
    notify_hours_before: int = Field(ge=0)
