'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/BreadCrumbs'

export default function AboutPageClient() {
  return (
    <div className="bg-white">
      <section className="hero px-8 py-16 text-center">
        <h1 className="text-4xl font-light text-white mb-4">About Us</h1>
        <p className="text-lg text-gray-200">Crafting memories in crystal since 2020</p>
      </section>

      <Breadcrumbs items={[{ label: 'About' }]} />

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2 className="text-2xl font-light text-gray-900 mb-6">What 3D Crystal Engraving Means to Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Since the beginning of time, humans have sought ways to preserve important moments and protect them from the relentless passage of time.
            </p>
            <p className="text-gray-700 leading-relaxed">
              CrystalKeepsakes uses precision laser technology to transform your cherished photos into stunning 3D crystal art pieces.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
