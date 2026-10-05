import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PrivacyPage() {
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
            <h1 className="font-cormorant text-3xl md:text-4xl font-bold text-[#1A1A1A]">Privacy Policy</h1>
            <p className="text-xs text-[#808080]">Last Updated: August 2026</p>
          </div>

          {/* Legal Text Content */}
          <div className="space-y-8 text-xs md:text-sm text-[#666666] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">1. Data We Collect</h2>
              <p>
                At Ballanki A1 Furnitures, we value your privacy above all. To provide our luxury shopping experience, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Personal details</strong>: Name, email address, phone number, and mailing address to complete registrations and secure deliveries.</li>
                <li><strong>Transaction metadata</strong>: Cart lists, coupon logs, and order histories to fulfill purchases.</li>
                <li><strong>Technical traces</strong>: IP addresses and browser logs to ensure platform integrity and performance.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">2. How We Use Your Data</h2>
              <p>
                Your personal information is handled exclusively to optimize your interaction with our store. We process it to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Process and ship orders, including sending transactional order receipt emails.</li>
                <li>Authenticate your account via secure one-time-passwords (OTP).</li>
                <li>Enhance platform security, audit transactions, and prevent fraudulent claims.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">3. Cookie Policy &amp; Local Storage</h2>
              <p>
                We utilize browser cookies to handle user sessions, maintain authorization tokens securely, and keep your shopping cart state synchronized. These cookies are set dynamically with secure settings, preventing cross-site scripting (XSS) vulnerabilities.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">4. Security &amp; Protection</h2>
              <p>
                Your security is our absolute priority. We implement state-of-the-art encryption protocols to safeguard all data transfers. High-severity data transfers are handled through protected server environments, and database accesses are strictly audited using built-in system logging to keep your information safe.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A]">5. Data Sharing &amp; Third Parties</h2>
              <p>
                We do not sell, rent, or trade your personal information with external brokers. Data is shared only with certified courier partners to fulfill shipping dispatches, or when legally compelled by regulatory audits.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
