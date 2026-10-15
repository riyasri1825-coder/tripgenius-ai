from fastapi import APIRouter, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.models.trip import (
    TripGenerationResponse,
    TripPreferences,
    ValidationErrorResponse,
)

router = APIRouter()


@router.post(
    "/generate",
    response_model=TripGenerationResponse,
    responses={422: {"model": ValidationErrorResponse}},
)
def generate_trip(preferences: TripPreferences) -> TripGenerationResponse:
    return TripGenerationResponse(
        success=True,
        message="Trip preferences received.",
        data=preferences,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
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
