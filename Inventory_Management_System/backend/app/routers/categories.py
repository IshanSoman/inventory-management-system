from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database

router = APIRouter()

@router.get("", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    return db.query(models.Category).all()

@router.post("", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{id}")
def delete_category(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    category = db.query(models.Category).filter(models.Category.id == id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
