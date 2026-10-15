from typing import Annotated, Literal

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    PositiveInt,
    StringConstraints,
)

BudgetTier = Literal["budget", "comfortable", "luxury"]
TravelType = Literal["solo", "couple", "family", "friends"]
Interest = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=80),
]


class TripPreferences(BaseModel):
    model_config = ConfigDict(extra="forbid")

    destination: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=120),
    ]
    days: int = Field(ge=1, le=60)
    budget: PositiveInt | BudgetTier
    interests: list[Interest] = Field(min_length=1, max_length=20)
    travel_type: TravelType = Field(
        validation_alias=AliasChoices("travel_type", "travelType")
    )


class ItineraryActivity(BaseModel):
    name: str
    description: str
    suggested_place: str
    cost_level: Literal["free", "low", "moderate", "high"]


class ItineraryDay(BaseModel):
    day: PositiveInt
    theme: str
    morning: ItineraryActivity
    afternoon: ItineraryActivity
    evening: ItineraryActivity


class TripItinerary(BaseModel):
    budget_note: str
    days: list[ItineraryDay] = Field(min_length=1, max_length=60)


class TripGenerationData(TripPreferences):
    itinerary: TripItinerary


class TripGenerationResponse(BaseModel):
    success: bool
    message: str
    data: TripGenerationData


class ValidationErrorDetail(BaseModel):
    field: str
    message: str
    type: str


class ApiError(BaseModel):
    code: str
    message: str
    details: list[ValidationErrorDetail]


class ValidationErrorResponse(BaseModel):
    success: bool
    error: ApiError
