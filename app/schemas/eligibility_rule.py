from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EligibilityRuleBase(BaseModel):
    rule_name: str
    criteria_json: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class EligibilityRuleCreate(EligibilityRuleBase):
    scheme_id: int


class EligibilityRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    criteria_json: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class EligibilityRuleRead(EligibilityRuleBase):
    id: int
    scheme_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)