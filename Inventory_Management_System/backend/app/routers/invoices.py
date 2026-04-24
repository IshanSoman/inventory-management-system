from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database
from ..services import stock_service, telegram_service

router = APIRouter()

@router.get("", response_model=List[schemas.Invoice])
def get_invoices(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_staff_role)):
    return db.query(models.Invoice).order_by(models.Invoice.created_at.desc()).all()

@router.post("", response_model=schemas.Invoice)
def create_invoice(
    invoice: schemas.InvoiceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_staff_role)
):
    # Validate payment type
    if invoice.payment_type not in ("cash", "udhari"):
        raise HTTPException(status_code=400, detail="payment_type must be 'cash' or 'udhari'")

    # Udhari only for registered customers
    customer = db.query(models.Customer).filter(models.Customer.id == invoice.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Determine financial fields
    if invoice.payment_type == "cash":
        amount_paid = invoice.total_amount
        amount_due = 0.0
    else:
        # Udhari: partial or zero payment allowed
        amount_paid = max(0.0, min(invoice.amount_paid, invoice.total_amount))
        amount_due = round(invoice.total_amount - amount_paid, 2)

    # 1. Create Invoice record
    db_invoice = models.Invoice(
        customer_id=invoice.customer_id,
        total_amount=invoice.total_amount,
        payment_type=invoice.payment_type,
        amount_paid=amount_paid,
        amount_due=amount_due,
        created_by=current_user.id
    )
    db.add(db_invoice)
    db.flush()  # Get invoice ID

    # 2. Process items — reduce stock (FIFO) + create invoice items
    for item in invoice.items:
        stock_service.reduce_stock_fifo(db, item.product_id, item.quantity, current_user.id)
        db_item = models.InvoiceItem(
            invoice_id=db_invoice.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price
        )
        db.add(db_item)

    # 3. If udhari: add amount_due to customer.pending_balance
    if amount_due > 0:
        customer.pending_balance = round((customer.pending_balance or 0.0) + amount_due, 2)

    # 4. If amount_paid > 0: record a payment entry
    if amount_paid > 0:
        db_payment = models.Payment(
            customer_id=invoice.customer_id,
            invoice_id=db_invoice.id,
            amount=amount_paid,
            taken_by=current_user.id
        )
        db.add(db_payment)

    db.commit()
    db.refresh(db_invoice)

    # 5. Send Telegram Notification if customer has a chat_id
    if customer.telegram_chat_id:
        try:
            # Prepare items for the message and PDF
            items_for_msg = []
            for item in db_invoice.items:
                items_for_msg.append({
                    "name": item.product.name,
                    "quantity": item.quantity,
                    "price": item.price,
                    "subtotal": round(item.quantity * item.price, 2)
                })
            
            # Send Text Summary
            msg = telegram_service.format_bill_message(
                customer_name=customer.name,
                invoice_id=db_invoice.id,
                items_data=items_for_msg,
                total=db_invoice.total_amount,
                amount_paid=db_invoice.amount_paid,
                amount_due=db_invoice.amount_due
            )
            telegram_service.send_telegram_message(customer.telegram_chat_id, msg)

            # Generate and Send PDF Document
            pdf_buffer = telegram_service.generate_pdf_invoice(
                customer_name=customer.name,
                invoice_id=db_invoice.id,
                items_data=items_for_msg,
                total=db_invoice.total_amount,
                amount_paid=db_invoice.amount_paid,
                amount_due=db_invoice.amount_due
            )
            if pdf_buffer:
                filename = f"Invoice_INV_{db_invoice.id:03d}.pdf"
                telegram_service.send_telegram_document(customer.telegram_chat_id, pdf_buffer, filename)
                
        except Exception as e:
            print(f"Failed to send Telegram notification: {e}")

    return db_invoice
