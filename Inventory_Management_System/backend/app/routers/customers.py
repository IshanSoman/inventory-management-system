from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database

router = APIRouter()

@router.get("", response_model=List[schemas.Customer])
def get_customers(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    return db.query(models.Customer).all()

@router.get("/by-phone/{phone}", response_model=schemas.Customer)
def get_customer_by_phone(phone: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    customer = db.query(models.Customer).filter(models.Customer.phone == phone).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.get("/{customer_id}/history")
def get_customer_history(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_admin_role)
):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    invoices = db.query(models.Invoice).filter(models.Invoice.customer_id == customer_id)\
        .order_by(models.Invoice.created_at.desc()).all()

    invoice_data = []
    for inv in invoices:
        items = []
        for item in inv.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            items.append({
                "product_id": item.product_id,
                "product_name": product.name if product else "Unknown",
                "quantity": item.quantity,
                "price": item.price,
                "subtotal": round(item.quantity * item.price, 2)
            })
        invoice_data.append({
            "invoice_id": inv.id,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
            "total_amount": inv.total_amount,
            "items": items
        })

    total_spent = sum(inv.total_amount for inv in invoices)

    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "email": customer.email
        },
        "total_invoices": len(invoices),
        "total_spent": round(total_spent, 2),
        "invoices": invoice_data
    }

@router.post("", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    existing = db.query(models.Customer).filter(models.Customer.phone == customer.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer
