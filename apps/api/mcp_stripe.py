import os
import stripe
from mcp.server.fastmcp import FastMCP

# Ensure the Stripe API key is loaded from the environment
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

mcp_stripe = FastMCP("aris-stripe-mcp")

@mcp_stripe.tool()
async def retrieve_payment_intent(payment_intent_id: str) -> dict:
    """Read the status of a specific Stripe process or payment intent."""
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return {
            "id": intent.id,
            "status": intent.status,
            "amount": intent.amount,
            "currency": intent.currency,
            "customer": intent.customer
        }
    except Exception as e:
        return {"error": str(e)}

@mcp_stripe.tool()
async def list_active_products(limit: int = 10) -> list:
    """List available active products from Stripe."""
    try:
        products = stripe.Product.list(limit=limit, active=True)
        return [{"id": p.id, "name": p.name, "description": p.description} for p in products.data]
    except Exception as e:
        return [{"error": str(e)}]

@mcp_stripe.tool()
async def check_stripe_connection() -> dict:
    """Verify that Stripe is properly configured and authenticated."""
    try:
        account = stripe.Account.retrieve()
        return {"status": "ok", "account": account.id}
    except Exception as e:
        return {"status": "error", "error": str(e)}
