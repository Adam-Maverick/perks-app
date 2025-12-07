'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEmployeeTaxContribution } from '@/hooks/queries/useEmployeeTaxContribution';
import { useUser } from '@clerk/nextjs';

interface TaxShieldWidgetProps {
  userId?: string;
}

export default function TaxShieldWidget({ userId }: TaxShieldWidgetProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { user } = useUser();
  const currentUserId = userId || user?.id;

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const { data, isLoading, error } = useEmployeeTaxContribution(currentUserId || '');

  const taxSavings = data?.taxSavings || 0;
  const totalSpent = data?.totalSpent || 0;

  // Animated counter using Framer Motion
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: prefersReducedMotion ? 0 : 2000,
    bounce: 0
  });
  const displayValue = useTransform(springValue, (latest: number) => `₦${latest.toFixed(2)}`);

  // Update animation when data changes
  useEffect(() => {
    if (taxSavings > 0) {
      motionValue.set(taxSavings);
    }
  }, [taxSavings, motionValue]);

  // Progress calculation (example: towards employer tax goal)
  const progressPercentage = Math.min((taxSavings / 10000) * 100, 100); // Example goal: ₦10,000

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-red-600">⚠️</span>
          </div>
          <h3 className="font-outfit text-lg font-semibold text-gray-900">
            Tax Savings
          </h3>
        </div>
        <p className="font-inter text-sm text-red-600">
          Unable to load tax savings data
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-electric-lime/10 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🛡️</span>
        </div>
        <div className="flex-1">
          <h3 className="font-outfit text-lg font-semibold text-gray-900">
            Tax Shield
          </h3>
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-xs text-gray-500 hover:text-gray-700 ml-2"
            aria-label="Show tax explanation"
          >
            ⓘ
          </button>
        </div>
      </div>

      {/* Animated Counter */}
      <motion.div
        className="font-inter text-3xl font-bold text-electric-lime mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {displayValue}
      </motion.div>

      <p className="font-inter text-sm text-gray-500 mb-4">
        You've helped save ₦{taxSavings.toFixed(2)} in taxes!
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <motion.div
          className="bg-electric-lime h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            delay: prefersReducedMotion ? 0 : 0.5
          }}
        />
      </div>
      <p className="font-inter text-xs text-gray-400">
        Progress towards employer tax goal
      </p>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-full left-0 mt-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 max-w-xs"
        >
          <p className="font-inter">
            Your employer gets 150% tax deduction on stipend spending under Nigeria Tax Act 2025.
            You've contributed ₦{totalSpent.toFixed(2)} to this savings!
          </p>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </motion.div>
      )}
    </div>
  );
}