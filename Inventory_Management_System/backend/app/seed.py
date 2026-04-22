from .database import SessionLocal, engine
from . import models, auth
import datetime

def seed_data():
    db = SessionLocal()
    try:
        # 1. Categories
        electronics = models.Category(name="Electronics")
        groceries = models.Category(name="Groceries")
        pharmacy = models.Category(name="Pharmacy")
        db.add_all([electronics, groceries, pharmacy])
        db.commit()

        # 2. Products
        laptop = models.Product(name="Laptop Pro X", sku="LPX-001", category_id=electronics.id, price=1200.00)
        milk = models.Product(name="Dairy Milk 1L", sku="DMK-101", category_id=groceries.id, price=1.50)
        aspirin = models.Product(name="Aspirin 500mg", sku="ASP-202", category_id=pharmacy.id, price=5.00)
        db.add_all([laptop, milk, aspirin])
        db.commit()

        # 3. Batches
        batch1 = models.Batch(
            product_id=laptop.id, 
            batch_number="B-L001", 
            expiry_date=datetime.datetime(2028, 12, 31), 
            quantity=15
        )
        batch2 = models.Batch(
            product_id=milk.id, 
            batch_number="B-M55", 
            expiry_date=datetime.datetime.utcnow() + datetime.timedelta(days=7), 
            quantity=50
        )
        batch3 = models.Batch(
            product_id=aspirin.id, 
            batch_number="B-A99", 
            expiry_date=datetime.datetime(2025, 6, 1), 
            quantity=100
        )
        db.add_all([batch1, batch2, batch3])
        
        # 4. Customers
        john = models.Customer(name="John Doe", phone="1234567890", email="john@example.com")
        jane = models.Customer(name="Jane Smith", phone="9876543210", email="jane@example.com")
        db.add_all([john, jane])

        # 5. Admin log for these batches
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        admin_id = admin.id if admin else 1
        
        t1 = models.Transaction(product_id=laptop.id, type="IN", quantity=15, user_id=admin_id)
        t2 = models.Transaction(product_id=milk.id, type="IN", quantity=50, user_id=admin_id)
        t3 = models.Transaction(product_id=aspirin.id, type="IN", quantity=100, user_id=admin_id)
        db.add_all([t1, t2, t3])

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
