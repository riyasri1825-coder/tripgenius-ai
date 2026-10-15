
import json
import os
import random
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request as FastAPIRequest
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.models.trip import (
    Itinerary,
    ItineraryDay,
    TripData,
    TripGenerationResponse,
    TripPreferences,
    ValidationErrorResponse,
)


# Load environment variables from backend/.env
BACKEND_ENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV, override=False)

router = APIRouter()


# --------------------------------------------------
# FREE FALLBACK ITINERARY GENERATOR
# Works without OpenAI credits or MongoDB.
# --------------------------------------------------

def generate_free_itinerary(preferences: TripPreferences) -> Itinerary:
    destination = preferences.destination.strip()
    interests = preferences.interests
    travel_type = preferences.travel_type
    budget = preferences.budget

    interest_text = " ".join(interests).lower()

    activities = []

    if any(
        word in interest_text
        for word in ["history", "historical", "culture", "heritage"]
    ):
        activities.extend([
            (
                "Explore a historical landmark or heritage area "
                f"in {destination}."
            ),
            (
                "Discover local history, architecture and cultural "
                f"attractions in {destination}."
            ),
            (
                "Visit a museum or cultural centre in {destination}."
                .format(destination=destination)
            ),
        ])

    if any(
        word in interest_text
        for word in ["food", "cuisine", "restaurant", "street food"]
    ):
        activities.extend([
            (
                f"Explore local food markets and try regional dishes "
                f"in {destination}."
            ),
            (
                f"Plan a local food walk and discover popular "
                f"regional specialities in {destination}."
            ),
        ])

    if any(
        word in interest_text
        for word in ["nature", "adventure", "trek", "mountain", "hiking"]
    ):
        activities.extend([
            (
                f"Explore a nature spot or scenic outdoor area "
                f"around {destination}."
            ),
            (
                f"Plan an outdoor activity or a nature walk "
                f"in {destination}."
            ),
        ])

    if any(
        word in interest_text
        for word in ["shopping", "market", "local market"]
    ):
        activities.extend([
            (
                f"Explore local markets in {destination} "
                f"and browse regional products."
            ),
            (
                f"Spend time shopping for local crafts and souvenirs "
                f"in {destination}."
            ),
        ])

    if any(
        word in interest_text
        for word in ["beach", "relaxation", "relax", "peace"]
    ):
        activities.extend([
            (
                f"Enjoy a relaxing break at a suitable leisure spot "
                f"in {destination}."
            ),
            (
                f"Keep time free for relaxation and a leisurely walk "
                f"around {destination}."
            ),
        ])

    if any(
        word in interest_text
        for word in ["photography", "photograph", "art"]
    ):
        activities.extend([
            (
                f"Explore photogenic streets and scenic viewpoints "
                f"in {destination}."
            ),
            (
                f"Plan a photography walk to capture the character "
                f"of {destination}."
            ),
        ])

    # General activities are always available.
    activities.extend([
        f"Explore a popular attraction in {destination}.",
        f"Discover a neighbourhood and its local culture in {destination}.",
        f"Visit a notable public landmark in {destination}.",
        f"Explore local shops, streets and everyday life in {destination}.",
        f"Enjoy a relaxed sightseeing walk around {destination}.",
        f"Explore another point of interest in {destination}.",
        f"Spend time discovering the architecture of {destination}.",
        f"Visit a local attraction that matches your interests in {destination}.",
    ])

    # Make the itinerary varied.
    random.shuffle(activities)

    days = []

    for day_number in range(1, preferences.days + 1):
        start_index = ((day_number - 1) * 3) % len(activities)

        morning = activities[start_index % len(activities)]
        afternoon = activities[
            (start_index + 1) % len(activities)
        ]
        evening = activities[
            (start_index + 2) % len(activities)
        ]

        if travel_type == "family":
            evening = (
                f"Enjoy a relaxed family-friendly outing in {destination}. "
                "Choose a suitable venue for your group."
            )
        elif travel_type == "couple":
            evening = (
                f"Spend a relaxed evening exploring {destination} "
                "and enjoying local dining options."
            )
        elif travel_type == "friends":
            evening = (
                f"Explore local evening activities in {destination} "
                "with your friends."
            )
        elif travel_type == "solo":
            evening = (
                f"Explore a suitable public area in {destination} "
                "and plan a relaxed evening."
            )

        days.append(
            ItineraryDay(
                day=day_number,
                theme=f"Day {day_number}: Explore {destination}",
                morning=morning,
                afternoon=afternoon,
                evening=evening,
            )
        )

    if isinstance(budget, int):
        budget_note = (
            f"Your entered trip budget is {budget}. "
            "Allocate it across accommodation, transport, food and "
            "activities. Check current local prices before booking."
        )
    else:
        budget_notes = {
            "budget": (
                "Choose economical accommodation, public transport "
                "where practical, and affordable local food."
            ),
            "comfortable": (
                "Balance comfortable accommodation, convenient transport "
                "and a mix of paid and free activities."
            ),
            "luxury": (
                "Consider premium accommodation and convenient transport "
                "while checking prices before making reservations."
            ),
        }

        budget_note = budget_notes.get(
            budget,
            "Plan accommodation, transport, meals and activities "
            "according to your available budget.",
        )

    return Itinerary(
        days=days,
        budget_note=(
            budget_note
            + " This is a demo itinerary: verify locations, opening hours, "
            "availability and travel times before your trip."
        ),
    )


