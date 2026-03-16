#!/bin/bash

# Configuration
PRODUCT_NAME="FDIC DMS Compliance Audit - Priority Access"
PRODUCT_DESC="Surgical technical audit of CORHQ-25-R-0450 technical volume. Includes AlphaRex-to-Azure migration risk shred."
PRICE_AMOUNT=49900 # $499.00
CURRENCY="usd"

# Load Secret Key from .env or argument
STRIPE_KEY=${1:-$STRIPE_SECRET_KEY}

if [ -z "$STRIPE_KEY" ]; then
    echo "Error: STRIPE_SECRET_KEY is not set. Provide it as an argument or set it in your environment."
    exit 1
fi

echo "🚀 Creating product in Stripe..."

# 1. Create Product
PRODUCT_RESPONSE=$(curl -s https://api.stripe.com/v1/products \
  -u "$STRIPE_KEY": \
  -d name="$PRODUCT_NAME" \
  -d description="$PRODUCT_DESC")

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PRODUCT_ID" ]; then
    echo "❌ Failed to create product. Response:"
    echo $PRODUCT_RESPONSE
    exit 1
fi

echo "✅ Product Created: $PRODUCT_ID"

# 2. Create Price
PRICE_RESPONSE=$(curl -s https://api.stripe.com/v1/prices \
  -u "$STRIPE_KEY": \
  -d product="$PRODUCT_ID" \
  -d unit_amount=$PRICE_AMOUNT \
  -d currency=$CURRENCY)

PRICE_ID=$(echo $PRICE_RESPONSE | grep -o '"id": "[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PRICE_ID" ]; then
    echo "❌ Failed to create price. Response:"
    echo $PRICE_RESPONSE
    exit 1
fi

echo "✅ Price Created: $PRICE_ID"

# 3. Create Payment Link
PAY_LINK_RESPONSE=$(curl -s https://api.stripe.com/v1/payment_links \
  -u "$STRIPE_KEY": \
  -d "line_items[0][price]=$PRICE_ID" \
  -d "line_items[0][quantity]=1")

PAY_LINK=$(echo $PAY_LINK_RESPONSE | grep -o '"url": "[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PAY_LINK" ]; then
    echo "❌ Failed to create payment link. Response:"
    echo $PAY_LINK_RESPONSE
    exit 1
fi

echo "---------------------------------------------------"
echo "🔥 SUCCESS! YOUR SURGICAL LINK IS READY:"
echo "$PAY_LINK"
echo "---------------------------------------------------"
