import { assetPath } from './assetPath'

export async function getProducts() {
  const res = await fetch(assetPath('/data/products.json'))
  return res.json()
}
