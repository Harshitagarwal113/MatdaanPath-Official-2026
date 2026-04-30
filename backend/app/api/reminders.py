from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import RequestIdentity, get_optional_request_identity
from app.core.logging import get_logger
from app.core.settings import get_settings
from app.services.google_tasks import enqueue_json_task

router = APIRouter()
logger = get_logger("reminders")


class ReminderSubscriptionRequest(BaseModel):
    email: str = Field(
        ...,
        min_length=5,
        max_length=320,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    deadline_name: str = Field(..., min_length=3, max_length=150)
    deadline_date: datetime
    region_code: str | None = Field(default=None, max_length=10)


class ReminderSubscriptionResponse(BaseModel):
    queued: bool
    provider: str
    task_name: str
    scheduled_for: str


class ReminderDeliveryPayload(BaseModel):
    email: str
    deadline_name: str
    deadline_date: datetime
    region_code: str | None = None


@router.post("/subscribe", response_model=ReminderSubscriptionResponse)
def subscribe_deadline_reminder(
    payload: ReminderSubscriptionRequest,
    identity: RequestIdentity = Depends(get_optional_request_identity),
):
    task_payload = {
        "email": payload.email,
        "deadline_name": payload.deadline_name,
        "deadline_date": payload.deadline_date.isoformat(),
        "region_code": payload.region_code,
        "requested_by": identity.user_id,
        "requested_at": datetime.now(timezone.utc).isoformat(),
    }
    provider, task_name = enqueue_json_task(task_payload)
    return ReminderSubscriptionResponse(
        queued=True,
        provider=provider,
        task_name=task_name,
        scheduled_for=payload.deadline_date.isoformat(),
    )


@router.post("/deliver")
def deliver_deadline_reminder(
    payload: ReminderDeliveryPayload,
    x_tasks_token: str | None = Header(default=None),
):
    settings = get_settings()
    if (
        settings.cloud_tasks_verification_token
        and x_tasks_token != settings.cloud_tasks_verification_token
    ):
        raise HTTPException(
            status_code=401, detail="Invalid task delivery token."
        )  # noqa: E501

    # Placeholder delivery worker until Email/SMS provider wiring is added.
    logger.info(
        "Reminder delivery request received for %s (%s on %s).",
        payload.email,
        payload.deadline_name,
        payload.deadline_date.isoformat(),
    )
    return {
        "delivered": False,
        "delivery_provider": "pending_configuration",
        "message": "Reminder payload accepted. Configure email/SMS provider for actual delivery.",  # noqa: E501
    }
