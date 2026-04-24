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

@router.get("/{customer_id}/summary", response_model=schemas.CustomerSummary)
def get_customer_summary(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_staff_role)
):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Unpaid invoices count
    unpaid_count = db.query(models.Invoice).filter(
        models.Invoice.customer_id == customer_id,
        models.Invoice.amount_due > 0
    ).count()

    # Last payment date
    last_payment = db.query(models.Payment).filter(
        models.Payment.customer_id == customer_id
    ).order_by(models.Payment.payment_date.desc()).first()

    # Recent invoices
    recent_invoices = db.query(models.Invoice).filter(
        models.Invoice.customer_id == customer_id
    ).order_by(models.Invoice.created_at.desc()).limit(5).all()

    invoice_summaries = []
    for inv in recent_invoices:
        status = "PAID"
        if inv.amount_due > 0:
            status = "PARTIAL" if inv.amount_paid > 0 else "UNPAID"
        
        invoice_summaries.append({
            "invoice_id": inv.id,
            "total_amount": inv.total_amount,
            "amount_paid": inv.amount_paid,
            "amount_due": inv.amount_due,
            "payment_type": inv.payment_type,
            "status": status,
            "created_at": inv.created_at.isoformat() if inv.created_at else None
        })

    return {
        "customer_id": customer.id,
        "customer_name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "telegram_chat_id": customer.telegram_chat_id,
        "pending_balance": customer.pending_balance,
        "total_unpaid_invoices": unpaid_count,
        "last_payment_date": last_payment.payment_date.isoformat() if last_payment else None,
        "recent_invoices": invoice_summaries
    }

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

@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(
    customer_id: int, 
    customer_update: schemas.CustomerCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.check_staff_role)
):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # If phone is changing, check if the new phone is already taken by someone else
    if customer_update.phone != db_customer.phone:
        existing = db.query(models.Customer).filter(models.Customer.phone == customer_update.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered to another customer")
    
    # Update fields
    for key, value in customer_update.dict().items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/{customer_id}/ledger", response_model=List[schemas.CustomerLedgerEntry])
def get_customer_ledger(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_staff_role)
):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Fetch all invoices
    invoices = db.query(models.Invoice).filter(models.Invoice.customer_id == customer_id).all()
    # Fetch all payments
    payments = db.query(models.Payment).filter(models.Payment.customer_id == customer_id).all()

    ledger = []

    # Process Invoices
    for inv in invoices:
        ledger.append({
            "id": inv.id,
            "date": inv.created_at,
            "type": "BILL",
            "reference": f"Invoice #INV-{inv.id}",
            "total_amount": inv.total_amount,
            "amount_paid": inv.amount_paid,
            "amount_due": inv.amount_due,
            "payment_type": inv.payment_type
        })

    # Process Payments (independent payments or credit clearances)
    for p in payments:
        # Avoid duplicate entries for payments tied to invoices if we only want to show the 'Payment' action
        # Actually, it's better to show 'BILL' and 'PAYMENT' as separate rows for clarity
        ledger.append({
            "id": p.id,
            "date": p.payment_date,
            "type": "PAYMENT",
            "reference": f"Payment Ref: {p.id}" if not p.invoice_id else f"Payment for #INV-{p.invoice_id}",
            "total_amount": p.amount,
            "amount_paid": p.amount,
            "amount_due": 0.0,
            "payment_type": "cash"
        })

    # Sort by date descending
    ledger.sort(key=lambda x: x["date"], reverse=True)
    return ledger
