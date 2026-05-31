import React from 'react';
import { X, Minus, Plus, Trash } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

const CartDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const items = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = items.reduce((sum, it) => sum + (Number(it.price || 0) * it.quantity), 0);

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${open ? 'pointer-events-auto' : ''}`} aria-hidden={!open}>
      <div className={`fixed inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <aside className={`fixed right-0 top-0 h-full w-full md:w-96 bg-white dark:bg-stone-900 shadow-2xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
          <h3 className="text-lg font-semibold">Your Cart</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-160px)]">
          {items.length === 0 ? (
            <div className="text-sm text-stone-500">Your cart is empty.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <div className="w-16 h-20 bg-stone-100 rounded overflow-hidden">
                  {it.coverImage ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={it.coverImage} alt={it.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm line-clamp-2">{it.title}</div>
                  <div className="text-xs text-stone-500">{it.author}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => updateQuantity(it.id, it.quantity - 1)} className="p-1 rounded border border-stone-200 dark:border-stone-800">
                      <Minus className="w-3 h-3" />
                    </button>
                    <div className="text-sm font-medium">{it.quantity}</div>
                    <button onClick={() => updateQuantity(it.id, it.quantity + 1)} className="p-1 rounded border border-stone-200 dark:border-stone-800">
                      <Plus className="w-3 h-3" />
                    </button>
                    <div className="ml-auto text-sm font-semibold">{it.price} {it.currency}</div>
                    <button onClick={() => removeFromCart(it.id)} className="p-1 text-red-600">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-sm font-semibold mb-3">
            <span>Total</span>
            <span>{total} ETB</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { clearCart(); onClose(); }} className="flex-1 rounded-md border border-stone-200 px-4 py-2 text-sm">Clear</button>
            <button onClick={() => alert('Checkout placeholder')} className="flex-1 rounded-md bg-stone-900 text-white px-4 py-2 text-sm">Checkout</button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
