from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from ninja import Field, Schema
from pydantic import field_validator


class TaskCreate(Schema):
    header: str
    description: str
    assignee_email: str
    deadline: datetime
    deadline_timezone: str = Field(default="UTC", max_length=64)

    @field_validator("deadline_timezone")
    @classmethod
    def validate_deadline_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError("Use a valid IANA time zone, such as Asia/Kathmandu.") from None
        return value


class TaskUpdate(TaskCreate):
    pass


class TaskOut(Schema):
    id: int
    header: str
    description: str
    assignee_email: str
    deadline: datetime
    deadline_timezone: str
    status: str
    notification_sent: bool


class SchedulerConfigOut(Schema):
    notify_hours_before: int


class SchedulerConfigUpdate(Schema):
    notify_hours_before: int = Field(ge=0)
