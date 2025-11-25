'use client';

/**
 * Registration Page UI - Sprint 3
 * Multi-step registration flow
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useIndustryStore, getIndustryConfig, Industry, INDUSTRY_CONFIGS } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';

type RegistrationStep = 'account' | 'profile' | 'industry' | 'complete';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  industry: Industry;
}

export function RegisterPage() {
  const { detectedIndustry, setSelectedIndustry } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const [step, setStep] = useState<RegistrationStep>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    role: '',
    industry: detectedIndustry,
  });

  const isRTL = locale === 'ar';

  const steps: { key: RegistrationStep; label: string; labelAr: string }[] = [
    { key: 'account', label: 'Account', labelAr: 'الحساب' },
    { key: 'profile', label: 'Profile', labelAr: 'الملف الشخصي' },
    { key: 'industry', label: 'Industry', labelAr: 'الصناعة' },
    { key: 'complete', label: 'Complete', labelAr: 'اكتمال' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const handleNext = () => {
    const stepIndex = steps.findIndex(s => s.key === step);
    if (stepIndex < steps.length - 1) {
      setStep(steps[stepIndex + 1].key);
    }
  };

  const handleBack = () => {
    const stepIndex = steps.findIndex(s => s.key === step);
    if (stepIndex > 0) {
      setStep(steps[stepIndex - 1].key);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'account') {
      if (data.password !== data.confirmPassword) {
        setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
        return;
      }
      handleNext();
    } else if (step === 'profile') {
      handleNext();
    } else if (step === 'industry') {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
      handleNext();
    }
  };

  const handleIndustrySelect = (industry: Industry) => {
    setData({ ...data, industry });
    setSelectedIndustry(industry);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'account':
        return (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={data.confirmPassword}
                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
              />
            </div>
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الاسم الأول' : 'First Name'}
                </label>
                <input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => setData({ ...data, firstName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'اسم العائلة' : 'Last Name'}
                </label>
                <input
                  type="text"
                  value={data.lastName}
                  onChange={(e) => setData({ ...data, lastName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'الشركة' : 'Company'}
              </label>
              <input
                type="text"
                value={data.company}
                onChange={(e) => setData({ ...data, company: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'الدور' : 'Role'}
              </label>
              <select
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
              >
                <option value="">{isRTL ? 'اختر دورك' : 'Select your role'}</option>
                <option value="sales">{isRTL ? 'المبيعات' : 'Sales'}</option>
                <option value="marketing">{isRTL ? 'التسويق' : 'Marketing'}</option>
                <option value="executive">{isRTL ? 'تنفيذي' : 'Executive'}</option>
                <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
          </motion.div>
        );

      case 'industry':
        return (
          <motion.div
            key="industry"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="text-gray-600 mb-4">
              {isRTL ? 'اختر صناعتك للحصول على تجربة مخصصة' : 'Select your industry for a personalized experience'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(INDUSTRY_CONFIGS) as Industry[])
                .filter(i => i !== 'general')
                .map((industry) => {
                  const config = INDUSTRY_CONFIGS[industry];
                  const isSelected = data.industry === industry;
                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => handleIndustrySelect(industry)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-current bg-current/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={isSelected ? { borderColor: config.primaryColor, color: config.primaryColor } : undefined}
                    >
                      <span className="text-2xl mb-2 block">{config.icon}</span>
                      <span className="font-medium text-gray-900 block">
                        {isRTL ? config.nameAr : config.name}
                      </span>
                    </button>
                  );
                })}
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-6"
              style={{ backgroundColor: `${industryConfig.primaryColor}20` }}
            >
              {industryConfig.icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isRTL ? 'مرحباً بك في PremiumRadar!' : 'Welcome to PremiumRadar!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isRTL
                ? 'تم إنشاء حسابك بنجاح'
                : 'Your account has been created successfully'}
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
              }}
            >
              {isRTL ? 'ابدأ الآن' : 'Get Started'}
            </Link>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: industryConfig.primaryColor }}>
            PremiumRadar
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, index) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      index <= currentStepIndex
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    style={
                      index <= currentStepIndex
                        ? { backgroundColor: industryConfig.primaryColor }
                        : undefined
                    }
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-500 hidden sm:block">
                    {isRTL ? s.labelAr : s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStepIndex ? '' : 'bg-gray-200'
                    }`}
                    style={
                      index < currentStepIndex
                        ? { backgroundColor: industryConfig.primaryColor }
                        : undefined
                    }
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {step !== 'complete' && (
              <div className="flex gap-4 mt-6">
                {step !== 'account' && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    {isRTL ? 'رجوع' : 'Back'}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50 hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isRTL ? 'جاري المعالجة...' : 'Processing...'}
                    </span>
                  ) : step === 'industry' ? (
                    isRTL ? 'إنشاء الحساب' : 'Create Account'
                  ) : (
                    isRTL ? 'التالي' : 'Next'
                  )}
                </button>
              </div>
            )}
          </form>

          {step === 'account' && (
            <p className="mt-6 text-center text-gray-600">
              {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: industryConfig.primaryColor }}
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
