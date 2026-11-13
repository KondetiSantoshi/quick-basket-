import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Heart, Star, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const ProductCard = ({ product }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const qtyInCart = getItemQuantity(product._id, product.unit);
  const isWishlisted = isInWishlist(product._id);

  const discount =
    product.discountPercent ||
    (product.originalPrice && product.price && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const savingsAmount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(product.originalPrice - product.price)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-hover transition-all duration-200 flex flex-col justify-between p-2.5 sm:p-3 relative group">
      {/* Zepto-style Image Stage with Corner ADD Button */}
      <div className="relative bg-slate-50/75 rounded-xl overflow-hidden mb-2.5">
        {/* Top Row: Discount & Wishlist */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between z-10 pointer-events-none">
          {discount > 0 ? (
            <span className="bg-[#0c831f] text-white text-[10px] font-black tracking-tight px-1.5 py-0.5 rounded-md shadow-xs">
              {discount}% OFF
            </span>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product._id);
            }}
            className={`pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center transition shadow-xs ${
              isWishlisted
                ? 'text-rose-500 bg-white'
                : 'text-slate-400 bg-white/85 hover:text-rose-500 hover:bg-white'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Clickable Product Image */}
        <Link to={`/product/${product._id}`} className="block p-3 pt-4 pb-5">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
            }}
            className="w-full h-28 sm:h-32 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>

        {/* Multi-variant chip */}
        {product.variants?.length > 1 && (
          <div className="absolute bottom-2 left-2 bg-white/95 border border-emerald-200 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-[#0c831f]">
            {product.variants.length} sizes
          </div>
        )}

        {/* Zepto Signature Floating Corner ADD / Stepper Button */}
        <div className="absolute bottom-1.5 right-1.5 z-10">
          {qtyInCart === 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="bg-white hover:bg-[#0c831f] text-[#0c831f] hover:text-white border-[1.5px] border-[#0c831f] font-black text-[11px] uppercase px-3.5 py-1 rounded-lg shadow-sm active:scale-95 transition-all"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-[#0c831f] text-white rounded-lg overflow-hidden shadow-md">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product._id, qtyInCart - 1, product.unit);
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#095e16] transition active:scale-90"
              >
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="w-5 text-center text-xs font-bold font-mono">
                {qtyInCart}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product._id, qtyInCart + 1, product.unit);
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#095e16] transition active:scale-90"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zepto-Style Compact Details Below Image */}
      <Link to={`/product/${product._id}`} className="flex-1 flex flex-col justify-between">
        <div>
          {/* Price Row */}
          <div className="flex items-baseline flex-wrap gap-1.5 mb-1">
            <span className="text-sm sm:text-[15px] font-black text-slate-900">
              ₹{product.price}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
            {savingsAmount > 0 && (
              <span className="text-[10px] font-bold text-[#0c831f] bg-emerald-50 px-1.5 py-0.2 rounded">
                Save ₹{savingsAmount}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-[13px] font-semibold text-slate-800 line-clamp-2 group-hover:text-[#0c831f] transition-colors leading-snug min-h-[2.25rem]">
            {product.name}
          </h3>

          {/* Pack Weight & Delivery ETA */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span className="truncate font-medium">{product.unit}</span>
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
              <Zap className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
              {product.deliveryEstimate || '8 MINS'}
            </span>
          </div>
        </div>

        {/* Rating & Brand Footer */}
        <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-50">
          {product.rating ? (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-[#0c831f] text-[10px] font-bold px-1.5 py-0.5 rounded">
                <Star className="w-2.5 h-2.5 fill-[#0c831f]" />
                {product.rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400">
                ({product.numReviews || 12})
              </span>
            </div>
          ) : (
            <span />
          )}
          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[75px]">
            {product.brand}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
