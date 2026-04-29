import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv(override=True)


def _is_truthy(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class AppSettings:
    def __init__(self) -> None:
        self.google_cloud_project = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
        self.google_cloud_location = os.getenv("GOOGLE_CLOUD_LOCATION", "asia-south1").strip()

        self.admin_api_token = os.getenv("ADMIN_API_TOKEN", "").strip()
        self.allow_insecure_admin = _is_truthy(os.getenv("ALLOW_INSECURE_ADMIN"), default=False)

        self.firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
        self.firebase_service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()

        self.gemini_api_key_secret = os.getenv("GEMINI_API_KEY_SECRET", "").strip()
        self.use_secret_manager = _is_truthy(os.getenv("USE_SECRET_MANAGER"), default=True)

        self.cloud_tasks_queue_id = os.getenv("CLOUD_TASKS_QUEUE_ID", "").strip()
        self.cloud_tasks_location = os.getenv("CLOUD_TASKS_LOCATION", self.google_cloud_location).strip()
        self.cloud_tasks_target_url = os.getenv("CLOUD_TASKS_TARGET_URL", "").strip()
        self.cloud_tasks_service_account = os.getenv("CLOUD_TASKS_SERVICE_ACCOUNT", "").strip()
        self.cloud_tasks_verification_token = os.getenv("CLOUD_TASKS_VERIFICATION_TOKEN", "").strip()

        self.api_cache_ttl_seconds = max(10, int(os.getenv("API_CACHE_TTL_SECONDS", "90")))
        self.api_cache_max_entries = max(100, int(os.getenv("API_CACHE_MAX_ENTRIES", "2000")))

    @property
    def admin_auth_configured(self) -> bool:
        return bool(self.admin_api_token or self.allow_insecure_admin or self.firebase_project_id or self.google_cloud_project)

    @property
    def cloud_tasks_enabled(self) -> bool:
        return bool(self.google_cloud_project and self.cloud_tasks_queue_id and self.cloud_tasks_target_url)

    @property
    def secret_manager_enabled(self) -> bool:
        return bool(self.use_secret_manager and self.google_cloud_project and self.gemini_api_key_secret)


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    return AppSettings()
