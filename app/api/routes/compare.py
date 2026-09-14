from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.scheme import Scheme
from app.models.eligibility import EligibilityRule
from app.models.user import User
from app.schemas.compare import (
    CompareRequest,
    CompareResponse,
)

router = APIRouter(
    prefix="/compare",
    tags=["Comparison"],
)


@router.post(
    "",
    response_model=CompareResponse,
    status_code=status.HTTP_200_OK,
)
def compare_schemes(
    compare_data: CompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(compare_data.scheme_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least two scheme IDs are required for comparison",
        )

    scheme_ids = list(dict.fromkeys(compare_data.scheme_ids))

    schemes = (
        db.query(Scheme)
        .filter(Scheme.id.in_(scheme_ids))
        .all()
    )

    if len(schemes) != len(scheme_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more schemes not found",
        )

    scheme_map = {scheme.id: scheme for scheme in schemes}

    result = []

    for scheme_id in scheme_ids:
        scheme = scheme_map[scheme_id]

        rules = (
            db.query(EligibilityRule)
            .filter(EligibilityRule.scheme_id == scheme.id)
            .all()
        )

        eligibility_rules = [
            {
                "id": rule.id,
                "rule_name": rule.rule_name,
                "criteria_json": rule.criteria_json,
                "description": rule.description,
                "is_active": rule.is_active,
            }
            for rule in rules
        ]

        result.append(
            {
                "id": scheme.id,
                "name": scheme.name,
                "description": scheme.description,
                "benefits": scheme.benefits,
                "target_audience": scheme.target_audience,
                "policy_id": scheme.policy_id,
                "eligibility_rules": eligibility_rules,
            }
        )

    differences = []

    first_scheme = scheme_map[scheme_ids[0]]

    for second_id in scheme_ids[1:]:
        second_scheme = scheme_map[second_id]

        # Compare benefits
        if first_scheme.benefits == second_scheme.benefits:
            benefit_difference = "Benefits are the same."
        else:
            benefit_difference = (
                f"Scheme {first_scheme.id}: {first_scheme.benefits or 'Not specified'} | "
                f"Scheme {second_scheme.id}: {second_scheme.benefits or 'Not specified'}"
            )

        # Get eligibility rules
        first_rules = (
            db.query(EligibilityRule)
            .filter(EligibilityRule.scheme_id == first_scheme.id)
            .all()
        )

        second_rules = (
            db.query(EligibilityRule)
            .filter(EligibilityRule.scheme_id == second_scheme.id)
            .all()
        )

        first_eligibility = [
            rule.criteria_json or rule.description or rule.rule_name
            for rule in first_rules
        ]

        second_eligibility = [
            rule.criteria_json or rule.description or rule.rule_name
            for rule in second_rules
        ]

        if first_eligibility == second_eligibility:
            eligibility_difference = "Eligibility criteria are the same."
        else:
            eligibility_difference = (
                f"Scheme {first_scheme.id}: "
                f"{first_eligibility or ['No eligibility rules specified']} | "
                f"Scheme {second_scheme.id}: "
                f"{second_eligibility or ['No eligibility rules specified']}"
            )

        differences.append(
            {
                "scheme_1_id": first_scheme.id,
                "scheme_2_id": second_scheme.id,
                "benefit_difference": benefit_difference,
                "eligibility_difference": eligibility_difference,
            }
        )

    return {
        "schemes": result,
        "differences": differences,
    }