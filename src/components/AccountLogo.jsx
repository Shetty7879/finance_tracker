import React, { useState } from 'react';
import { ACCOUNT_TYPE_META, detectBankLogo } from '../constants/finance';
import DynamicIcon from './DynamicIcon';

/**
 * AccountLogo Component
 * Renders high-quality bank/wallet logo (SBI, Slice, etc.) with automatic name detection,
 * or falls back cleanly to the themed category/type icon.
 *
 * @param {Object} props
 * @param {Object} [props.account] - Account object { name, type, logo }
 * @param {string} [props.name] - Account name
 * @param {string} [props.type] - Account type ('Bank Account' | 'Cash' | 'UPI' | 'Wallet')
 * @param {string} [props.logo] - Explicit logo URL (e.g. '/logos/sbi.png')
 * @param {'xs'|'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.className]
 */
export default function AccountLogo({
  account,
  name: nameProp,
  type: typeProp,
  logo: logoProp,
  size = 'md',
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  const accountName = account?.name || account?.account_name || nameProp || '';
  const accountType = account?.type || account?.account_type || typeProp || 'Bank Account';
  const explicitLogo = account?.logo || logoProp;

  // Determine logo URL: explicit logo first, then auto-detect from name
  const logoUrl = explicitLogo || detectBankLogo(accountName);

  const meta = ACCOUNT_TYPE_META[accountType] || ACCOUNT_TYPE_META['Bank Account'];

  // Dimension mapping
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg text-xs',
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  }[size] || 'w-10 h-10 rounded-xl';

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size] || 'w-5 h-5';

  if (logoUrl && !imageError) {
    return (
      <div
        className={`${sizeClasses} overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-subtle p-1.5 flex-shrink-0 transition-transform ${className}`}
        title={accountName}
      >
        <img
          src={logoUrl}
          alt={accountName || 'Bank Logo'}
          className="w-full h-full object-contain rounded-md"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Graceful fallback to gradient type icon
  return (
    <div
      className={`${sizeClasses} flex items-center justify-center bg-gradient-to-tr ${meta.color} text-white shadow-subtle flex-shrink-0 ${className}`}
      title={accountName}
    >
      <DynamicIcon name={meta.icon} className={iconSizes} />
    </div>
  );
}

