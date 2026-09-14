from typing import List, Optional
from pydantic import BaseModel


class CompareRequest(BaseModel):
    scheme_ids: List[int]


class EligibilityRuleComparison(BaseModel):
    id: int
    rule_name: str
    criteria_json: Optional[str] = None
    description: Optional[str] = None
    is_active: bool


class SchemeComparison(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    benefits: Optional[str] = None
    target_audience: Optional[str] = None
    policy_id: Optional[int] = None
    eligibility_rules: List[EligibilityRuleComparison]


class ComparisonDifference(BaseModel):
    scheme_1_id: int
    scheme_2_id: int
    benefit_difference: str
    eligibility_difference: str


class CompareResponse(BaseModel):
    schemes: List[SchemeComparison]
    differences: List[ComparisonDifference]