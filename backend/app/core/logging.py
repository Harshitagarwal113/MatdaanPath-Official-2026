import atexit
import logging
import os
import threading


_error_client = None
_cloud_logging_client = None


def _init_cloud_logging(project_id):  # pragma: no cover
    """Attempt Cloud Logging init in a separate thread."""
    global _cloud_logging_client, _error_client
    try:
        from google.cloud import logging as cloud_logging
        from google.cloud import error_reporting

        client = cloud_logging.Client(project=project_id)
        client.setup_logging(log_level=logging.INFO)
        _cloud_logging_client = client
        atexit.register(client.close)

        error_client = error_reporting.Client(
            project=project_id
        )
        _error_client = error_client

        logging.info(
            "Cloud Logging initialized for project %s",
            project_id,
        )
    except Exception as e:
        msg = str(e)
        if "permission" in msg.lower() or "403" in msg:
            logging.warning(
                "Cloud Logging permission denied for"
                " project %s. Using local logging.",
                project_id,
            )
        else:
            logging.warning(
                "Cloud Logging init failed (%s)."
                " Using standard local logging.",
                e,
            )


def setup_logging():
    """Initializes logging. Cloud Logging uses a timeout."""
    global _cloud_logging_client, _error_client

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    is_testing = (
        os.getenv("TESTING", "false").lower() == "true"
    )
    disable_cloud_logging = (
        os.getenv(
            "DISABLE_CLOUD_LOGGING", "false"
        ).lower()
        == "true"
    )

    # Always set up basic logging first so the app works
    logging.basicConfig(level=logging.INFO, force=True)

    if project_id and not is_testing and not disable_cloud_logging:
        try:
            _init_cloud_logging(project_id)
        except Exception as exc:
            logging.warning("Cloud Logging init failed: %s", exc)
    else:
        if is_testing:
            logging.info(
                "Testing mode active."
                " Using standard local logging."
            )
        elif disable_cloud_logging:  # pragma: no cover
            logging.info(  # pragma: no cover
                "Cloud Logging disabled by"
                " environment variable."
            )
        else:  # pragma: no cover
            logging.warning(  # pragma: no cover
                "GOOGLE_CLOUD_PROJECT not set."
                " Using standard local logging."
            )

    return _error_client


def report_exception() -> None:
    if _error_client is not None:
        try:  # pragma: no cover
            _error_client.report_exception()  # pragma: no cover
        except Exception as exc:  # pragma: no cover
            logging.warning(  # pragma: no cover
                "Failed to report exception to"
                " Google Cloud Error Reporting: %s",
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
