// src/components/CartItem.jsx
import { Plus, Minus, Trash2, Tag } from 'lucide-react';
import { getImageUrl } from '../lib/imageUrl';

export default function CartItem({ item, onQtyChange, onRemove }) {
  const hasDiscount =
    item.special_price > 0 && item.special_price < item.price;

  const displayPrice = item.effectivePrice ?? (hasDiscount ? item.special_price : item.price);
  const mrpPrice     = Number(item.price || 0);
  const lineTotal    = displayPrice * (item.qty || 1);

  const discountPct = hasDiscount
    ? Math.round(((mrpPrice - displayPrice) / mrpPrice) * 100)
    : 0;

  return (
    <div className="flex items-start gap-5 py-6 border-b last:border-b-0">
      {/* Product Image */}
      <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
        <img
          src={getImageUrl(item.image) || '/placeholder-product.jpg'}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-base line-clamp-2">{item.name}</h3>

        {/* Weight / Variant */}
        {item.weight && (
          <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.weight}</p>
        )}
        {item.sku && (
          <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-indigo-600 font-bold text-base">
            ₹{Number(displayPrice).toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <>
              <span className="text-gray-400 text-sm line-through">
                ₹{mrpPrice.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                <Tag size={9} />
                {discountPct}% OFF
              </span>
            </>
          )}
          <span className="text-gray-400 text-sm">× {item.qty}</span>
        </div>

        {/* Line total */}
        <p className="text-sm font-bold text-slate-600 mt-1">
          Total: <span className="text-slate-900">₹{Number(lineTotal).toLocaleString('en-IN')}</span>
        </p>
      </div>

      {/* Quantity & Remove */}
      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => onQtyChange(item.id, item.qty - 1)}
            disabled={item.qty <= 1}
            className="px-3 py-2 hover:bg-gray-100 disabled:opacity-40 transition-colors text-gray-600"
          >
            <Minus size={15} />
          </button>
          <span className="px-4 py-2 font-bold text-slate-800 text-sm min-w-[40px] text-center">
            {item.qty}
          </span>
          <button
            onClick={() => onQtyChange(item.id, item.qty + 1)}
            disabled={item.qty >= (item.variant_stock || 99)}
            className="px-3 py-2 hover:bg-gray-100 disabled:opacity-40 transition-colors text-gray-600"
          >
            <Plus size={15} />
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs font-semibold transition-colors"
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    </div>
  );
}