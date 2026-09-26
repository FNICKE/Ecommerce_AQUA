// src/components/VariantSelector.jsx
export default function VariantSelector({ variants, selectedVariant, onSelect }) {
  if (!variants?.length) return null;

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-3">Select Variant</h3>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onSelect(variant)}
            className={`px-5 py-3 border rounded-lg transition-all text-sm font-medium ${
              selectedVariant?.id === variant.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            {variant.attribute_value_ids || 'Default'} - ₹{variant.price}
            {variant.stock <= 0 && (
              <span className="block text-xs text-red-500 mt-1">Out of stock</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}