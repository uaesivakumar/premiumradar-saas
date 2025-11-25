/**
 * Documentation Page Component
 *
 * Display documentation with search and navigation.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  DOC_CATEGORIES,
  searchDocs,
  getRelatedPages,
  generateDocTableOfContents,
  type DocPage,
  type DocCategory,
} from '@/lib/marketing';

interface DocsPageProps {
  page: DocPage;
  category: DocCategory;
}

export function DocsPage({ page, category }: DocsPageProps) {
  const toc = generateDocTableOfContents(page.content);
  const relatedPages = getRelatedPages(page);

  return (
    <div className="flex gap-8">
      {/* Sidebar navigation */}
      <nav className="w-64 flex-shrink-0 hidden lg:block">
        <DocsSidebar activePageId={page.id} />
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <a href="/docs" className="text-gray-500 hover:text-gray-700">
            Docs
          </a>
          <span className="text-gray-300">/</span>
          <a
            href={`/docs/${category.id}`}
            className="text-gray-500 hover:text-gray-700"
          >
            {category.name}
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">{page.title}</span>
        </div>

        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{page.title}</h1>
          <p className="mt-2 text-lg text-gray-600">{page.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{page.readTime} min read</span>
            <span>•</span>
            <span>
              Updated {page.lastUpdated.toLocaleDateString()}
            </span>
          </div>
        </header>

        {/* Table of contents (mobile) */}
        {toc.length > 0 && (
          <div className="lg:hidden mb-8 bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              On this page
            </h2>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li
                  key={item.slug}
                  style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                >
                  <a
                    href={`#${item.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <DocContent content={page.content} />
        </div>

        {/* Tags */}
        {page.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {page.tags.map((tag) => (
                <a
                  key={tag}
                  href={`/docs?tag=${tag}`}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200"
                >
                  {tag}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Related pages */}
        {relatedPages.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPages.map((related) => (
                <a
                  key={related.id}
                  href={`/docs/${related.slug}`}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{related.title}</h4>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {related.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        <DocsPagination currentPage={page} category={category} />
      </main>

      {/* Table of contents sidebar (desktop) */}
      {toc.length > 0 && (
        <aside className="w-48 flex-shrink-0 hidden xl:block">
          <div className="sticky top-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              On this page
            </h2>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li
                  key={item.slug}
                  style={{ paddingLeft: `${(item.level - 1) * 8}px` }}
                >
                  <a
                    href={`#${item.slug}`}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}

function DocsSidebar({ activePageId }: { activePageId: string }) {
  return (
    <div className="sticky top-8">
      <DocsSearch />
      <nav className="mt-6 space-y-6">
        {DOC_CATEGORIES.map((category) => (
          <div key={category.id}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <span>{category.icon}</span>
              {category.name}
            </h3>
            <ul className="space-y-1">
              {category.pages.map((page) => (
                <li key={page.id}>
                  <a
                    href={`/docs/${page.slug}`}
                    className={`block px-3 py-1.5 text-sm rounded transition-colors ${
                      activePageId === page.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {page.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

function DocsSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searchDocs(query).slice(0, 5);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search docs..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(e.target.value.length >= 2);
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
      />
      <span className="absolute right-3 top-2.5 text-gray-400">⌘K</span>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {results.map((result) => (
            <a
              key={result.page.id}
              href={`/docs/${result.page.slug}`}
              className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-900 text-sm">
                {result.page.title}
              </div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                {result.snippet}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function DocContent({ content }: { content: string }) {
  // Simple markdown rendering - in production, use a proper markdown parser
  const html = content
    .split('\n')
    .map((line) => {
      // Headers
      if (line.startsWith('### ')) {
        const text = line.slice(4);
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<h3 id="${slug}">${text}</h3>`;
      }
      if (line.startsWith('## ')) {
        const text = line.slice(3);
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<h2 id="${slug}">${text}</h2>`;
      }
      if (line.startsWith('# ')) {
        const text = line.slice(2);
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<h1 id="${slug}">${text}</h1>`;
      }

      // Code blocks (simplified)
      if (line.startsWith('```')) {
        return line === '```' ? '</pre></code>' : '<code><pre>';
      }

      // Lists
      if (line.startsWith('- ')) {
        return `<li>${line.slice(2)}</li>`;
      }
      if (line.match(/^\d+\. /)) {
        return `<li>${line.replace(/^\d+\. /, '')}</li>`;
      }

      // Bold
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Inline code
      line = line.replace(/`(.+?)`/g, '<code>$1</code>');

      return line ? `<p>${line}</p>` : '';
    })
    .join('\n');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function DocsPagination({
  currentPage,
  category,
}: {
  currentPage: DocPage;
  category: DocCategory;
}) {
  const currentIndex = category.pages.findIndex((p) => p.id === currentPage.id);
  const prevPage = currentIndex > 0 ? category.pages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < category.pages.length - 1
      ? category.pages[currentIndex + 1]
      : null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
      {prevPage ? (
        <a
          href={`/docs/${prevPage.slug}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <span>←</span>
          <div>
            <div className="text-xs text-gray-400">Previous</div>
            <div className="font-medium">{prevPage.title}</div>
          </div>
        </a>
      ) : (
        <div />
      )}

      {nextPage && (
        <a
          href={`/docs/${nextPage.slug}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-right"
        >
          <div>
            <div className="text-xs text-gray-400">Next</div>
            <div className="font-medium">{nextPage.title}</div>
          </div>
          <span>→</span>
        </a>
      )}
    </div>
  );
}

// Documentation home/index page
export function DocsIndex() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Documentation</h1>
        <p className="mt-4 text-lg text-gray-600">
          Learn how to use PremiumRadar to its full potential
        </p>
        <div className="mt-6">
          <DocsSearch />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOC_CATEGORIES.map((category) => (
          <a
            key={category.id}
            href={`/docs/${category.pages[0]?.slug || category.id}`}
            className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-4">{category.icon}</div>
            <h2 className="text-xl font-semibold text-gray-900">
              {category.name}
            </h2>
            <p className="mt-2 text-gray-600">{category.description}</p>
            <p className="mt-4 text-sm text-blue-600">
              {category.pages.length} articles →
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
