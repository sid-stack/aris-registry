#!/usr/bin/env zsh
# --------------------------------------------------------------
# fetch_sam_prospects.sh  –  one‑off CSV export from SAM.gov FBO API
# --------------------------------------------------------------

# ---- USER SETTINGS -------------------------------------------------
API_KEY="${SAM_GOV_API_KEY}"   # <-- set this in your environment or .env.local
if [[ -z "$API_KEY" ]]; then
  echo "❌ Error: SAM_GOV_API_KEY environment variable is not set."
  exit 1
fi
BASE_URL="https://api.sam.gov/prod/fbo/v1"
PAGE_SIZE=100                                        # max per request

# macOS/BSD date does NOT support “-d”. Use “-v” to shift days.
START_DATE=$(date -u -v -30d +%Y-%m-%d)   # 30 days ago (UTC)
END_DATE=$(date -u +%Y-%m-%d)             # today (UTC)

# Optional filters – uncomment & edit if you need them
# NAICS="541511,541512,236220"
# MIN_AWARD=100000
# --------------------------------------------------------------

# Build the query string (URL‑encoded later by curl)
QUERY="awardDate=${START_DATE}..${END_DATE}"
# Uncomment the next lines to add optional filters:
# QUERY="${QUERY}&naics=${NAICS}"
# QUERY="${QUERY}&minimumAwardAmount=${MIN_AWARD}"
# QUERY="${QUERY}&noticeType=award"

# Output CSV file (timestamped)
OUTPUT="prospects_$(date -u +%Y%m%d%H%M%S).csv"
echo "Award ID,Award Date,Contract Title,Agency,Contractor Name,UEI/DUNS,Award Amount,Contact Name,Contact Email,Contact Phone,SAM.gov URL" > "$OUTPUT"

PAGE=1
while true; do
  # ---- FETCH ONE PAGE ------------------------------------------------
  curl -s -G "${BASE_URL}/contractData" \
    -H "Authorization: Bearer ${API_KEY}" \
    --data-urlencode "page=${PAGE}" \
    --data-urlencode "pageSize=${PAGE_SIZE}" \
    --data-urlencode "${QUERY}" \
    -o "page_${PAGE}.json"

  # ---- STOP IF NO RECORDS -------------------------------------------
  if [[ $(jq '.contractData | length' "page_${PAGE}.json") -eq 0 ]]; then
    rm "page_${PAGE}.json"
    break
  fi

  # ---- APPEND CSV LINES ----------------------------------------------
  jq -r '
    .contractData[]
    | [
        .awardID,
        .awardDate,
        .contractTitle,
        .awardingAgency.name,
        .contractor.legalBusinessName,
        (.contractor.uei // .contractor.duns // "N/A"),
        .awardAmount,
        .contact.name // "N/A",
        .contact.email // "N/A",
        .contact.phone // "N/A",
        ("https://sam.gov/opp/" + .awardID)
      ]
    | @csv
  ' "page_${PAGE}.json" >> "$OUTPUT"

  echo "✔️ Page ${PAGE} processed."
  # ---- CHECK IF THERE IS A NEXT PAGE -----------------------------------
  HAS_MORE=$(jq -r '.hasMore // false' "page_${PAGE}.json")
  rm "page_${PAGE}.json"
  if [[ "$HAS_MORE" != "true" ]]; then
    break
  fi
  ((PAGE++))
done

echo "✅ Finished – $(wc -l < "$OUTPUT") lines written to $OUTPUT"