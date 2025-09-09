import React from 'react'
import { clsx } from 'clsx'
import * as LucideIcons from 'lucide-react'
import * as HeroIcons from '@heroicons/react/24/outline'
import * as HeroIconsSolid from '@heroicons/react/24/solid'

// Icon mapping for better organization and consistency
const iconMap = {
  // Navigation & Actions
  home: LucideIcons.Home,
  search: LucideIcons.Search,
  menu: LucideIcons.Menu,
  close: LucideIcons.X,
  x: LucideIcons.X, // Alias for 'x'
  chevronDown: LucideIcons.ChevronDown,
  chevronUp: LucideIcons.ChevronUp,
  chevronLeft: LucideIcons.ChevronLeft,
  chevronRight: LucideIcons.ChevronRight,
  arrowUp: LucideIcons.ArrowUp,
  arrowDown: LucideIcons.ArrowDown,
  arrowLeft: LucideIcons.ArrowLeft,
  arrowRight: LucideIcons.ArrowRight,
  externalLink: LucideIcons.ExternalLink,
  
  // User & Account
  user: LucideIcons.User,
  users: LucideIcons.Users,
  userPlus: LucideIcons.UserPlus,
  userCheck: LucideIcons.UserCheck,
  login: LucideIcons.LogIn,
  logout: LucideIcons.LogOut,
  settings: LucideIcons.Settings,
  profile: LucideIcons.UserCircle,
  
  // Shopping & Commerce
  shoppingBag: LucideIcons.ShoppingBag,
  shoppingCart: LucideIcons.ShoppingCart,
  creditCard: LucideIcons.CreditCard,
  dollarSign: LucideIcons.DollarSign,
  tag: LucideIcons.Tag,
  tags: LucideIcons.Tags,
  percent: LucideIcons.Percent,
  gift: LucideIcons.Gift,
  ticket: LucideIcons.Ticket,
  store: LucideIcons.Store,
  hash: LucideIcons.Hash,
  package: LucideIcons.Package,
  
  // Content & Media
  image: LucideIcons.Image,
  file: LucideIcons.File,
  fileText: LucideIcons.FileText,
  download: LucideIcons.Download,
  upload: LucideIcons.Upload,
  link: LucideIcons.Link,
  copy: LucideIcons.Copy,
  
  // Communication & Social
  heart: LucideIcons.Heart,
  heartFilled: HeroIconsSolid.HeartIcon,
  star: LucideIcons.Star,
  starFilled: HeroIconsSolid.StarIcon,
  thumbsUp: LucideIcons.ThumbsUp,
  thumbsDown: LucideIcons.ThumbsDown,
  messageCircle: LucideIcons.MessageCircle,
  share: LucideIcons.Share,
  bookmark: LucideIcons.Bookmark,
  bookmarkFilled: HeroIconsSolid.BookmarkIcon,
  bell: LucideIcons.Bell,
  bellFilled: HeroIconsSolid.BellIcon,
  
  // Status & Feedback
  check: LucideIcons.Check,
  checkCircle: LucideIcons.CheckCircle,
  alertCircle: LucideIcons.AlertCircle,
  alertTriangle: LucideIcons.AlertTriangle,
  info: LucideIcons.Info,
  xCircle: LucideIcons.XCircle,
  loader: LucideIcons.Loader2,
  
  // Time & Calendar
  clock: LucideIcons.Clock,
  calendar: LucideIcons.Calendar,
  calendarDays: LucideIcons.CalendarDays,
  
  // Layout & Organization
  grid: LucideIcons.Grid3X3,
  list: LucideIcons.List,
  filter: LucideIcons.Filter,
  sort: LucideIcons.ArrowUpDown,
  eye: LucideIcons.Eye,
  eyeOff: LucideIcons.EyeOff,
  
  // Business & Analytics
  trendingUp: LucideIcons.TrendingUp,
  trendingDown: LucideIcons.TrendingDown,
  barChart: LucideIcons.BarChart3,
  pieChart: LucideIcons.PieChart,
  activity: LucideIcons.Activity,
  zap: LucideIcons.Zap,
  
  // Special Effects
  fire: HeroIconsSolid.FireIcon,
  sparkles: LucideIcons.Sparkles,
  trophy: LucideIcons.Trophy,
  crown: LucideIcons.Crown,
  lightbulb: LucideIcons.Lightbulb,
  
  // System & Technical
  refresh: LucideIcons.RefreshCw,
  database: LucideIcons.Database,
  server: LucideIcons.Server,
  wifi: LucideIcons.Wifi,
  wifiOff: LucideIcons.WifiOff,
  
  // Miscellaneous
  plus: LucideIcons.Plus,
  minus: LucideIcons.Minus,
  edit: LucideIcons.Edit,
  trash: LucideIcons.Trash2,
  more: LucideIcons.MoreHorizontal,
  moreVertical: LucideIcons.MoreVertical,
}

// Size variants
const sizeVariants = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
}

// Color variants
const colorVariants = {
  current: 'text-current',
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  danger: 'text-danger-600',
  white: 'text-white',
  muted: 'text-secondary-400',
}

export function Icon({ 
  name, 
  size = 'md', 
  color = 'current', 
  className, 
  animate = false,
  ...props 
}) {
  const IconComponent = iconMap[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(iconMap))
    return null
  }

  return (
    <IconComponent
      className={clsx(
        sizeVariants[size],
        colorVariants[color],
        animate && 'transition-all duration-200',
        className
      )}
      {...props}
    />
  )
}

// Specialized icon components for common use cases
export function LoadingIcon({ size = 'md', className, ...props }) {
  return (
    <Icon
      name="loader"
      size={size}
      className={clsx('animate-spin', className)}
      {...props}
    />
  )
}

export function StatusIcon({ status, size = 'md', className, ...props }) {
  const statusIcons = {
    success: { name: 'checkCircle', color: 'success' },
    error: { name: 'xCircle', color: 'danger' },
    warning: { name: 'alertTriangle', color: 'warning' },
    info: { name: 'info', color: 'primary' },
    loading: { name: 'loader', color: 'primary' },
  }

  const config = statusIcons[status] || statusIcons.info

  return (
    <Icon
      name={config.name}
      size={size}
      color={config.color}
      animate={status === 'loading'}
      className={clsx(
        status === 'loading' && 'animate-spin',
        className
      )}
      {...props}
    />
  )
}

// Interactive icon button component
export function IconButton({ 
  icon, 
  size = 'md', 
  variant = 'ghost',
  color = 'current',
  disabled = false,
  loading = false,
  children,
  className,
  ...props 
}) {
  const variants = {
    solid: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md',
    outline: 'border border-secondary-300 bg-white hover:bg-secondary-50 shadow-sm hover:shadow-md',
    ghost: 'hover:bg-secondary-100 hover:text-secondary-900',
    soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4',
  }

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingIcon size={size} />
      ) : (
        <Icon name={icon} size={size} color={color} />
      )}
      {children && <span className="ml-2">{children}</span>}
    </button>
  )
}

export default Icon
