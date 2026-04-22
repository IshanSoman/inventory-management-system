from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database, auth
from .routers import auth_router, products, categories, batches, customers, invoices, transactions, reports, payments

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Inventory Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Admin User if not exists
@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            hashed_pwd = auth.get_password_hash("admin123")
            new_admin = models.User(username="admin", password_hash=hashed_pwd, role="admin")
            db.add(new_admin)
            db.commit()
            print("Initial admin user created: admin / admin123")
        
        # Also create a staff user for testing
        staff_user = db.query(models.User).filter(models.User.username == "staff").first()
        if not staff_user:
            hashed_pwd = auth.get_password_hash("staff123")
            new_staff = models.User(username="staff", password_hash=hashed_pwd, role="staff")
            db.add(new_staff)
            db.commit()
            print("Initial staff user created: staff / staff123")
    finally:
        db.close()

app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(batches.router, prefix="/batches", tags=["Batches"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])

@app.get("/")
def read_root():
    return {"message": "Welcome to IMS API"}
