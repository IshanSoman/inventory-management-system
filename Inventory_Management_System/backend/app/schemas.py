from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# Category Schemas
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# Batch Schemas
class BatchBase(BaseModel):
    batch_number: str
    expiry_date: datetime
    quantity: int

class BatchCreate(BatchBase):
    product_id: int

class Batch(BatchBase):
    id: int
    product_id: int
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    category_id: int
    price: float

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    batches: List[Batch] = []
    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    telegram_chat_id: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    pending_balance: float = 0.0
    class Config:
        from_attributes = True

# Invoice Items
class InvoiceItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int
    class Config:
        from_attributes = True

# Invoice
class InvoiceBase(BaseModel):
    customer_id: int
    total_amount: float

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]
    payment_type: str = "cash"   # 'cash' or 'udhari'
    amount_paid: float = 0.0

class Invoice(InvoiceBase):
    id: int
    created_at: datetime
    created_by: int
    payment_type: str = "cash"
    amount_paid: float = 0.0
    amount_due: float = 0.0
    items: List[InvoiceItem] = []
    class Config:
        from_attributes = True

# Transaction
class TransactionBase(BaseModel):
    product_id: int
    type: str
    quantity: int

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int
    timestamp: datetime
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    customer_id: int
    invoice_id: Optional[int] = None
    amount: float

class Payment(BaseModel):
    id: int
    customer_id: int
    invoice_id: Optional[int] = None
    amount: float
    payment_date: datetime
    taken_by: int
    class Config:
        from_attributes = True

# Customer Summary (for /customers/{id}/summary)
class RecentInvoiceSummary(BaseModel):
    invoice_id: int
    total_amount: float
    amount_paid: float
    amount_due: float
    payment_type: str
    status: str   # 'PAID', 'PARTIAL', 'UNPAID'
    created_at: Optional[str]

class CustomerSummary(BaseModel):
    customer_id: int
    customer_name: str
    phone: str
    email: Optional[str]
    telegram_chat_id: Optional[str]
    pending_balance: float
    total_unpaid_invoices: int
    last_payment_date: Optional[str]
    recent_invoices: List[RecentInvoiceSummary]

# Customer Ledger (Unified History)
class CustomerLedgerEntry(BaseModel):
    id: int
    date: datetime
    type: str # 'BILL' or 'PAYMENT'
    reference: str
    total_amount: float
    amount_paid: float
    amount_due: float
    payment_type: Optional[str] = None # 'cash' or 'udhari'
