from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from fastapi import HTTPException

def reduce_stock_fifo(db: Session, product_id: int, quantity_to_reduce: int, user_id: int):
    # Total available stock check
    total_stock = db.query(func.sum(models.Batch.quantity)).filter(models.Batch.product_id == product_id).scalar() or 0
    if total_stock < quantity_to_reduce:
        raise HTTPException(status_code=400, detail=f"Insufficient stock for product ID {product_id}")

    # Fetch batches ordered by expiry date (FIFO/FEFO)
    # If expiry_date is same, order by id
    batches = db.query(models.Batch).filter(
        models.Batch.product_id == product_id,
        models.Batch.quantity > 0
    ).order_by(models.Batch.expiry_date.asc(), models.Batch.id.asc()).all()

    remaining_to_reduce = quantity_to_reduce
    
    for batch in batches:
        if remaining_to_reduce <= 0:
            break
        
        if batch.quantity >= remaining_to_reduce:
            batch.quantity -= remaining_to_reduce
            remaining_to_reduce = 0
        else:
            remaining_to_reduce -= batch.quantity
            batch.quantity = 0
        
        db.add(batch)

    # Log transaction
    db_transaction = models.Transaction(
        product_id=product_id,
        type="OUT",
        quantity=quantity_to_reduce,
        user_id=user_id
    )
    db.add(db_transaction)
    
    return True
