from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .. import models, schemas, auth, database

router = APIRouter()

@router.get("", response_model=List[schemas.Product])
def get_products(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    # Add logic to calculate total quantity from batches if needed, 
    # but the schema expects it. We can handle it in the response model 
    # or by joining.
    return db.query(models.Product).all()

@router.get("/{id}", response_model=schemas.Product)
def get_product(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    # Check if SKU exists
    existing = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{id}", response_model=schemas.Product)
def update_product(id: int, product_update: schemas.ProductCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    db_product = db.query(models.Product).filter(models.Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.dict().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}
