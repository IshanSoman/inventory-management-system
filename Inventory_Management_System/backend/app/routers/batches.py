from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database

router = APIRouter()

@router.get("/{product_id}", response_model=List[schemas.Batch])
def get_batches(product_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    return db.query(models.Batch).filter(models.Batch.product_id == product_id).all()

@router.post("", response_model=schemas.Batch)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    # Create batch
    db_batch = models.Batch(**batch.dict())
    db.add(db_batch)
    
    # Log transaction
    db_transaction = models.Transaction(
        product_id=batch.product_id,
        type="IN",
        quantity=batch.quantity,
        user_id=current_user.id
    )
    db.add(db_transaction)
    
    db.commit()
    db.refresh(db_batch)
    return db_batch
