export interface BrandClasses {
  text: string;
  textSoft: string;
  bg: string;
  bgHover: string;
  bgSoft: string;
  bgSoftHover: string;
  borderSoft: string;
  ring: string;
  borderFocus: string;
  accentText: string;
  hoverText: string;
  hoverBorder: string;
  bg500: string;
  text400: string;
  shadowGlow: string;
  gradientGlow: string;
  borderBrand: string;
  borderBrandSoft: string;
  ringBrand: string;
}

export function getBrandClasses(primaryColor?: string): BrandClasses {
  const color = primaryColor || 'indigo';
  const mapping: Record<string, BrandClasses> = {
    indigo: {
      text: 'text-indigo-600',
      textSoft: 'text-indigo-700',
      bg: 'bg-indigo-600',
      bgHover: 'hover:bg-indigo-700',
      bgSoft: 'bg-indigo-50',
      bgSoftHover: 'hover:bg-indigo-100/80',
      borderSoft: 'border-indigo-100',
      ring: 'focus:ring-indigo-100',
      borderFocus: 'focus:border-indigo-500',
      accentText: 'text-indigo-600',
      hoverText: 'hover:text-indigo-600',
      hoverBorder: 'hover:border-indigo-200',
      bg500: 'bg-indigo-500',
      text400: 'text-indigo-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(99,102,241,0.5)]',
      gradientGlow: 'from-slate-900 via-indigo-950 to-slate-900',
      borderBrand: 'border-indigo-500',
      borderBrandSoft: 'border-indigo-200',
      ringBrand: 'ring-indigo-500/20'
    },
    emerald: {
      text: 'text-emerald-600',
      textSoft: 'text-emerald-700',
      bg: 'bg-emerald-600',
      bgHover: 'hover:bg-emerald-700',
      bgSoft: 'bg-emerald-50',
      bgSoftHover: 'hover:bg-emerald-100/80',
      borderSoft: 'border-emerald-100',
      ring: 'focus:ring-emerald-100',
      borderFocus: 'focus:border-emerald-500',
      accentText: 'text-emerald-600',
      hoverText: 'hover:text-emerald-600',
      hoverBorder: 'hover:border-emerald-200',
      bg500: 'bg-emerald-500',
      text400: 'text-emerald-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      gradientGlow: 'from-slate-900 via-emerald-950 to-slate-900',
      borderBrand: 'border-emerald-500',
      borderBrandSoft: 'border-emerald-200',
      ringBrand: 'ring-emerald-500/20'
    },
    amber: {
      text: 'text-amber-600',
      textSoft: 'text-amber-700',
      bg: 'bg-amber-600',
      bgHover: 'hover:bg-amber-700',
      bgSoft: 'bg-amber-50',
      bgSoftHover: 'hover:bg-amber-100/80',
      borderSoft: 'border-amber-100',
      ring: 'focus:ring-amber-100',
      borderFocus: 'focus:border-amber-500',
      accentText: 'text-amber-600',
      hoverText: 'hover:text-amber-600',
      hoverBorder: 'hover:border-amber-200',
      bg500: 'bg-amber-500',
      text400: 'text-amber-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      gradientGlow: 'from-slate-900 via-amber-955 to-slate-900',
      borderBrand: 'border-amber-500',
      borderBrandSoft: 'border-amber-200',
      ringBrand: 'ring-amber-500/20'
    },
    rose: {
      text: 'text-rose-600',
      textSoft: 'text-rose-700',
      bg: 'bg-rose-600',
      bgHover: 'hover:bg-rose-700',
      bgSoft: 'bg-rose-50',
      bgSoftHover: 'hover:bg-rose-100/80',
      borderSoft: 'border-rose-100',
      ring: 'focus:ring-rose-100',
      borderFocus: 'focus:border-rose-500',
      accentText: 'text-rose-600',
      hoverText: 'hover:text-rose-600',
      hoverBorder: 'hover:border-rose-200',
      bg500: 'bg-rose-500',
      text400: 'text-rose-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(244,63,94,0.5)]',
      gradientGlow: 'from-slate-900 via-rose-955 to-slate-900',
      borderBrand: 'border-rose-500',
      borderBrandSoft: 'border-rose-200',
      ringBrand: 'ring-rose-500/20'
    },
    violet: {
      text: 'text-violet-600',
      textSoft: 'text-violet-700',
      bg: 'bg-violet-600',
      bgHover: 'hover:bg-violet-700',
      bgSoft: 'bg-violet-50',
      bgSoftHover: 'hover:bg-violet-100/80',
      borderSoft: 'border-violet-100',
      ring: 'focus:ring-violet-100',
      borderFocus: 'focus:border-violet-500',
      accentText: 'text-violet-600',
      hoverText: 'hover:text-violet-600',
      hoverBorder: 'hover:border-violet-200',
      bg500: 'bg-violet-500',
      text400: 'text-violet-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(139,92,246,0.5)]',
      gradientGlow: 'from-slate-900 via-violet-950 to-slate-900',
      borderBrand: 'border-violet-500',
      borderBrandSoft: 'border-violet-200',
      ringBrand: 'ring-violet-500/20'
    },
    cyan: {
      text: 'text-cyan-600',
      textSoft: 'text-cyan-700',
      bg: 'bg-cyan-600',
      bgHover: 'hover:bg-cyan-700',
      bgSoft: 'bg-cyan-50',
      bgSoftHover: 'hover:bg-cyan-100/80',
      borderSoft: 'border-cyan-100',
      ring: 'focus:ring-cyan-100',
      borderFocus: 'focus:border-cyan-500',
      accentText: 'text-cyan-600',
      hoverText: 'hover:text-cyan-600',
      hoverBorder: 'hover:border-cyan-200',
      bg500: 'bg-cyan-500',
      text400: 'text-cyan-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]',
      gradientGlow: 'from-slate-900 via-cyan-955 to-slate-900',
      borderBrand: 'border-cyan-500',
      borderBrandSoft: 'border-cyan-200',
      ringBrand: 'ring-cyan-500/20'
    }
  };
  return mapping[color] || mapping.indigo;
}
