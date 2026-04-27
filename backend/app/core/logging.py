import atexit
import logging
import os

from google.cloud import logging as cloud_logging
from google.cloud import error_reporting

_error_client = None
_cloud_logging_client = None


def setup_logging():
    """Initializes Google Cloud Logging and integrates with Python logging."""
    global _cloud_logging_client, _error_client

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    is_testing = os.getenv("TESTING", "false").lower() == "true"
    
    if project_id and not is_testing:
        try:
            # Initialize Google Cloud Logging client with a short timeout/check
            client = cloud_logging.Client(project=project_id)
            
            # Setup standard Python logging
            # We use a try-except specifically for setup_logging as it can hang or fail on IAM issues
            client.setup_logging(log_level=logging.INFO)
            _cloud_logging_client = client
            atexit.register(client.close)
            
            # Initialize Error Reporting
            error_client = error_reporting.Client(project=project_id)
            _error_client = error_client
            
            logging.info("Cloud Logging initialized for project %s", project_id)
            return error_client
        except Exception as e:
            # Ensure we reset to basic logging if anything above fails
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            logging.warning("Cloud Logging init failed (%s). Using standard local logging.", e)
            return None
    else:
        # Fallback to standard local logging
        logging.basicConfig(level=logging.INFO)
        if is_testing:
            logging.info("Testing mode active. Using standard local logging.")
        else:
            logging.warning("GOOGLE_CLOUD_PROJECT not set. Using standard local logging.")
        return None


def report_exception() -> None:
    if _error_client is not None:
        try:
            _error_client.report_exception()
        except Exception as exc:
            logging.warning("Failed to report exception to Google Cloud Error Reporting: %s", exc)


def get_logger(name: str):
    return logging.getLogger(name)


def is_cloud_logging_enabled() -> bool:
    return _cloud_logging_client is not None


def is_error_reporting_enabled() -> bool:
    return _error_client is not None


def get_observability_status() -> dict[str, bool]:
    return {
        "cloud_logging_enabled": is_cloud_logging_enabled(),
        "error_reporting_enabled": is_error_reporting_enabled(),
    }
