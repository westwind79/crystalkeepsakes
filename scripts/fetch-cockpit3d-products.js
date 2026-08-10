// scripts/fetch-cockpit3d-products.js
// Runs before build to refresh product data from the local PHP Cockpit3D endpoint.

const http = require('http')
const fs = require('fs')
const path = require('path')

const MAMP_PORT = process.env.MAMP_PORT || '8888'
const ENDPOINT = '/api/cockpit3d/cockpit3d-data-fetcher.php?action=generate-products'
const CANDIDATE_URLS = [
  process.env.COCKPIT3D_FETCH_URL,
  `http://localhost:${MAMP_PORT}${ENDPOINT}`,
  `http://localhost/crystalkeepsakes${ENDPOINT}`,
  `http://localhost:${MAMP_PORT}/crystalkeepsakes${ENDPOINT}`,
].filter(Boolean)

function syncFinalProductsJson() {
  const root = path.join(__dirname, '..')
  const srcFile = path.join(root, 'src', 'data', 'cockpit3d-products.js')
  const finalFile = path.join(root, 'public', 'data', 'final-products.json')
  const text = fs.readFileSync(srcFile, 'utf8')
  const match = text.match(/export const cockpit3dProducts = ([\s\S]*?);\s*\n\nexport const/)

  if (!match) {
    throw new Error('Could not parse cockpit3dProducts export')
  }

  const fetchedProducts = JSON.parse(match[1])
  const existingProducts = fs.existsSync(finalFile)
    ? JSON.parse(fs.readFileSync(finalFile, 'utf8'))
    : []
  const existingById = new Map(existingProducts.map((product) => [String(product.id), product]))
  const existingBySku = new Map(existingProducts.map((product) => [String(product.sku || ''), product]))

  const curatedProductFields = [
    'description',
    'longDescription',
    'basePrice',
    'cost',
    'sale',
    'salePrice',
    'salePercent',
    'visible',
    'featured',
    'requiresImage',
    'maskImageUrl',
    'occasions',
    'categories',
    'edited',
    'editedAt'
  ]
  const curatedCustomProductFields = [
    'name',
    'slug',
    'sku',
    'images',
    'options',
    'fulfillment'
  ]
  const curatedOptionFields = ['price', 'cost', 'enabled']

  const looksGeneratedDescription = (product) => (
    !product.description ||
    product.description === product.name ||
    product.longDescription === ''
  )

  const mergeArrayByIdOrName = (incoming = [], existing = []) => {
    if (!Array.isArray(incoming)) return incoming
    if (!Array.isArray(existing)) return incoming

    const existingByKey = new Map()
    existing.forEach((item) => {
      const key = String(item.id ?? item.cockpit3d_id ?? item.name ?? '')
      if (key) existingByKey.set(key, item)
    })

    return incoming.map((item) => {
      const key = String(item.id ?? item.cockpit3d_id ?? item.name ?? '')
      const previous = existingByKey.get(key)
      if (!previous) return item

      const merged = { ...item }
      curatedOptionFields.forEach((field) => {
        if (previous[field] !== undefined) merged[field] = previous[field]
      })
      return merged
    })
  }

  const products = fetchedProducts.map((product) => {
    const previous = existingById.get(String(product.id)) || existingBySku.get(String(product.sku || ''))
    if (!previous) return product

    const merged = { ...product }
    const fieldsToPreserve = previous.fulfillment === 'custom'
      ? [...curatedProductFields, ...curatedCustomProductFields]
      : curatedProductFields

    fieldsToPreserve.forEach((field) => {
      if (previous[field] === undefined) return

      if ((field === 'description' || field === 'longDescription') && looksGeneratedDescription(previous)) {
        return
      }

      merged[field] = previous[field]
    })

    merged.sizes = mergeArrayByIdOrName(product.sizes, previous.sizes)
    merged.lightBases = mergeArrayByIdOrName(product.lightBases, previous.lightBases)
    merged.backgroundOptions = mergeArrayByIdOrName(product.backgroundOptions, previous.backgroundOptions)
    merged.textOptions = mergeArrayByIdOrName(product.textOptions, previous.textOptions)

    return merged
  })

  fs.writeFileSync(finalFile, `${JSON.stringify(products, null, 2)}\n`)
  return { count: products.length, finalFile }
}

console.log('[FETCH] Fetching products from CockPit3D...')

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`API URL: ${url}`)

    http.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }

        if (!data || data.trim() === '') {
          reject(new Error('Empty response from PHP endpoint'))
          return
        }

        if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
          reject(new Error('Received HTML instead of JSON'))
          return
        }

        try {
          resolve(JSON.parse(data))
        } catch (error) {
          reject(new Error(`Could not parse JSON response: ${data.substring(0, 200)}`))
        }
      })
    }).on('error', reject)
  })
}

(async () => {
  for (const url of CANDIDATE_URLS) {
    try {
      const result = await fetchUrl(url)

      if (!result.success) {
        throw new Error(result.error || 'Unknown PHP script error')
      }

      console.log('Products fetched successfully.')
      console.log(`   Total: ${result.total_count || result.products_count || 0} products`)
      console.log(`   Static: ${result.static_count || 0} products`)
      console.log(`   CockPit3D: ${result.cockpit3d_count || 0} products`)
      console.log(`   Saved to: ${result.output_path || result.file_path || 'src/data/cockpit3d-products.js'}`)
      const syncResult = syncFinalProductsJson()
      console.log(`   Synced ${syncResult.count} products to: ${syncResult.finalFile}`)
      process.exit(0)
    } catch (error) {
      console.warn(`Fetch failed: ${error.message}`)
    }
  }

  console.warn('Could not fetch from Cockpit3D using any local URL.')
  console.warn('Skipping Cockpit3D fetch and using existing product data.')
  console.warn('If you need fresh data, run this on the local machine with MAMP.')
  process.exit(0)
})()
