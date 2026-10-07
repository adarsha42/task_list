from datetime import datetime

from ninja import Schema


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
