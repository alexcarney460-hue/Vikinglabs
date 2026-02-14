import React from 'react';

export const metadata = {
  title: 'Terms of Service | Viking Labs',
  description: 'Terms of Service for Viking Labs peptide research products',
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mb-4 text-sm text-gray-600">Last updated: February 2026</p>

        <div className="space-y-8 text-gray-700">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            <p className="mb-2">
              By accessing and using the Viking Labs website ("Site") and purchasing our products, you agree to be bound
              by these Terms of Service. If you do not agree to these terms, please do not use our Site or purchase our
              products. Viking Labs reserves the right to update these terms at any time. Your continued use of the Site
              constitutes acceptance of changes.
            </p>
          </section>

          {/* 2. Product Description & Use */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">2. Product Description & Research Use</h2>
            <p className="mb-2">
              Viking Labs provides peptide research products for laboratory and research purposes only. All products are
              sold strictly for in vitro research use. Products are not intended for human consumption, medical use,
              veterinary use, or any form of clinical application.
            </p>
            <p className="mb-2">
              The purchaser agrees to use all products only for legitimate scientific research purposes and in compliance
              with all applicable federal, state, and local laws and regulations.
            </p>
          </section>

          {/* 3. Age Restriction */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">3. Age Restriction</h2>
            <p className="mb-2">
              You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to purchase from
              Viking Labs. By making a purchase, you represent and warrant that you meet this requirement.
            </p>
          </section>

          {/* 4. Prohibited Uses */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">4. Prohibited Uses</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="mb-2 list-inside list-disc space-y-1">
              <li>Use products for human consumption or medical purposes</li>
              <li>Violate any applicable local, state, or federal laws or regulations</li>
              <li>Resell products without proper licensing or authorization</li>
              <li>Attempt to reverse-engineer or analyze products outside permitted research scope</li>
              <li>Make false claims about product efficacy, safety, or applications</li>
              <li>Use products in any manner that could cause harm to humans or animals</li>
            </ul>
          </section>

          {/* 5. Disclaimer of Warranties */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">5. Disclaimer of Warranties</h2>
            <p className="mb-2">
              VIKING LABS PROVIDES ALL PRODUCTS ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. WE DISCLAIM ALL EXPRESS AND
              IMPLIED WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-2">
              We do not warrant that products will meet your specific research requirements or that product operations
              will be uninterrupted or error-free. Purchasers are responsible for validating product suitability for
              their research applications.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">6. Limitation of Liability</h2>
            <p className="mb-2">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIKING LABS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OUR PRODUCTS OR SITE, INCLUDING BUT
              NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS INTERRUPTION, EVEN IF WE HAVE BEEN ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mb-2">
              Our total liability for any claim arising from these terms or your use of products shall not exceed the
              amount paid for the product in question.
            </p>
          </section>

          {/* 7. Product Quality & Testing */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">7. Product Quality & Testing</h2>
            <p className="mb-2">
              All Viking Labs peptides are manufactured under strict quality control standards. Each batch is tested for
              purity and identity by independent third-party laboratories. Certificates of Analysis (COA) are provided
              with each order.
            </p>
            <p className="mb-2">
              Products should be stored according to provided specifications. Viking Labs is not responsible for
              degradation due to improper storage or handling by the purchaser.
            </p>
          </section>

          {/* 8. Payment & Refunds */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">8. Payment & Refunds</h2>
            <p className="mb-2">
              Payment must be received before shipment. We accept all major credit cards, cryptocurrency, and bank
              transfers. All prices are in USD unless otherwise stated.
            </p>
            <p className="mb-2">
              Refunds are issued only for defective products within 14 days of receipt. Opened or used products are not
              eligible for refund. Customers are responsible for return shipping costs. Return authorizations must be
              requested before shipping products back.
            </p>
          </section>

          {/* 9. Shipping & Delivery */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">9. Shipping & Delivery</h2>
            <p className="mb-2">
              We ship to most countries. Shipping costs are calculated at checkout. Risk of loss passes to the
              purchaser upon delivery to the carrier. We are not responsible for damage or loss during transit.
            </p>
            <p className="mb-2">
              Orders typically ship within 2-3 business days. Delivery times vary by location and carrier. Tracking
              information will be provided via email.
            </p>
          </section>

          {/* 10. Intellectual Property */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">10. Intellectual Property</h2>
            <p className="mb-2">
              All content on the Viking Labs Site, including text, graphics, logos, images, and software, is the
              property of Viking Labs or its content suppliers and is protected by international copyright laws.
            </p>
            <p className="mb-2">
              You may not reproduce, distribute, modify, or transmit any content without prior written permission from
              Viking Labs.
            </p>
          </section>

          {/* 11. User Conduct */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">11. User Conduct</h2>
            <p className="mb-2">You agree to:</p>
            <ul className="mb-2 list-inside list-disc space-y-1">
              <li>Provide accurate and complete information during account creation and checkout</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not engage in any unlawful or fraudulent activities</li>
            </ul>
          </section>

          {/* 12. Indemnification */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">12. Indemnification</h2>
            <p className="mb-2">
              You agree to indemnify, defend, and hold harmless Viking Labs, its officers, directors, employees, and
              agents from any claims, liabilities, damages, and costs arising from your use of our products or violation
              of these terms.
            </p>
          </section>

          {/* 13. Severability */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">13. Severability</h2>
            <p className="mb-2">
              If any provision of these terms is found to be unenforceable, that provision will be modified to the
              minimum extent necessary to make it enforceable, and the remaining provisions will remain in full force.
            </p>
          </section>

          {/* 14. Governing Law */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">14. Governing Law & Jurisdiction</h2>
            <p className="mb-2">
              These Terms of Service are governed by and construed in accordance with the laws of California, without
              regard to its conflict of law principles. Any legal action or proceeding shall be conducted exclusively in
              the state and federal courts located in California.
            </p>
          </section>

          {/* 15. Contact Information */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">15. Contact Information</h2>
            <p className="mb-2">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="mb-2">
              Viking Labs<br />
              Email: support@vikinglabs.co<br />
              Website: vikinglabs.co
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
