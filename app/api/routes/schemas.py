from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.database import get_db
from app.models.scheme import Scheme
from app.models.user import User, UserRole
from app.schemas.scheme import SchemeCreate, SchemeRead, SchemeUpdate

router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.post(
    "",
    response_model=SchemeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_scheme(
    scheme_data: SchemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMINISTRATOR,
            UserRole.GOVERNMENT_OFFICIAL,
        )
    ),
):
    scheme = Scheme(**scheme_data.model_dump())

    db.add(scheme)
    db.commit()
    db.refresh(scheme)

    return scheme


@router.get("", response_model=list[SchemeRead])
def get_schemes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Scheme).all()


@router.get("/{scheme_id}", response_model=SchemeRead)
def get_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()

    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found",
        )

    return scheme


@router.put("/{scheme_id}", response_model=SchemeRead)
def update_scheme(
    scheme_id: int,
    scheme_data: SchemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMINISTRATOR,
            UserRole.GOVERNMENT_OFFICIAL,
        )
    ),
):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()

    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found",
        )

    update_data = scheme_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(scheme, field, value)

    db.commit()
    db.refresh(scheme)

    return scheme


@router.delete("/{scheme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMINISTRATOR,
            UserRole.GOVERNMENT_OFFICIAL,
        )
    ),
):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()

    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found",
        )

    db.delete(scheme)
    db.commit()

    return None