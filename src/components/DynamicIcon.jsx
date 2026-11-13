import React from 'react';
import {
  Utensils,
  Compass,
  ShoppingBag,
  Home,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Tag,
  Building2,
  Banknote,
  Smartphone,
  Wallet,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

const iconMap = {
  Utensils,
  Compass,
  ShoppingBag,
  Home,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Tag,
  Building2,
  Banknote,
  Smartphone,
  Wallet,
  CreditCard,
};

export default function DynamicIcon({ name, className = 'w-5 h-5' }) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} />;
}

