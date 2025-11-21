#!/bin/bash
# Generate available-masks.json from files in /public/img/masks/

cd /app/public/img/masks

echo "🔍 Scanning for mask files..."

ls *.png *.jpg *.jpeg *.webp 2>/dev/null | jq -R -s -c '
  split("\n") | 
  map(select(length > 0)) | 
  map({
    filename: ., 
    path: ("/img/masks/" + .), 
    displayName: (. | sub("-mask\\.(png|jpg|jpeg|webp)$"; "") | gsub("[-_]"; " "))
  }) | 
  sort_by(.displayName)
' > /app/public/data/available-masks.json

if [ $? -eq 0 ]; then
  echo "✅ Masks JSON generated: /app/public/data/available-masks.json"
  echo "📊 Found $(jq '. | length' /app/public/data/available-masks.json) masks"
else
  echo "❌ Failed to generate masks JSON"
  exit 1
fi
