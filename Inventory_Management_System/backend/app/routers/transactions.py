from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database

router = APIRouter()

@router.get("", response_model=List[schemas.Transaction])
def get_transactions(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    return db.query(models.Transaction).order_by(models.Transaction.timestamp.desc()).all()
