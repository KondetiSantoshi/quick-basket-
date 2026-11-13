'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Smartphone,
  Download,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  RotateCcw,
  Send
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const FAQ_ITEMS = [
  {
    id: 'delivery',
    q: 'How does QuickBasket deliver groceries in 10 minutes?',
    a: 'We operate temperature-controlled neighborhood dark stores within 2–3 km of every delivery pincode. Once your order is placed, our automated packer picks your items in under 90 seconds and dispatches them immediately via our dedicated EV rider fleet.'
  },
  {
    id: 'payments',
    q: 'Which payment methods are supported on QuickBasket?',
    a: 'You can pay using UPI (Google Pay, PhonePe, Paytm, BHIM via UPI ID or scannable QR), Credit & Debit Cards (Visa, Mastercard, RuPay, Amex with 3D Secure verification), Net Banking across 10 major Indian banks, Mobile Wallets, Razorpay Express, or Cash on Delivery (COD).'
  },
  {
    id: 'returns',
    q: 'What is your return & doorstep refund policy?',
    a: 'If any fruit, vegetable, dairy pack, or packaged grocery item is damaged, expired, or below freshness expectations, request an instant replacement or 100% refund from your Order History or Help Center within 24 hours—no questions asked.'
  },
  {
    id: 'fees',
    q: 'When is delivery free and are there any hidden charges?',
    a: 'Orders of ₹199 or above qualify for ₹0 FREE instant delivery. Orders under ₹199 carry a transparent ₹25 delivery fee plus a ₹5 platform handling fee shown upfront before you pay.'
  },
  {
    id: 'security',
    q: 'Is my card or UPI information stored on QuickBasket servers?',
    a: 'Never. QuickBasket uses signed cryptographic verification and RBI-compliant tokenization. Raw 16-digit card numbers and CVVs are never stored in our database—only your card network badge and last 4 digits appear in Payment History.'
  }
];

function InfoPageInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const platform = searchParams.get('platform') || 'android';
  const topic = searchParams.get('topic') || '';

  const [openFaq, setOpenFaq] = useState(topic === 'returns' ? 'returns' : 'delivery');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [apkRequested, setApkRequested] = useState(false);

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    if (topic === 'returns') {
      setOpenFaq('returns');
    }
  }, [topic]);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistJoined(true);
    setWaitlistEmail('');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactSubmitted(true);
    setContactForm({ name: '', email: '', message: '' });
  };

  let title = 'About QuickBasket';
  let subtitle = 'India’s hyperlocal 10-minute neighborhood grocery delivery network.';
  let content = (
    <div className="space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
      <p>
        <strong>QuickBasket</strong> is built on a simple promise: daily kitchen staples, farm-fresh fruits, dairy,
        beverages, and household essentials should reach your doorstep within minutes without traffic delays or middlemen markups.
      </p>
      <p>
        Our micro dark-store network operates across 20 curated grocery aisles within a 2–3 km radius of your neighborhood,
        pairing cold-chain freshness checks with our electric scooter delivery fleet.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <Clock className="w-5 h-5 text-[#0c831f] mb-2" />
          <p className="font-bold text-slate-900">10-Minute Dispatch</p>
          <p className="text-xs text-slate-600 mt-1">Packed in 90 seconds from local hubs.</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <Truck className="w-5 h-5 text-[#0c831f] mb-2" />
          <p className="font-bold text-slate-900">EV Green Fleet</p>
          <p className="text-xs text-slate-600 mt-1">Zero-emission neighborhood deliveries.</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <ShieldCheck className="w-5 h-5 text-[#0c831f] mb-2" />
          <p className="font-bold text-slate-900">100% Freshness Check</p>
          <p className="text-xs text-slate-600 mt-1">Direct farm & brand sourcing across 20 aisles.</p>
        </div>
      </div>
      <div className="pt-2">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase tracking-wide rounded-xl transition"
        >
          Browse All 20 Grocery Aisles
        </Link>
      </div>
    </div>
  );

  if (pathname === '/contact') {
    title = 'Contact QuickBasket';
    subtitle = '24/7 customer care, order assistance, and neighborhood store partnerships.';
    content = (
      <div className="space-y-6 text-xs sm:text-sm text-slate-600">
        <p>Have an inquiry about an order or want to partner with QuickBasket? We are here 24 hours a day, 7 days a week.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <Mail className="w-5 h-5 text-[#0c831f] mb-2" />
            <span className="font-bold text-slate-900 block text-xs">Customer Support</span>
            <a href="mailto:support@quickbasket.com" className="text-emerald-700 font-semibold hover:underline">
              support@quickbasket.com
            </a>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <Phone className="w-5 h-5 text-[#0c831f] mb-2" />
            <span className="font-bold text-slate-900 block text-xs">Toll-Free Helpline</span>
            <span className="text-slate-800 font-bold">1800-420-QUICK</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <MapPin className="w-5 h-5 text-[#0c831f] mb-2" />
            <span className="font-bold text-slate-900 block text-xs">Headquarters</span>
            <span className="text-slate-500">100ft Road, Indiranagar, Bangalore</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <h2 className="text-base font-black text-slate-900">Send Us a Support Message</h2>
          {contactSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Thanks for reaching out! Support ticket created — our desk will reply shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#0c831f] outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Your Email Address"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#0c831f] outline-none"
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder="Tell us how we can help (order issue, delivery feedback, bulk inquiry)..."
                value={contactForm.message}
                onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#0c831f] outline-none resize-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase rounded-xl transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  } else if (pathname === '/help') {
    title = 'Help Center & FAQs';
    subtitle = 'Answers on instant delivery, payments, refunds, and account security.';
    content = (
      <div className="space-y-6 text-xs sm:text-sm text-slate-600">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-[#0c831f] shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">Instant Refunds</p>
              <p className="text-[11px] text-slate-600">24-hour freshness guarantee</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#0c831f] shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">UPI, Cards & Wallets</p>
              <p className="text-[11px] text-slate-600">RBI-compliant checkout</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[#0c831f] shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">24/7 Live Desk</p>
              <p className="text-[11px] text-slate-600">1800-420-QUICK helpline</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openFaq === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition ${
                  isOpen ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? '' : item.id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                >
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#0c831f]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-slate-900 text-xs">Need help with an active order?</p>
            <p className="text-[11px] text-slate-500">
              {isAuthenticated
                ? 'Open your account Help Desk & Order History directly.'
                : 'Sign in to track orders or contact our 24/7 support desk anytime.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard?tab=help"
                className="px-4 py-2 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs rounded-xl transition"
              >
                My Account Support
              </Link>
            ) : (
              <Link
                href="/contact"
                className="px-4 py-2 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs rounded-xl transition"
              >
                Contact Support
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  } else if (pathname === '/terms') {
    title = 'Terms & Conditions';
    subtitle = 'Service usage, transparent pricing, and customer protection guidelines.';
    content = (
      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Welcome to QuickBasket. By accessing our website, mobile application, or ordering services, you agree to comply with these terms of service.</p>
        <p><strong>1. Delivery Timeframes:</strong> Our 10-minute delivery promise applies under standard operational weather and localized traffic conditions within designated service zip codes.</p>
        <p><strong>2. Pricing & Quantities:</strong> Prices are transparently inclusive of all applicable taxes. Strike-through prices represent standard distributor MRP rates.</p>
        <p><strong>3. Payments & Authorization:</strong> All UPI, card, net banking, and wallet transactions are cryptographically verified before dispatch confirmation.</p>
        <p><strong>4. Refunds & Replacements:</strong> Any perishable item found damaged or unpalatable is replaced or refunded at 100% value without questioning.</p>
      </div>
    );
  } else if (pathname === '/privacy') {
    title = 'Privacy Policy';
    subtitle = 'How QuickBasket protects your personal data, OTP security, and payments.';
    content = (
      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <p>Your privacy and transactional security are paramount to us. QuickBasket collects your delivery address, contact phone number, and email solely to verify your account and fulfill grocery dispatches.</p>
        <p><strong>1. Account Security:</strong> Passwords are stored using salted cryptographic hashes and never in plain text. Account activation and password resets are protected with time-bound, rate-limited OTP verification.</p>
        <p><strong>2. Payment Data Protection:</strong> Online payments processed via UPI, Card, Net Banking, Wallets, and Razorpay follow PCI-DSS standards. QuickBasket never stores raw card numbers or CVV security codes.</p>
        <p><strong>3. Zero Data Resale:</strong> We never sell, rent, or trade your personally identifiable information to third-party advertisers.</p>
      </div>
    );
  } else if (pathname === '/apps') {
    title = 'QuickBasket Mobile Apps';
    subtitle = 'Shop 10-minute groceries seamlessly from Android, iOS, or mobile browser.';
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    content = (
      <div className="space-y-6 text-xs sm:text-sm text-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Android Card */}
          <div className={`p-5 rounded-2xl border-2 transition ${
            platform === 'android' ? 'border-[#0c831f] bg-emerald-50/40' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-2 font-black text-slate-900 text-sm">
                <Smartphone className="w-5 h-5 text-[#0c831f]" />
                Android App (v2.4.0)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0c831f] text-[10px] font-bold uppercase">
                Available
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Instant 1-tap UPI app intent checkout, live rider GPS updates, and offline smart cart sync. Scan the QR code on your Android phone or install the mobile web build directly.
            </p>
            <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-100 mb-4">
              <QRCodeSVG value={appUrl} size={76} includeMargin />
              <div className="text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Scan to Open Mobile Store</p>
                <p>Tap Chrome menu → &ldquo;Install App&rdquo; for native home-screen shortcut.</p>
              </div>
            </div>
            {apkRequested ? (
              <div className="p-3 rounded-xl bg-emerald-100/70 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0c831f] shrink-0" />
                <span>Android mobile build ready at {appUrl} — use Chrome &ldquo;Add to Home Screen&rdquo;.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setApkRequested(true)}
                className="w-full py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Get Android Mobile Build</span>
              </button>
            )}
          </div>

          {/* iOS Card */}
          <div className={`p-5 rounded-2xl border-2 transition ${
            platform === 'ios' ? 'border-[#0c831f] bg-emerald-50/40' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-2 font-black text-slate-900 text-sm">
                <Smartphone className="w-5 h-5 text-slate-700" />
                iOS App Store Edition
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Our native iOS app is entering TestFlight beta soon with Apple Pay &amp; Face ID quick checkout. Join the early-access list or add QuickBasket via Safari Share → Add to Home Screen today.
            </p>
            {waitlistJoined ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0c831f] shrink-0" />
                <span>You&apos;re on the iOS TestFlight early-access waitlist!</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-2.5">
                <input
                  type="email"
                  required
                  placeholder="Enter email for iOS early access"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#0c831f] outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-xl transition"
                >
                  Notify Me on iOS Launch
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 shadow-sm space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c831f] hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        {content}

        <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
          {[
            { to: '/about', label: 'About Us' },
            { to: '/contact', label: 'Contact Us' },
            { to: '/help', label: 'Help & FAQs' },
            { to: '/terms', label: 'Terms & Conditions' },
            { to: '/privacy', label: 'Privacy Policy' },
            { to: '/apps', label: 'Mobile Apps' }
          ].map((navLink) => (
            <Link
              key={navLink.to}
              href={navLink.to}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                pathname === navLink.to
                  ? 'bg-[#0c831f] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-[#0c831f]'
              }`}
            >
              {navLink.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InfoPageContent() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-slate-400">Loading...</div>}>
      <InfoPageInner />
    </Suspense>
  );
}
