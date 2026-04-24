from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import pandas as pd
import io
import datetime
from .. import models, schemas, auth, database

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    total_products = db.query(func.count(models.Product.id)).scalar()
    
    # Total inventory value: sum(batch.quantity * product.price)
    # Join Batch and Product
    total_value = db.query(func.sum(models.Batch.quantity * models.Product.price)).\
        join(models.Product, models.Batch.product_id == models.Product.id).scalar() or 0
    
    # Low stock alerts: products where sum(batch.quantity) < 10 (example threshold)
    low_stock_query = db.query(models.Product.id, models.Product.name, func.sum(models.Batch.quantity).label("total_qty")).\
        join(models.Batch, models.Product.id == models.Batch.product_id).\
        group_by(models.Product.id).\
        having(func.sum(models.Batch.quantity) < 10).all()
    
    low_stock_alerts = [{"id": r[0], "name": r[1], "quantity": r[2]} for r in low_stock_query]
    
    recent_transactions = db.query(models.Transaction).\
        order_by(models.Transaction.timestamp.desc()).limit(5).all()
    
    # Expired products: batches where expiry_date < now and quantity > 0
    now = datetime.datetime.utcnow()
    expired_query = db.query(
        models.Batch.id,
        models.Product.name,
        models.Batch.batch_number,
        models.Batch.expiry_date,
        models.Batch.quantity
    ).join(
        models.Product, models.Batch.product_id == models.Product.id
    ).filter(
        models.Batch.expiry_date < now,
        models.Batch.quantity > 0
    ).order_by(models.Batch.expiry_date.asc()).all()
    
    expired_products = [
        {
            "id": r[0],
            "product_name": r[1],
            "batch_number": r[2],
            "expiry_date": r[3].isoformat() if r[3] else None,
            "quantity": r[4]
        }
        for r in expired_query
    ]
    
    return {
        "total_products": total_products,
        "total_inventory_value": total_value,
        "low_stock_alerts": low_stock_alerts,
        "recent_transactions": recent_transactions,
        "expired_products": expired_products
    }

@router.get("/export/products")
def export_products(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    products = db.query(models.Product).all()
    data = []
    for p in products:
        total_qty = sum(b.quantity for b in p.batches)
        data.append({
            "ID": p.id,
            "Name": p.name,
            "SKU": p.sku,
            "Category": p.category.name if p.category else "N/A",
            "Price": p.price,
            "Total Quantity": total_qty
        })
    
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"}
    )

@router.get("/export/sales")
def export_sales(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    invoices = db.query(models.Invoice).all()
    data = []
    for inv in invoices:
        data.append({
            "Invoice ID": inv.id,
            "Customer": inv.customer.name,
            "Total Amount": inv.total_amount,
            "Created At": inv.created_at,
            "Created By": inv.created_by
        })
    
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales.csv"}
    )

@router.get("/inventory-status")
def get_inventory_status(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_admin_role)):
    products = db.query(models.Product).all()
    status_data = []
    for p in products:
        total_stock = sum(b.quantity for b in p.batches)
        total_sold = db.query(func.sum(models.InvoiceItem.quantity)).filter(models.InvoiceItem.product_id == p.id).scalar() or 0
        status_data.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category.name if p.category else "N/A",
            "current_stock": total_stock,
            "total_sold": total_sold,
            "price": p.price
        })
    # Sort by demand (total_sold) desc
    status_data.sort(key=lambda x: x["total_sold"], reverse=True)
    return status_data
