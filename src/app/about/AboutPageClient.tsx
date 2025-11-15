'use client'

import Image from 'next/image'

export default function AboutPageClient() {
  return (
    <>
      <section className="py-4">
        <div className="hero-content text-center">
          <h1 className="text-5xl font-bold text-white mb-4">About Us</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">Welcome to CrystalKeepsakes, where cherished moments are transformed into stunning 3D laser-engraved crystal creations.</p>
        </div>
      </section>

      <section className="about-preview py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">What 3D Crystal Engraving Means to Us</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>Since the beginning of time, humans have sought ways to preserve important moments and protect them from the relentless passage of time. Stone Age storytellers carved cave drawings to celebrate their epic hunting adventures. Renaissance nobles commissioned elaborate oil paintings to showcase their legacy and sense of style. Across history, nearly every form of art has shared one purpose: making memories last.</p>
                <p>Photography changed everything. It gave us the power to freeze moments in time and relive them endlessly. Digital photography took it a step further. We can now store thousands of photos on devices, share them instantly through social media, and ensure they never fade or degrade.</p>
                <p>But there's a catch. We're capturing more moments than ever, yet digital photos are intangible. We can view them but not hold them.</p>
                <p>That's where CrystalKeepsakes comes in. Say hello to the Personalized 3D Photo Crystal.</p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent my-12"></div>

            <div className="grid md:grid-cols-3 gap-8 items-center mb-12">
              <div className="md:col-span-1">
                <div className="text-center">
                  <Image
                    src="/img/noahs-keepsake-1.png"
                    alt="Noah's 3D Crystal"
                    width={300}
                    height={400}
                    className="rounded-lg mx-auto"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <h2 className="text-3xl font-bold text-white mb-2">Noah</h2>
                <p className="text-xl text-brand-300 mb-4">Visionary Designer and Master Developer</p>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>Noah is the creative force and technical mastermind behind CrystalKeepsakes. With an innate talent for design and an unmatched understanding of 3D laser technology, Noah combines artistry with cutting-edge innovation. His journey began with a deep fascination for how light and precision can transform ordinary materials into extraordinary keepsakes. From crafting intricate designs to refining the smallest technical details, Noah pours his heart and soul into every creation.</p>
                  <p>With years of expertise in 3D modeling and laser engraving, Noah has pushed the boundaries of what's possible in personalized crystal gifts. He meticulously oversees the design and production process to ensure that every piece is a true work of art. Whether it's a family portrait, a beloved pet, or a timeless moment frozen in crystal, Noah's dedication to perfection ensures that your memories are captured beautifully. His technical prowess and visionary leadership have made CrystalKeepsakes synonymous with quality and innovation.</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent my-12"></div>

            <div className="grid md:grid-cols-3 gap-8 items-center mb-12">
              <div className="md:col-span-1 order-2 md:order-1">
                <div className="text-center">
                  <Image
                    src="/img/janell-clipboard.jpg"
                    alt="Janell"
                    width={300}
                    height={400}
                    className="rounded-lg mx-auto"
                  />
                </div>
              </div>
              <div className="md:col-span-2 order-1 md:order-2">
                <h2 className="text-3xl font-bold text-white mb-2">Janell</h2>
                <p className="text-xl text-brand-300 mb-4">Sales Maven and Customer Service Enthusiast</p>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>Janell is the heart and soul of CrystalKeepsakes' customer experience. With a natural flair for sales and a genuine passion for connecting with people, Janell ensures that every customer feels valued and heard. Her philosophy is simple: every interaction is an opportunity to create a lasting relationship. Whether helping customers select the perfect design or guiding them through the customization process, Janell's warm and approachable demeanor makes every experience seamless and enjoyable.</p>
                  <p>Janell's love for customer service is more than a job; it's her calling. She believes that every gift tells a story, and she's committed to helping you tell yours. Her exceptional attention to detail and unwavering commitment to satisfaction ensure that your vision is brought to life in the most meaningful way possible. As the face of CrystalKeepsakes' sales and customer relations, Janell's dedication has helped the company earn a reputation for excellence and trust.</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent my-12"></div>

            <div className="text-center mt-12">
              <h2 className="text-3xl font-bold text-white mb-4">Together, Creating Lasting Memories</h2>
              <p className="text-xl text-brand-300 mb-6">Noah and Janell's partnership is the cornerstone of CrystalKeepsakes.</p>
              <div className="space-y-4 text-gray-300 leading-relaxed max-w-4xl mx-auto">
                <p>Together, they have built a company rooted in innovation, creativity, and unparalleled customer care. Their shared mission is to provide gifts that not only celebrate special occasions but also become treasured keepsakes for years to come. From anniversaries and weddings to graduations and memorials, CrystalKeepsakes offers a unique way to preserve life's most cherished memories.</p>
                <p>At CrystalKeepsakes, we believe in the power of personalization, the beauty of crystal, and the importance of connection. We invite you to explore our collection and experience the artistry and dedication that make each piece truly special. Thank you for allowing us to be part of your most meaningful moments.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
