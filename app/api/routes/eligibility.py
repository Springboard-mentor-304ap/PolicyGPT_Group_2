from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.database import get_db
from app.models.eligibility import EligibilityRule
from app.models.scheme import Scheme
from app.models.user import User, UserRole
from app.schemas.eligibility_rule import (
    EligibilityRuleCreate,
    EligibilityRuleRead,
    EligibilityRuleUpdate,
)

router = APIRouter(
    prefix="/eligibility-rules",
    tags=["Eligibility Rules"],
)


@router.post(
    "",
    response_model=EligibilityRuleRead,
    status_code=status.HTTP_201_CREATED,
)
def create_eligibility_rule(
    rule_data: EligibilityRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMINISTRATOR,
            UserRole.GOVERNMENT_OFFICIAL,
        )
    ),
):
    scheme = (
        db.query(Scheme)
        .filter(Scheme.id == rule_data.scheme_id)
        .first()
    )

    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found",
        )

    rule = EligibilityRule(**rule_data.model_dump())

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


@router.get(
    "/scheme/{scheme_id}",
    response_model=list[EligibilityRuleRead],
)
def get_scheme_eligibility_rules(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scheme = (
        db.query(Scheme)
        .filter(Scheme.id == scheme_id)
        .first()
    )

    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found",
        )

    return (
        db.query(EligibilityRule)
        .filter(EligibilityRule.scheme_id == scheme_id)
        .all()
    )


@router.get(
    "/{rule_id}",
    response_model=EligibilityRuleRead,
)
def get_eligibility_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = (
        db.query(EligibilityRule)
        .filter(EligibilityRule.id == rule_id)
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eligibility rule not found",
        )

    return rule


@router.put(
    "/{rule_id}",
    response_model=EligibilityRuleRead,
)
def update_eligibility_rule(
    rule_id: int,
    rule_data: EligibilityRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMINISTRATOR,
            UserRole.GOVERNMENT_OFFICIAL,
        )
    ),
):
    rule = (
        db.query(EligibilityRule)
        .filter(EligibilityRule.id == rule_id)
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eligibility rule not found",
        )

    update_data = rule_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)

    return rule


@router.delete(
    "/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_eligibility_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMINISTRATOR,
            UserRole.GOVERNMENT_OFFICIAL,
        )
    ),
):
    rule = (
        db.query(EligibilityRule)
        .filter(EligibilityRule.id == rule_id)
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eligibility rule not found",
        )

    db.delete(rule)
    db.commit()

    return None