"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-garamond text-[#1A1A1A]">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white border border-[#E2DAC8] p-4 sm:p-8 md:p-12 rounded-3xl shadow-xs space-y-8">
          <div className="text-center space-y-2 border-b border-[#EFEBE3] pb-6">
            <span className="text-[10px] font-bold tracking-widest text-[#0D0D0D] bg-[#EFEBE3] border border-[#E2DAC8] px-2.5 py-1 rounded-md uppercase inline-block">
              LEGAL DOCUMENTATION
            </span>
            <h1 className="font-cormorant text-3xl md:text-4xl font-bold text-[#1A1A1A]">Cancellation &amp; Refund Policy</h1>
            <p className="text-xs text-[#808080]">Last Updated: August 2026</p>
          </div>

          <div className="space-y-8 text-xs md:text-sm text-[#666666] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">1. 7-Day Secure Return &amp; Exchange Window</h2>
              <p>
                At Ballanki A1 Furnitures, your absolute satisfaction is our commitment. If your order does not meet your luxury standards, we provide a secure <strong>7-day return and exchange window</strong> from the date of delivery.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>To initiate a return or exchange, please reach out to our Concierge Team at <strong>support@ballankia1furnitures.com</strong> with your Order ID.</li>
                <li>Returns initiated after the 7-day period will not be accepted.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">2. Return Eligibility &amp; Conditions</h2>
              <p>
                To qualify for a refund or exchange, returned items must be verified by our Quality Assurance vault against the following terms:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Condition</strong>: Items must be entirely unworn, unused, unwashed, and in pristine condition with all security seals intact.</li>
                <li><strong>Packaging</strong>: The item must be returned in its original luxury case, including protective foam, transport crates, hardware security tags, and care manuals, and certificates of authenticity.</li>
                <li><strong>Exclusion Signs</strong>: Any sign of wear, stains, upholstery smudges, wood scratches, or structural deformations, or alterations will result in immediate disqualification of the return request.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">3. Non-Returnable &amp; Non-Refundable Products</h2>
              <p>
                Certain categories of products are meticulously tailored or sanitized and are therefore exempt from standard returns:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Customized &amp; Bespoke Pieces</strong>: Custom wood dimensions, engraved furniture, and personalized upholstery selections.</li>
                <li><strong>Custom Furniture Framing</strong>: Sofa sets ordered with custom dimensions, specific upholstery fabrics, or tailored edgings.</li>
                <li><strong>Gift Cards &amp; Store Credits</strong>: E-gift cards are non-refundable and cannot be redeemed for cash.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">4. Cancellation Policy</h2>
              <p>
                We believe in flexible shopping. However, because our artisan weavers and craftsmen begin preparing orders immediately, cancellation parameters apply:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Orders can be cancelled free of charge within 12 hours of placement or prior to dispatch.</li>
                <li>Once dispatched, cancellations are treated as returns subject to return shipping deductions.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
