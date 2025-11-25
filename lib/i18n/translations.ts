/**
 * i18n Translations - English/Arabic
 * Sprint 1: English/Arabic Toggle
 */

export type Locale = 'en' | 'ar';

export const translations = {
  en: {
    // Landing
    hero: {
      title: 'PremiumRadar',
      subtitle: 'AI-Powered Sales Intelligence',
      description: 'Discover, score, and engage high-value leads with AI-powered intelligence.',
      cta: {
        primary: 'Start Free',
        secondary: 'Watch Demo',
      },
    },
    orb: {
      greeting: 'Hello! I\'m your AI assistant.',
      prompt: 'What industry are you in?',
      placeholder: 'Tell me about your business...',
      thinking: 'Analyzing...',
      detected: 'I see you\'re in {industry}!',
      suggestions: [
        'Banking & Finance',
        'Healthcare',
        'Technology',
        'Retail',
      ],
    },
    features: {
      discovery: {
        title: 'Smart Discovery',
        description: 'AI-powered lead discovery across multiple sources with region-aware filtering.',
      },
      scoring: {
        title: 'Intelligent Scoring',
        description: 'Q/T/L/E scoring with regional modifiers for UAE, India, and US markets.',
      },
      assistant: {
        title: 'AI Assistant',
        description: 'Conversational interface with cognitive intelligence integration.',
      },
    },
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      docs: 'Docs',
      login: 'Login',
      signup: 'Sign Up',
    },
    footer: {
      copyright: '© 2024 PremiumRadar. All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    // Auth
    auth: {
      login: {
        title: 'Welcome back',
        subtitle: 'Sign in to your account',
        email: 'Email',
        password: 'Password',
        submit: 'Sign In',
        forgot: 'Forgot password?',
        noAccount: 'Don\'t have an account?',
        signUp: 'Sign up',
        magicLink: 'Send Magic Link',
      },
      signup: {
        title: 'Get started',
        subtitle: 'Create your account',
        name: 'Full Name',
        email: 'Email',
        password: 'Password',
        confirm: 'Confirm Password',
        submit: 'Create Account',
        hasAccount: 'Already have an account?',
        signIn: 'Sign in',
      },
    },
    // Dashboard
    dashboard: {
      welcome: 'Welcome back',
      quickActions: 'Quick Actions',
      recentActivity: 'Recent Activity',
      discover: 'Discover',
      enrich: 'Enrich',
      rank: 'Rank',
      outreach: 'Outreach',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try again',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search...',
    },
  },
  ar: {
    // Landing
    hero: {
      title: 'بريميوم رادار',
      subtitle: 'ذكاء المبيعات المدعوم بالذكاء الاصطناعي',
      description: 'اكتشف وقيّم وتفاعل مع العملاء المحتملين ذوي القيمة العالية باستخدام الذكاء الاصطناعي.',
      cta: {
        primary: 'ابدأ مجاناً',
        secondary: 'شاهد العرض',
      },
    },
    orb: {
      greeting: 'مرحباً! أنا مساعدك الذكي.',
      prompt: 'ما هي صناعتك؟',
      placeholder: 'أخبرني عن عملك...',
      thinking: 'جاري التحليل...',
      detected: 'أرى أنك في مجال {industry}!',
      suggestions: [
        'البنوك والتمويل',
        'الرعاية الصحية',
        'التكنولوجيا',
        'التجزئة',
      ],
    },
    features: {
      discovery: {
        title: 'اكتشاف ذكي',
        description: 'اكتشاف العملاء المحتملين بالذكاء الاصطناعي مع تصفية حسب المنطقة.',
      },
      scoring: {
        title: 'تقييم ذكي',
        description: 'تقييم Q/T/L/E مع معدّلات إقليمية للإمارات والهند وأمريكا.',
      },
      assistant: {
        title: 'مساعد ذكي',
        description: 'واجهة محادثة مع تكامل الذكاء المعرفي.',
      },
    },
    nav: {
      features: 'المميزات',
      pricing: 'الأسعار',
      docs: 'المستندات',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
    },
    footer: {
      copyright: '© 2024 بريميوم رادار. جميع الحقوق محفوظة.',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الخدمة',
    },
    // Auth
    auth: {
      login: {
        title: 'مرحباً بعودتك',
        subtitle: 'سجّل الدخول إلى حسابك',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        submit: 'تسجيل الدخول',
        forgot: 'نسيت كلمة المرور؟',
        noAccount: 'ليس لديك حساب؟',
        signUp: 'إنشاء حساب',
        magicLink: 'إرسال رابط سحري',
      },
      signup: {
        title: 'ابدأ الآن',
        subtitle: 'أنشئ حسابك',
        name: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirm: 'تأكيد كلمة المرور',
        submit: 'إنشاء حساب',
        hasAccount: 'لديك حساب بالفعل؟',
        signIn: 'تسجيل الدخول',
      },
    },
    // Dashboard
    dashboard: {
      welcome: 'مرحباً بعودتك',
      quickActions: 'إجراءات سريعة',
      recentActivity: 'النشاط الأخير',
      discover: 'اكتشف',
      enrich: 'إثراء',
      rank: 'ترتيب',
      outreach: 'تواصل',
    },
    // Common
    common: {
      loading: 'جاري التحميل...',
      error: 'حدث خطأ ما',
      retry: 'حاول مرة أخرى',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      search: 'بحث...',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
