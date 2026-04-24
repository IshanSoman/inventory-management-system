import requests
import os
from io import BytesIO
from xhtml2pdf import pisa

# Manual .env loader to avoid extra dependencies
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('TELEGRAM_BOT_TOKEN='):
                    return line.split('=', 1)[1].strip()
    return os.getenv("TELEGRAM_BOT_TOKEN", "")

TELEGRAM_BOT_TOKEN = load_env()

def send_telegram_message(chat_id: str, message: str):
    """Sends a message to a specific Telegram Chat ID."""
    print(f"DEBUG: Attempting to send Telegram message to Chat ID: {chat_id}")
    if not TELEGRAM_BOT_TOKEN:
        print("DEBUG: ERROR - Telegram Bot Token is missing!")
        return False
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
    try:
        response = requests.post(url, json=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"DEBUG: EXCEPTION - {e}")
        return False

def send_telegram_document(chat_id: str, document_bytes: BytesIO, filename: str):
    """Sends a PDF document to a specific Telegram Chat ID."""
    if not TELEGRAM_BOT_TOKEN:
        return False
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendDocument"
    files = {'document': (filename, document_bytes.getvalue(), 'application/pdf')}
    payload = {'chat_id': chat_id}
    
    try:
        response = requests.post(url, data=payload, files=files)
        return response.status_code == 200
    except Exception as e:
        print(f"DEBUG: Document send failed: {e}")
        return False

def generate_pdf_invoice(customer_name, invoice_id, items_data, total, amount_paid, amount_due):
    """Generates a professional PDF invoice using HTML template."""
    from datetime import datetime
    now = datetime.now().strftime("%d/%m/%Y")
    
    item_rows = ""
    for item in items_data:
        item_rows += f"<tr><td>{item['name']}</td><td>{item['quantity']}</td><td>₹{item['price']}</td><td>₹{item['subtotal']}</td></tr>"

    html_template = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Helvetica, Arial, sans-serif; color: #333; }}
            .header {{ text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }}
            .invoice-title {{ font-size: 24px; color: #4f46e5; font-weight: bold; }}
            .details {{ margin: 20px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ background-color: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }}
            td {{ padding: 10px; border: 1px solid #ddd; }}
            .total-section {{ text-align: right; margin-top: 30px; }}
            .footer {{ text-align: center; margin-top: 50px; font-size: 12px; color: #777; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="invoice-title">INVOICE RECEIPT</div>
            <p>Inventory Management System</p>
        </div>
        <div class="details">
            <p><strong>Invoice ID:</strong> #INV-{invoice_id:03d}</p>
            <p><strong>Customer:</strong> {customer_name}</p>
            <p><strong>Date:</strong> {now}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                {item_rows}
            </tbody>
        </table>
        <div class="total-section">
            <p><strong>Grand Total: ₹{total:.2f}</strong></p>
            <p>Amount Paid: ₹{amount_paid:.2f}</p>
            <p style="color: red;">Balance Due: ₹{amount_due:.2f}</p>
        </div>
        <div class="footer">
            <p>Thank you for your business!</p>
        </div>
    </body>
    </html>
    """
    
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_template, dest=pdf_buffer)
    
    return pdf_buffer if not pisa_status.err else None

def format_bill_message(customer_name, invoice_id, items_data, total, amount_paid, amount_due):
    """Formats the bill details into a professional HTML message for Telegram."""
    from datetime import datetime
    now = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    item_rows = ""
    for item in items_data:
        name = item.get('name', 'Product')
        qty = item.get('quantity', 0)
        price = item.get('price', 0)
        subtotal = round(qty * price, 2)
        item_rows += f"▫️ {name}\n    {qty} x ₹{price} = <b>₹{subtotal}</b>\n"
    
    msg = (
        f"<b>🧾 INVOICE #INV-{invoice_id:03d}</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"👤 Customer: <b>{customer_name}</b>\n"
        f"📅 Date: {now}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"<b>🛒 Items Purchased:</b>\n\n"
        f"{item_rows}"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"💰 <b>TOTAL: ₹{total:.2f}</b>\n"
        f"✅ Paid:  ₹{amount_paid:.2f}\n"
        f"⚠️ Due:   ₹{amount_due:.2f}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"<i>Thank you for shopping with us! 🙏</i>"
    )
    return msg
