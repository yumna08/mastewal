
import React from 'react';
import { Link } from 'react-router-dom';
import ChatWidget from '../components/ChatWidget';
import { apiFetch, getApiErrorMessage } from '../services/api';
import { Book } from '../types';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

const HomePage: React.FC = () => {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [booksError, setBooksError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const loadBooks = async () => {
      try {
        setBooksError(null);
        const data = await apiFetch<{ books: Array<Book & { _id: string }> }>('/api/books?limit=12');
        if (!active) return;
        const normalized = data.books.map((book) => ({
          ...book,
          id: book.id || book._id,
        }));
        setBooks(normalized);
      } catch (err) {
        if (!active) return;
        setBooksError(getApiErrorMessage(err, 'Failed to load books.'));
      }
    };

    loadBooks();
    return () => {
      active = false;
    };
  }, []);

  const highlightBooks = books.slice(0, 3);
  const featuredBooks = books.slice(3, 9);
  const featuredSection = useRevealOnScroll<HTMLElement>();
  const highlightsSection = useRevealOnScroll<HTMLElement>();

  const getCoverUrl = (book: Book) => {
    if (book.coverImage) return book.coverImage;
    if (book.coverId) {
      return `https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`;
    }
    if (book.coverEditionKey) {
      return `https://covers.openlibrary.org/b/olid/${book.coverEditionKey}-L.jpg`;
    }
    if (book.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    }
    return '';
  };

  const heroBackground = 'https://i.pinimg.com/1200x/01/9f/3e/019f3ee12510ad6f402ed4c681406225.jpg';

  return (
    <div className="space-y-16 py-10 animate-in fade-in duration-700 dark:text-stone-100">
      <section className="relative min-h-[92vh] overflow-hidden rounded-[2rem] border border-stone-200 shadow-[0_30px_80px_rgba(0,0,0,0.16)] dark:border-stone-800">
        <img
          src={heroBackground}
          alt="Bookstore background"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,240,0.72)_0%,rgba(255,248,240,0.52)_38%,rgba(255,248,240,0.24)_62%,rgba(255,248,240,0.12)_100%)] dark:bg-[linear-gradient(90deg,rgba(17,12,10,0.74)_0%,rgba(17,12,10,0.52)_38%,rgba(17,12,10,0.22)_62%,rgba(17,12,10,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.65),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.18),_transparent_30%)]" />

        <div className="relative flex min-h-[92vh] flex-col justify-between px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-10">
          <div className="flex items-center justify-between gap-4 text-stone-900 dark:text-stone-100">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-xs font-bold tracking-[0.22em] text-stone-900 shadow-md backdrop-blur-sm dark:bg-stone-950/70 dark:text-stone-100">
                MB
              </div>
              <span className="text-lg font-semibold tracking-[0.04em] uppercase">mastewal books</span>
            </div>
            <div className="hidden items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-700 md:flex dark:text-stone-200">
              <span>Home</span>
              <span>Books</span>
              <span>Collection</span>
              <span>Contact</span>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <div className="max-w-2xl space-y-6 pt-8 lg:pt-0">
              <h1 className="font-serif text-6xl font-semibold leading-[0.9] tracking-[-0.06em] text-stone-950 sm:text-7xl lg:text-[5.8rem] dark:text-stone-50">
                The Book Store
              </h1>
              <div className="flex flex-wrap gap-4 pt-2">
                <button className="rounded-full bg-stone-950/90 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-stone-50 shadow-lg shadow-black/10 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white">
                  Browse Books
                </button>
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="max-w-[280px] rounded-[1.75rem] border border-white/60 bg-white/22 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.1)] backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <div className="space-y-3 text-stone-900 dark:text-stone-100">
                  <div className="text-sm uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">Featured title</div>
                  <h2 className="text-2xl font-semibold leading-tight">
                    {highlightBooks[0]?.title || 'The Book Store'}
                  </h2>
                  <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
                    {highlightBooks[0]?.author || 'Simple, quiet, and full-bleed.'}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-3xl font-semibold tracking-tight">
                      {highlightBooks[0] ? `${highlightBooks[0].price} ${highlightBooks[0].currency}` : '$150.99'}
                    </span>
                    <span className="text-xs uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">Now reading</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-end gap-3 pr-2">
            <button className="grid h-8 w-8 place-items-center rounded-full border border-stone-500/60 text-xs">‹</button>
            <button className="grid h-8 w-8 place-items-center rounded-full border border-stone-500/60 text-xs">›</button>
          </div>
        </div>
      </section>

      <section ref={highlightsSection.ref} className={`space-y-6 transition-all duration-700 ${highlightsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-stone-950 dark:text-stone-50">Books</h2>
            <p className="text-sm text-stone-500 font-sans dark:text-stone-400">The books come right after the hero section.</p>
          </div>
          <span className="hidden text-xs uppercase tracking-[0.3em] text-stone-400 sm:block">Scroll for more</span>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {highlightBooks.length === 0 && !booksError ? (
          <div className="col-span-full text-center text-stone-400 font-sans text-sm">
            Loading highlights...
          </div>
        ) : (
          highlightBooks.map((book) => (
            <Link key={book.id} to={`/books/${book.id}`} className="group cursor-pointer block transition-transform duration-300 hover:-translate-y-2">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-4 shadow-md transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]">
                {getCoverUrl(book) ? (
                  <img
                    src={getCoverUrl(book)}
                    alt={book.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-100 to-stone-50" />
                )}
                <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(15,15,15,0.15),_transparent_55%)]" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-1 line-clamp-2 text-stone-900 dark:text-stone-50">{book.title}</h3>
              <p className="text-stone-500 text-sm font-sans dark:text-stone-300">{book.author}</p>
            </Link>
          ))
        )}
        </div>
      </section>

      <section ref={featuredSection.ref} className={`space-y-6 transition-all duration-700 ${featuredSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Featured Titles</h2>
            <p className="text-sm text-stone-500 font-sans dark:text-stone-400">Fresh arrivals from the catalog.</p>
          </div>
          <button className="text-sm font-sans font-semibold text-stone-700 hover:text-stone-900 transition-colors dark:text-stone-300 dark:hover:text-stone-100">
            View full catalog
          </button>
        </div>

        {booksError && (
          <p className="text-sm font-sans text-red-600">{booksError}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredBooks.length === 0 && !booksError ? (
            <div className="col-span-full text-center text-stone-400 font-sans text-sm">
              Loading featured books...
            </div>
          ) : (
            featuredBooks.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`} className="group bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 dark:bg-stone-900 dark:border-stone-800 block">
                <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden dark:bg-stone-950">
                  {getCoverUrl(book) ? (
                    <img
                      src={getCoverUrl(book)}
                      alt={book.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-stone-200 via-stone-100 to-stone-50" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-stone-50">
                    <p className="text-xs uppercase tracking-wider font-sans">{book.category}</p>
                    <h3 className="text-lg font-bold leading-tight line-clamp-2">{book.title}</h3>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm text-stone-600 font-sans dark:text-stone-300">{book.author}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">{book.price} {book.currency}</span>
                    <span className="text-xs font-sans text-stone-500 dark:text-stone-400">Stock {book.stock}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="bg-stone-200 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 dark:bg-stone-900 dark:border dark:border-stone-800">
        <div className="flex-1 space-y-4">
          <h2 className="text-3xl font-bold dark:text-stone-50">The Loyalty Program</h2>
          <p className="text-stone-700 font-sans leading-relaxed dark:text-stone-300">
            Join the mastewal membership to receive 10% off every purchase, exclusive invites to 
            private author events, and early access to our quarterly rare book auctions.
          </p>
          <button className="text-stone-900 font-bold font-sans underline underline-offset-4 hover:text-stone-600 transition-colors dark:text-stone-100 dark:hover:text-stone-300">
            Become a Member
          </button>
        </div>
        <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-inner bg-gradient-to-br from-stone-300 via-stone-200 to-stone-100 relative dark:from-stone-800 dark:via-stone-900 dark:to-stone-950 transition-transform duration-300 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(20,20,20,0.08),rgba(20,20,20,0))]" />
          <div className="absolute bottom-4 left-4 right-4 h-2 bg-stone-400/40 rounded-full" />
        </div>
      </section>

      <ChatWidget />
    </div>
  );
};

export default HomePage;
