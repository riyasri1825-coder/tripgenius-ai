from fastapi import APIRouter, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.models.trip import (
    TripGenerationData,
    TripGenerationResponse,
    TripPreferences,
    ValidationErrorResponse,
)
from backend.services.itinerary import (
    ItineraryGenerationError,
    generate_itinerary,
)

router = APIRouter()


@router.post(
    "/generate",
    response_model=TripGenerationResponse,
    responses={
        422: {"model": ValidationErrorResponse},
        502: {"model": ValidationErrorResponse},
        503: {"model": ValidationErrorResponse},
    },
)
def generate_trip(preferences: TripPreferences) -> TripGenerationResponse:
    itinerary = generate_itinerary(preferences)
    return TripGenerationResponse(
        success=True,
        message="Trip preferences received.",
        data=TripGenerationData(
            **preferences.model_dump(),
            itinerary=itinerary,
        ),
    )


async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    details = [
        {
            "field": (
                "body"
                if error["type"] == "json_invalid"
                else ".".join(
                    str(part) for part in error["loc"] if part != "body"
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


async def itinerary_generation_exception_handler(
    _request: Request, exc: ItineraryGenerationError
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": [],
            },
        },
    )
