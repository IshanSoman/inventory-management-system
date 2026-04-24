import requests
import os

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
        print("DEBUG: ERROR - Telegram Bot Token is missing or empty!")
        return False
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print(f"DEBUG: SUCCESS - Message sent to {chat_id}")
            return True
        else:
            print(f"DEBUG: FAILED - Telegram API Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"DEBUG: EXCEPTION - Error sending Telegram message: {e}")
        return False

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
