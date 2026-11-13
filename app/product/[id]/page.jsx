'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/product/ProductCard';
import { 
  Star, 
  Heart, 
  Plus, 
  Minus, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  ChevronRight,
  MessageSquarePlus,
  Loader2,
  Check
} from 'lucide-react';

export default function ProductDetailsPage({ params: propsParams }) {
  const routerParams = useParams();
  const id = propsParams?.id || routerParams?.id;

  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, setAuthModalOpen } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        const loaded = data.product;
        setProduct(loaded);
        setRelated(data.related || []);
        if (loaded?.variants?.length > 0) {
          const matching = loaded.variants.find((v) => v.unit === loaded.unit) || loaded.variants[0];
          setSelectedVariant(matching);
        } else {
          setSelectedVariant(null);
        }
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-[#0c831f] mb-3" />
        <p className="text-sm font-semibold">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-20 text-center p-8 bg-white rounded-3xl border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Product Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">The item you are looking for is either sold out or no longer available.</p>
        <Link href="/products" className="inline-block px-5 py-2.5 bg-[#0c831f] text-white rounded-xl font-bold text-xs">
          Browse All Products
        </Link>
      </div>
    );
  }

  const activeUnit = selectedVariant?.unit || product.unit;
  const activePrice = selectedVariant?.price ?? product.price;
  const activeOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;

  const qtyInCart = getItemQuantity(product._id, activeUnit);
  const isWishlisted = isInWishlist(product._id);
  const discount =
    activeOriginalPrice > activePrice
      ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
      : product.discountPercent || 0;

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const { data } = await api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });
      setProduct(data.product);
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to post review', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-medium">
        <Link href="/" className="hover:text-[#0c831f]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-[#0c831f]">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
        {/* Left: Product Image Column */}
        <div className="md:col-span-5 relative flex flex-col items-center">
          <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-slate-50 flex items-center justify-center p-6 border border-slate-100 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
              }}
              className="max-h-full max-w-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-[#ff3269] text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg shadow-sm">
                {discount}% OFF
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product._id)}
              className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition ${
                isWishlisted ? 'bg-rose-50 text-rose-500' : 'bg-white text-slate-400 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Delivery speed pill */}
          <div className="mt-4 w-full p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0c831f] text-white flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-bold text-emerald-950">
                Delivery in {product.deliveryEstimate || '10 MINS'}
              </span>
            </div>
            <span className="text-emerald-700 font-medium">Free over ₹299</span>
          </div>
        </div>

        {/* Right: Product Info & Actions Column */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 block mb-1">
              {product.brand}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>
            <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">
              Pack Size: {activeUnit}
            </span>
          </div>

          {/* Interactive Pack-Size Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Pack Size / Quantity
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((variant, idx) => {
                  const isSelected = activeUnit === variant.unit;
                  const varDisc =
                    variant.originalPrice > variant.price
                      ? Math.round(((variant.originalPrice - variant.price) / variant.originalPrice) * 100)
                      : 0;
                  return (
                    <button
                      key={variant.unit || idx}
                      type="button"
                      disabled={variant.inStock === false}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2.5 rounded-2xl border text-left transition min-w-[120px] ${
                        isSelected
                          ? 'border-[#0c831f] bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      } ${variant.inStock === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#0c831f]' : 'text-slate-800'}`}>
                          {variant.unit}
                        </span>
                        {varDisc > 0 && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {varDisc}% OFF
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-black text-slate-900">₹{variant.price}</span>
                        {variant.originalPrice > variant.price && (
                          <span className="text-[11px] text-slate-400 line-through">₹{variant.originalPrice}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rating summary */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#0c831f] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              <span>{product.rating ? product.rating.toFixed(1) : '4.8'}</span>
              <Star className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {product.numReviews || 24} Verified Ratings &amp; Reviews
            </span>
          </div>

          {/* Price & Discounts */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Inclusive of all taxes</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">₹{activePrice}</span>
                {activeOriginalPrice > activePrice && (
                  <span className="text-sm font-semibold text-slate-400 line-through">
                    MRP ₹{activeOriginalPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart Stepper */}
            <div>
              {qtyInCart === 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    addToCart(
                      {
                        ...product,
                        productId: product._id,
                        unit: activeUnit,
                        price: activePrice,
                        originalPrice: activeOriginalPrice
                      },
                      1
                    )
                  }
                  className="bg-[#0c831f] hover:bg-[#095e16] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD TO BASKET</span>
                </button>
              ) : (
                <div className="flex items-center bg-[#0c831f] text-white rounded-2xl overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product._id, qtyInCart - 1, activeUnit)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-[#095e16] transition active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold font-mono text-sm">
                    {qtyInCart}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product._id, qtyInCart + 1, activeUnit)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-[#095e16] transition active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Product Specifications / Shelf Life */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5 font-medium">Shelf Life</span>
              <span className="font-bold text-slate-800">{product.shelfLife || '3 to 5 Days'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5 font-medium">Storage</span>
              <span className="font-bold text-slate-800">{product.storageInstructions || 'Cool & Dry Place'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5 font-medium">Origin</span>
              <span className="font-bold text-slate-800">{product.countryOfOrigin || 'India'}</span>
            </div>
          </div>

          {/* Assurances */}
          <div className="flex items-center gap-6 pt-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0c831f]" />
              100% Quality Checked
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-[#0c831f]" />
              Instant Doorstep Returns
            </span>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-sm mb-12">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Customer Ratings &amp; Reviews</h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Write a Review Form */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-[#0c831f]" />
              Write a Review
            </h4>
            <p className="text-xs text-slate-500 mb-4">Share your feedback on freshness, packaging, or taste.</p>

            {reviewSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Thank you! Your review has been published.
              </div>
            )}

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">({reviewRating} / 5)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Feedback</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Delivered crisp and fresh in just 8 minutes! Very pleased."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:border-[#0c831f] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            {(!product.reviews || product.reviews.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No reviews yet for this product. Be the first to share your experience!</p>
            ) : (
              product.reviews.map((rev, index) => (
                <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#0c831f] text-xs font-bold flex items-center justify-center">
                        {rev.name ? rev.name[0].toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{rev.name}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-50 text-[#0c831f] px-2 py-0.5 rounded text-[11px] font-bold">
                      <span>{rev.rating}</span>
                      <Star className="w-2.5 h-2.5 fill-emerald-600" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="my-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            Similar Groceries in {product.category}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
