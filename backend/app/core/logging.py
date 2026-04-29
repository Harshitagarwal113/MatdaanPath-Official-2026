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
    disable_cloud_logging = os.getenv("DISABLE_CLOUD_LOGGING", "false").lower() == "true"
    
    if project_id and not is_testing and not disable_cloud_logging:
        try:
            # Initialize Google Cloud Logging client
            client = cloud_logging.Client(project=project_id)
            
            # Setup standard Python logging integration
            client.setup_logging(log_level=logging.INFO)
            _cloud_logging_client = client
            atexit.register(client.close)
            
            # Initialize Error Reporting
            error_client = error_reporting.Client(project=project_id)
            _error_client = error_client
            
            logging.info("Cloud Logging initialized for project %s", project_id)
            return error_client
        except Exception as e:
            # Fallback to local logging
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                force=True
            )
            msg = str(e)
            if "permission" in msg.lower() or "403" in msg:
                logging.warning("Cloud Logging permission denied for project %s. Using local logging.", project_id)
            else:
                logging.warning("Cloud Logging init failed (%s). Using standard local logging.", e)
            return None
    else:
        # Fallback to standard local logging
        logging.basicConfig(level=logging.INFO, force=True)
        if is_testing:
            logging.info("Testing mode active. Using standard local logging.")
        elif disable_cloud_logging:
            logging.info("Cloud Logging disabled by environment variable.")
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
