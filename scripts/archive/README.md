# Archived Scripts

This folder contains one-time migration scripts and old backups that are no longer needed for production builds.

## Files

### One-Time Migrations (Completed)
- `enrich-product-prices.js` - Added pricing data to products (migration complete)
- `fix-wooden-base-pricing.js` - Fixed specific pricing issue (one-time fix)
- `migrate-to-multi-images.js` - Migrated to multi-image system (complete)
- `transform-products-complete.js` - Legacy product transformation (replaced)

### Old Backups
- `copy-api.js.old.js` - Old version of copy-api.js (replaced)

### Development Testing
- `test-products.js` - Basic product testing (use proper test suite instead)

### Conditional/Manual Use
- `copy-env.js` - Manual environment file copying (not in build process)
- `copy-products.js` - Redundant with fetch-cockpit3d-products.js
- `setup-image-storage.sh` - Initial MAMP setup only (keep for reference)

---

**Note**: These scripts are archived but not deleted in case they're needed for reference or troubleshooting legacy data.

Last Updated: 2025-11-25
