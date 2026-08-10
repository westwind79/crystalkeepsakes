#!/usr/bin/env node
// Fails deployment builds when product data has collapsed to generated placeholders.

const fs = require('fs')
const path = require('path')

const productsPath = path.join(__dirname, '..', 'public', 'data', 'final-products.json')

function fail(message, details = []) {
  console.error(`\nProduct data validation failed: ${message}`)
  details.slice(0, 20).forEach((detail) => console.error(`  - ${detail}`))
  if (details.length > 20) {
    console.error(`  ...and ${details.length - 20} more`)
  }
  process.exit(1)
}

if (!fs.existsSync(productsPath)) {
  fail(`Missing ${productsPath}`)
}

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'))

if (!Array.isArray(products) || products.length < 40) {
  fail('Product list is missing or unexpectedly small')
}

const generatedDescriptions = products.filter((product) => (
  product.description &&
  product.name &&
  String(product.description).trim() === String(product.name).trim()
))

const missingLongDescriptions = products.filter((product) => !String(product.longDescription || '').trim())
const pricedProducts = products.filter((product) => Number(product.basePrice) > 0)
const pricedSizes = products.flatMap((product) => product.sizes || []).filter((size) => Number(size.price) > 0)

if (generatedDescriptions.length > 12) {
  fail(
    'Too many product descriptions match product names',
    generatedDescriptions.map((product) => `${product.id} ${product.sku || ''} ${product.name}`)
  )
}

if (missingLongDescriptions.length > 12) {
  fail(
    'Too many products are missing long descriptions',
    missingLongDescriptions.map((product) => `${product.id} ${product.sku || ''} ${product.name}`)
  )
}

if (pricedProducts.length < 40 || pricedSizes.length < 25) {
  fail('Product pricing coverage is unexpectedly low')
}

console.log(`Product data OK: ${products.length} products, ${pricedProducts.length} base prices, ${pricedSizes.length} size prices`)
