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
        cancel: 'Cancel',
      },
      error: {
        title: 'Something went wrong',
        description: 'Check your connection and try again.',
      },
    },

    auth: {
      signIn: {
        title: 'Welcome back',
        subtitle: 'Sign in to keep the pieces you love, on any phone.',
        submit: 'Sign in',
        switch: 'New to ClothHub?',
        switchAction: 'Create an account',
      },
      signUp: {
        title: 'Create your account',
        subtitle: 'Save what you love from every brand, in one place.',
        submit: 'Create account',
        switch: 'Already have an account?',
        switchAction: 'Sign in',
      },
      fields: {
        name: 'Name',
        namePlaceholder: 'Your name',
        email: 'Email',
        emailPlaceholder: 'you@example.com',
        password: 'Password',
        passwordPlaceholder: 'At least 8 characters',
        showPassword: 'Show',
        hidePassword: 'Hide',
      },
      validation: {
        nameRequired: 'Enter your name.',
        emailInvalid: 'Enter a valid email address.',
        passwordTooShort: 'Use at least 8 characters.',
      },
      errors: {
        invalidCredentials: 'That email and password don’t match.',
        emailTaken: 'There’s already an account with this email. Sign in instead.',
        signInWithEmailInstead: 'You already have a ClothHub account with this email. Sign in with your email and password.',
        invalidEmail: 'Enter a valid email address.',
        passwordTooShort: 'Use at least 8 characters.',
        passwordTooLong: 'That password is too long.',
        tooManyAttempts: 'Too many attempts. Wait a minute and try again.',
        network: 'Couldn’t reach ClothHub. Check your connection.',
        generic: 'Something went wrong. Please try again.',
      },
      social: {
        apple: 'Continue with Apple',
        google: 'Continue with Google',
        or: 'or',
        comingSoonTitle: 'Coming soon',
        comingSoonMessage: 'Signing in with {{provider}} is on its way. Use your email for now.',
        appleName: 'Apple',
        googleName: 'Google',
      },
      legal: 'By continuing you agree to our <terms>Terms</terms> and <privacy>Privacy Policy</privacy>.',
      terms: 'Terms',
      privacy: 'Privacy Policy',
      account: {
        title: 'Account',
        open: 'Account',
        signedOutTitle: 'Your ClothHub',
        signedOutDescription: 'Sign in to save pieces from every brand and find them again on any phone.',
        signInCta: 'Sign in or create account',
        signOut: 'Sign out',
        deleteAccount: 'Delete account',
        deleteTitle: 'Delete your account?',
        deleteMessage: 'Your account and everything saved to it will be removed for good. This can’t be undone.',
        deleteConfirm: 'Delete',
        deleteFailed: 'We couldn’t delete your account. Check your connection and try again.',
        signOutFailed: 'We couldn’t sign you out. Check your connection and try again.',
      },
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
