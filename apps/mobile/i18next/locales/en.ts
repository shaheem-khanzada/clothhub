const en = {
  translation: {
    common: {
      actions: {
        apply: 'Apply',
        applyCount: 'Apply ({{count}})',
        close: 'Close',
        reset: 'Reset',
        clear: 'Clear',
        retry: 'Try again',
        share: 'Share',
        more: 'More',
      },
      error: {
        title: 'Something went wrong',
        description: 'Check your connection and try again.',
      },
    },

    brand: {
      name: 'ClothHub',
      /** Read by screen readers while the launch animation plays; tapping skips it. */
      launchLabel: 'ClothHub. Tap to skip.',
    },

    catalog: {
      favorites: {
        save: 'Save',
        remove: 'Remove from saved',
      },

      common: {
        discount: '{{percent}}% OFF',
        productCount_one: '{{count}} product',
        productCount_other: '{{count}} products',
        pieceCount: '{{count}} Piece',
        pieceType: {
          threePiece: '3 Piece',
          twoPiece: '2 Piece',
          single: 'Separates',
        },
        stitching: {
          stitched: 'Stitched',
          unstitched: 'Unstitched',
        },
        visitBrand: 'Visit Brand',
        outOfStock: 'Out of stock',
        inStock: 'In stock',
      },

      brands: {
        title: 'Brands',
        subtitle: 'Discover Pakistani women’s fashion',
        searchPlaceholder: 'Search brands',
        empty: 'No brands match “{{query}}”',
        openBrand: 'Open {{name}}',
      },

      products: {
        searchPlaceholder: 'Search {{brand}}',
        sort: 'Sort',
        filters: 'Filters',
        filtersCount: 'Filters ({{count}})',
        empty: {
          title: 'No products found',
          description: 'Try a different search or loosen your filters.',
          clearFilters: 'Clear filters',
        },
      },

      sort: {
        title: 'Sort by',
        options: {
          featured: 'Featured',
          priceAsc: 'Price: Low to High',
          priceDesc: 'Price: High to Low',
          newest: 'Newest First',
          oldest: 'Oldest First',
        },
      },

      filters: {
        title: 'Filters',
        priceRange: 'Price Range',
        priceSlider: 'Price range',
        minimum: 'Minimum',
        maximum: 'Maximum',
        type: 'Type / Category',
        all: 'All',
        availability: 'Availability',
        inStockOnly: 'In Stock Only',
        onSale: 'On Sale',
        onSaleOnly: 'Show Sale Items Only',
      },

      reel: {
        imageOf: 'Image {{index}} of {{count}}',
        details: 'Product Details',
        showMore: 'Show more',
        showLess: 'Show less',
        availableSizes: 'Available Sizes',
        fabric: 'Fabric',
        color: 'Colour',
        shareMessage: '{{name}} by {{brand}} — {{price}}\n{{link}}',
        menu: {
          openWebsite: 'Open {{brand}} website',
          showGuide: 'Show swipe guide',
        },
        guide: {
          title: 'How to browse',
          nextTitle: 'Swipe up',
          nextDescription: 'Next product',
          previousTitle: 'Swipe down',
          previousDescription: 'Previous product',
          imagesTitle: 'Swipe left / right',
          imagesDescription: 'Change image',
          detailsTitle: 'Drag the card up',
          detailsDescription: 'Open details',
          dismiss: 'Got it',
        },
      },
    },
  },
} as const;

export default en;
