from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.trips import (
    itinerary_generation_exception_handler,
    router as trips_router,
    validation_exception_handler,
)
from backend.services.itinerary import ItineraryGenerationError

app = FastAPI(
    title="TripGenius API",
    description="API for planning personalized trips.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(
    ItineraryGenerationError,
    itinerary_generation_exception_handler,
)
app.include_router(trips_router, prefix="/api/trips", tags=["trips"])
