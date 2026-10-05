import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F5F0] font-garamond text-[#1A1A1A]">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white border border-[#E2DAC8] p-8 md:p-12 rounded-3xl shadow-xs space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 border-b border-[#EFEBE3] pb-6">
            <span className="text-[10px] font-bold tracking-widest text-[#0D0D0D] bg-[#EFEBE3] border border-[#E2DAC8] px-2.5 py-1 rounded-md uppercase inline-block">
              LEGAL DOCUMENTATION
            </span>
            <h1 className="font-cormorant text-3xl md:text-4xl font-bold text-[#1A1A1A]">Terms &amp; Conditions</h1>
            <p className="text-xs text-[#808080]">Last Updated: August 2026</p>
          </div>

          {/* Legal Text Content */}
          <div className="space-y-8 text-xs md:text-sm text-[#666666] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">1. Acceptance of Terms</h2>
              <p>
                Welcome to Ballanki A1 Furnitures. By accessing our platform, browsing our collection, purchasing items, or engaging with our services, you agree to comply with and be bound by the following Terms and Conditions. Please review them carefully.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">2. Platform Services &amp; Accounts</h2>
              <p>
                Our platform operates as a luxury e-commerce service connecting discerning customers with Silk Sarees, Bridal collections, and Fine Jewellery.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You must provide accurate, current, and complete information during registration.</li>
                <li>You are solely responsible for maintaining the confidentiality of your account credentials and passwords.</li>
                <li>Any unauthorized account usage or security breach must be reported immediately to our support services.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">3. Pricing &amp; Payment</h2>
              <p>
                All prices shown on the website are in Indian Rupees (₹) unless explicitly stated otherwise. We reserve the right to modify prices, descriptions, and availability without prior notice. Payments are secured through state-of-the-art payment gateways, protecting your financial data at every step.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">4. Return &amp; Refund Policy</h2>
              <p>
                Due to the bespoke and luxury nature of Silk Sarees, custom Bridal ensembles, and fine Gold/Jewellery, returns are subject to strict quality assessments. Jewellery items cannot be returned once security tags are removed. Sarees must be returned in original, unworn foldings within 7 days of delivery.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">5. Intellectual Property</h2>
              <p>
                The names, designs, logos, images, software codes, and layouts used on Ballanki A1 Furnitures represent protected intellectual assets. Unauthorized copying, downloading, distributing, or commercial usage of our design system, custom components, or brand images is strictly prohibited under international copyright conventions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">6. Limitation of Liability</h2>
              <p>
                Ballanki A1 Furnitures shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or the inability to use our platform services or purchased items.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
