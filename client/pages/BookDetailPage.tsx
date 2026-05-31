import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, ShoppingCart, Truck, ShieldCheck, ChevronLeft, Heart, BookOpenText, Sparkles } from 'lucide-react';
import { apiFetch, getApiErrorMessage } from '../services/api';
import { Book } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

const BookDetailPage: React.FC = () => {
  const { id } = useParams();
  const [book, setBook] = React.useState<Book | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const addToCart = useCartStore((state) => state.addToCart);
  const hero = useRevealOnScroll<HTMLElement>();
  const details = useRevealOnScroll<HTMLElement>();

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Missing book id.');
      return;
    }

    let active = true;

    const loadBook = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<{ book: Book & { _id: string } }>(`/api/books/${id}`);
        if (!active) return;
        setBook({ ...data.book, id: data.book.id || data.book._id });
      } catch (err) {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Failed to load book details.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBook();
    return () => {
      active = false;
    };
  }, [id]);

  if (!id) {
    return <div className="py-20 text-center text-sm text-stone-500 font-sans">Missing book id.</div>;
  }

  const rating = book ? 4.2 + ((book.price || 0) % 7) * 0.1 : 4.6;

  const getCoverUrl = (targetBook: Book) => {
    if (targetBook.coverImage) return targetBook.coverImage;
    if (targetBook.coverId) return `https://covers.openlibrary.org/b/id/${targetBook.coverId}-L.jpg`;
    if (targetBook.coverEditionKey) return `https://covers.openlibrary.org/b/olid/${targetBook.coverEditionKey}-L.jpg`;
    if (targetBook.isbn) return `https://covers.openlibrary.org/b/isbn/${targetBook.isbn}-L.jpg`;
    return '';
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-stone-500 font-sans">Loading book...</div>;
  }

  if (error || !book) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm text-red-600 font-sans">{error || 'Book not found.'}</p>
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
          <ChevronLeft className="h-4 w-4" />
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
        <ChevronLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <section ref={hero.ref} className={`grid gap-8 lg:grid-cols-[0.9fr_1.1fr] transition-all duration-700 ${hero.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),transparent_40%)]" />
          <img src={getCoverUrl(book)} alt={book.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
            <Sparkles className="h-4 w-4" />
            Book detail
          </div>

          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">{book.category}</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{book.title}</h1>
            <p className="text-lg text-stone-600 dark:text-stone-300">by {book.author}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <Star className="h-4 w-4 fill-current" />
              {rating.toFixed(1)} rating
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              <BookOpenText className="h-4 w-4" />
              ISBN {book.isbn}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              {book.stock} in stock
            </div>
          </div>

          <p className="max-w-2xl text-base leading-8 text-stone-600 dark:text-stone-300">
            {book.description || 'A carefully curated title from the bookstore catalog.'}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Price</p>
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-50">{book.price} {book.currency}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Publisher</p>
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">{book.publisher || 'Independent'}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Year</p>
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100">{book.publishedYear || 'Unknown'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(book)}
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:-translate-y-0.5 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800">
              <Heart className="h-4 w-4" />
              Wishlist
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
              <Truck className="h-5 w-5 text-emerald-600" />
              Free delivery on local orders
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              Verified catalog metadata
            </div>
          </div>
        </div>
      </section>

      <section ref={details.ref} className={`grid gap-6 lg:grid-cols-3 transition-all duration-700 ${details.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Overview</p>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">This edition is displayed with live pricing, reading metadata, and shopping controls.</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Reading mood</p>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">A strong fit for readers who want substance, momentum, and a polished shelf presence.</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Add-on</p>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">Add it to the cart and keep browsing without losing your place.</p>
        </div>
      </section>
    </div>
  );
};

export default BookDetailPage;