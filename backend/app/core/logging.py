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
    disable_cloud_logging = (
        os.getenv("DISABLE_CLOUD_LOGGING", "false").lower() == "true"
    )

    if project_id and not is_testing and not disable_cloud_logging:
        try:  # pragma: no cover
            # Initialize Google Cloud Logging client  # pragma: no cover
            client = cloud_logging.Client(
                project=project_id
            )  # pragma: no cover  # noqa: E501
            # pragma: no cover
            # Setup standard Python logging integration  # pragma: no cover
            client.setup_logging(log_level=logging.INFO)  # pragma: no cover
            _cloud_logging_client = client  # pragma: no cover
            atexit.register(client.close)  # pragma: no cover
            # pragma: no cover
            # Initialize Error Reporting  # pragma: no cover
            error_client = error_reporting.Client(
                project=project_id
            )  # pragma: no cover
            _error_client = error_client  # pragma: no cover
            # pragma: no cover
            logging.info(  # pragma: no cover
                "Cloud Logging initialized for project %s",
                project_id,  # pragma: no cover
            )  # pragma: no cover
            return error_client  # pragma: no cover
        except Exception as e:  # pragma: no cover
            # Fallback to local logging  # pragma: no cover
            logging.basicConfig(  # pragma: no cover
                level=logging.INFO,  # pragma: no cover
                format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",  # pragma: no cover  # noqa: E501
                force=True,  # pragma: no cover
            )  # pragma: no cover
            msg = str(e)  # pragma: no cover
            if "permission" in msg.lower() or "403" in msg:  # pragma: no cover
                logging.warning(  # pragma: no cover
                    "Cloud Logging permission denied for project %s. Using local logging.",  # noqa: E501  # pragma: no cover
                    project_id,  # pragma: no cover
                )  # pragma: no cover
            else:  # pragma: no cover
                logging.warning(  # pragma: no cover
                    "Cloud Logging init failed (%s). Using standard local logging.",  # noqa: E501  # pragma: no cover
                    e,  # pragma: no cover
                )  # pragma: no cover
            return None  # pragma: no cover
    else:
        # Fallback to standard local logging
        logging.basicConfig(level=logging.INFO, force=True)
        if is_testing:
            logging.info("Testing mode active. Using standard local logging.")
        elif disable_cloud_logging:  # pragma: no cover
            logging.info(
                "Cloud Logging disabled by environment variable."
            )  # pragma: no cover
        else:  # pragma: no cover
            logging.warning(  # pragma: no cover
                "GOOGLE_CLOUD_PROJECT not set. Using standard local logging."
            )
        return None


def report_exception() -> None:
    if _error_client is not None:
        try:  # pragma: no cover
            _error_client.report_exception()  # pragma: no cover
        except Exception as exc:  # pragma: no cover
            logging.warning(  # pragma: no cover
                "Failed to report exception to Google Cloud Error Reporting: %s",  # noqa: E501
                exc,
            )


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
