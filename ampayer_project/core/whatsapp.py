from twilio.rest import Client
import os
import logging

logger = logging.getLogger(__name__)

# Sandbox configuration default or from settings
# The user needs to set these in settings.py or environment variables
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_FROM_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', '+14155238886') # Sandbox default

def send_whatsapp_message(to_number, body):
    """
    Send a WhatsApp message via Twilio.
    Returns the message SID if successful, None otherwise.
    to_number should be in E.164 format (e.g. +521...)
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured. WhatsApp message not sent.")
        # For development, just log it as sent
        print(f"[MOCK WHATSAPP] To: {to_number} | Body: {body}")
        return "mock-sid-dev-environment"

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        # Ensure 'whatsapp:' prefix
        from_ = f'whatsapp:{TWILIO_FROM_NUMBER}'
        to_ = f'whatsapp:{to_number}'
        
        message = client.messages.create(
            from_=from_,
            body=body,
            to=to_
        )
        return message.sid
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        return None
