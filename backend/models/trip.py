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


class TripGenerationResponse(BaseModel):
    success: bool
    message: str
    data: TripPreferences


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
