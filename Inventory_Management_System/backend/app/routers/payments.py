from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database
from ..services import telegram_service

router = APIRouter()

@router.get("/customer/{customer_id}", response_model=List[schemas.Payment])
def get_customer_payments(customer_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    return db.query(models.Payment).filter(models.Payment.customer_id == customer_id).order_by(models.Payment.payment_date.desc()).all()

@router.post("", response_model=schemas.Payment)
def record_payment(payment: schemas.PaymentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    customer = db.query(models.Customer).filter(models.Customer.id == payment.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Create payment record
    db_payment = models.Payment(
        customer_id=payment.customer_id,
        invoice_id=payment.invoice_id,
        amount=payment.amount,
        taken_by=current_user.id
    )
    db.add(db_payment)
    
    # Update customer balance
    customer.pending_balance = round((customer.pending_balance or 0.0) - payment.amount, 2)
    
    db.commit()
    db.refresh(db_payment)

    # Send Telegram Notification
    if customer.telegram_chat_id:
        try:
            msg = (
                f"<b>💰 Payment Received</b>\n\n"
                f"Hello <b>{customer.name}</b>,\n"
                f"We have received your payment of <b>₹{payment.amount}</b>.\n"
                f"Your remaining balance is: <b>₹{customer.pending_balance}</b>.\n\n"
                f"Thank you!"
            )
            telegram_service.send_telegram_message(customer.telegram_chat_id, msg)
        except Exception as e:
            print(f"Telegram error: {e}")

    return db_payment