# --------------------------------------------------
# OPENAI ITINERARY GENERATOR
# --------------------------------------------------

def generate_ai_itinerary(preferences: TripPreferences) -> Itinerary:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    # No API key? Use the free generator.
    if not api_key:
        print("OpenAI API key not configured. Using free fallback.")
        return generate_free_itinerary(preferences)

    prompt = f"""
Create a practical travel itinerary using these preferences.

Destination: {preferences.destination}
Number of days: {preferences.days}
Budget: {preferences.budget}
Interests: {", ".join(preferences.interests)}
Travel type: {preferences.travel_type}

Return ONLY valid JSON in this format:
{{
  "days": [
    {{
      "day": 1,
      "theme": "A short theme",
      "morning": "Morning activity",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity"
    }}
  ],
  "budget_note": "Practical budget suggestion"
}}

Generate exactly {preferences.days} days.
Number days sequentially from 1 to {preferences.days}.
Personalize activities to the destination and preferences.
Do not invent precise prices, opening hours or reservations.
Return JSON only, without Markdown.
"""

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a practical travel planner. "
                    "Return valid JSON for travel itineraries."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.7,
    }

    request = Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=45) as response:
            provider_result = json.loads(
                response.read().decode("utf-8")
            )

        content = provider_result["choices"][0]["message"]["content"]
        itinerary_data = json.loads(content)

        itinerary = Itinerary.model_validate(itinerary_data)

        expected_days = list(range(1, preferences.days + 1))
        actual_days = [day.day for day in itinerary.days]

        if actual_days != expected_days:
            raise ValueError("Unexpected itinerary day numbering.")

        return itinerary

    except HTTPError as exc:
        # Do not print the API key or full request headers.
        try:
            error_body = json.loads(
                exc.read().decode("utf-8", errors="replace")
            )
            error_info = error_body.get("error", {})

            print(f"OpenAI HTTP status: {exc.code}")
            print(
                "OpenAI error code:",
                error_info.get("code", "unknown"),
            )
            print(
                "OpenAI error message:",
                error_info.get("message", "No details provided"),
            )
        except (ValueError, TypeError, AttributeError):
            print(f"OpenAI HTTP status: {exc.code}")

        print("Using free fallback itinerary.")
        return generate_free_itinerary(preferences)

    except (URLError, TimeoutError) as exc:
        print(
            "OpenAI connection failed:",
            type(exc).__name__,
        )
        print("Using free fallback itinerary.")
        return generate_free_itinerary(preferences)

    except (
        KeyError,
        IndexError,
        TypeError,
        ValueError,
    ) as exc:
        print(
            "OpenAI response could not be processed:",
            type(exc).__name__,
        )
        print("Using free fallback itinerary.")
        return generate_free_itinerary(preferences)


# --------------------------------------------------
# API ENDPOINT
# --------------------------------------------------

@router.post(
    "/generate",
    response_model=TripGenerationResponse,
    responses={422: {"model": ValidationErrorResponse}},
)
def generate_trip(
    preferences: TripPreferences,
) -> TripGenerationResponse:

    itinerary = generate_ai_itinerary(preferences)

    trip_data = TripData(
        destination=preferences.destination,
        days=preferences.days,
        budget=preferences.budget,
        interests=preferences.interests,
        travel_type=preferences.travel_type,
        itinerary=itinerary,
    )

    return TripGenerationResponse(
        success=True,
        message="Your itinerary has been generated successfully.",
        data=trip_data,
    )


# --------------------------------------------------
# VALIDATION ERROR HANDLER
# --------------------------------------------------

async def validation_exception_handler(
    request: FastAPIRequest,
    exc: RequestValidationError,
) -> JSONResponse:

    details = [
        {
            "field": (
                "body"
                if error["type"] == "json_invalid"
                else ".".join(
                    str(part)
                    for part in error["loc"]
                    if part != "body"
                )
                or "request"
            ),
            "message": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": details,
            },
        },
    )