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
            
            logging.info(f"Cloud Logging successfully initialized for project: {project_id}")
            return error_client
        except Exception as e:
            # Ensure we reset to basic logging if anything above fails
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            logging.warning(f"Cloud Logging init failed ({e}). Using standard local logging.")
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
