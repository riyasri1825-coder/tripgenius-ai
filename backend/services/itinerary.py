import json
import logging
import os
import re
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import ValidationError

from backend.models.trip import TripItinerary, TripPreferences

logger = logging.getLogger(__name__)


class ItineraryGenerationError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _build_prompt(preferences: TripPreferences) -> str:
    trip_details = json.dumps(
        preferences.model_dump(mode="json"),
        ensure_ascii=False,
    )
    return (
        "Create a practical, personalized travel itinerary using the trip details "
        "below. Treat a numeric budget as the total trip budget in the user's "
        "provided currency; for a budget tier, keep recommendations within that "
        "tier. Prioritize the requested interests and adapt pacing and activities "
        "for the travel type. Do not claim real-time availability or prices. "
        "Return JSON only, with this exact structure: "
        '{"budget_note":"brief explanation of how recommendations fit the budget",'
        '"days":[{"day":1,"theme":"short theme",'
        '"morning":{"name":"activity","description":"details",'
        '"suggested_place":"place","cost_level":"free|low|moderate|high"},'
        '"afternoon":{"name":"activity","description":"details",'
        '"suggested_place":"place","cost_level":"free|low|moderate|high"},'
        '"evening":{"name":"activity","description":"details",'
        '"suggested_place":"place","cost_level":"free|low|moderate|high"}}]}. '
        f"Return exactly {preferences.days} day entries numbered consecutively "
        f"from 1. Trip details: {trip_details}"
    )


def _parse_provider_response(
    response_body: bytes, preferences: TripPreferences
) -> TripItinerary:
    try:
        provider_response: Any = json.loads(response_body.decode("utf-8"))
        content = provider_response["choices"][0]["message"]["content"]
        if not isinstance(content, str):
            raise TypeError("The provider content must be text.")
        itinerary = TripItinerary.model_validate_json(content)
    except (
        UnicodeDecodeError,
        json.JSONDecodeError,
        KeyError,
        IndexError,
        TypeError,
        ValidationError,
    ) as exc:
        logger.warning(
            "AI provider returned an invalid itinerary (error_type=%s)",
            type(exc).__name__,
        )
        raise ItineraryGenerationError(
            code="INVALID_AI_RESPONSE",
            message="The AI provider returned an invalid itinerary.",
            status_code=502,
        ) from exc

    day_numbers = [day.day for day in itinerary.days]
    expected_day_numbers = list(range(1, preferences.days + 1))
    if day_numbers != expected_day_numbers:
        logger.warning(
            "AI provider returned an incomplete itinerary "
            "(expected_days=%d, actual_days=%d)",
            preferences.days,
            len(day_numbers),
        )
        raise ItineraryGenerationError(
            code="INVALID_AI_RESPONSE",
            message="The AI provider returned an incomplete itinerary.",
            status_code=502,
        )
    return itinerary


def _sanitize_log_value(value: object, api_key: str) -> str:
    message = str(value or "")
    if api_key:
        message = message.replace(api_key, "[REDACTED]")
    message = re.sub(
        r"(?i)\b(?:sk|rk)-[A-Za-z0-9_-]{8,}\b",
        "[REDACTED]",
        message,
    )
    return " ".join(message.split())[:300]


def _provider_error_details(
    exc: HTTPError, api_key: str
) -> tuple[str, str, str]:
    try:
        payload: Any = json.loads(exc.read(8192).decode("utf-8"))
        error = payload.get("error", {})
        if not isinstance(error, dict):
            return "", "", "Provider returned an unstructured error."
        return (
            _sanitize_log_value(error.get("type"), api_key),
            _sanitize_log_value(error.get("code"), api_key),
            _sanitize_log_value(error.get("message"), api_key)
            or "Provider returned no error message.",
        )
    except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
        return "", "", "Provider returned a non-JSON error response."


def generate_itinerary(preferences: TripPreferences) -> TripItinerary:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ItineraryGenerationError(
            code="AI_PROVIDER_NOT_CONFIGURED",
            message="The AI itinerary provider is not configured.",
            status_code=503,
        )

    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    request_body = json.dumps(
        {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a careful travel planner. Produce valid JSON "
                        "that follows the requested itinerary structure."
                    ),
                },
                {"role": "user", "content": _build_prompt(preferences)},
            ],
            "response_format": {"type": "json_object"},
        }
    ).encode("utf-8")
    request = Request(
        f"{base_url}/chat/completions",
        data=request_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=45) as response:
            response_body = response.read()
    except HTTPError as exc:
        error_type, error_code, error_message = _provider_error_details(
            exc, api_key
        )
        logger.warning(
            "AI provider request failed "
            "(status=%d, model=%s, error_type=%s, error_code=%s, message=%s)",
            exc.code,
            _sanitize_log_value(model, api_key),
            error_type,
            error_code,
            error_message,
        )
        raise ItineraryGenerationError(
            code="AI_PROVIDER_ERROR",
            message="The AI provider could not generate an itinerary.",
            status_code=502,
        ) from exc
    except (URLError, TimeoutError, OSError) as exc:
        logger.warning(
            "AI provider request failed (model=%s, transport_error=%s)",
            _sanitize_log_value(model, api_key),
            type(exc).__name__,
        )
        raise ItineraryGenerationError(
            code="AI_PROVIDER_UNAVAILABLE",
            message="The AI itinerary provider is unavailable.",
            status_code=502,
        ) from exc

    return _parse_provider_response(response_body, preferences)
