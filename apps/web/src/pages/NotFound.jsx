import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Search,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Tag,
  Building2
} from 'lucide-react'

// Animated floating shapes
const FloatingShape = ({ delay, x, y, size, color }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 ${color}`}
    style={{ width: size, height: size }}
    initial={{ x, y, scale: 0.8 }}
    animate={{
      x: [x, x + 50, x - 30, x],
      y: [y, y - 60, y + 40, y],
      scale: [0.8, 1.2, 0.9, 0.8],
    }}
    transition={{ duration: 20, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
)

// Quick Link Card
const QuickLink = ({ to, icon: Icon, title, description, color }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-violet-200 transition-all"
    >
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </motion.div>
  </Link>
)

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/50 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Floating background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape delay={0} x={-100} y={-100} size={500} color="bg-violet-400" />
        <FloatingShape delay={3} x={600} y={200} size={400} color="bg-purple-400" />
        <FloatingShape delay={5} x={200} y={400} size={350} color="bg-pink-400" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="mb-8"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotateZ: [0, -2, 2, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center"
          >
            <span className="text-[120px] md:text-[180px] font-black bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent leading-none">
              404
            </span>
          </motion.div>
        </motion.div>

        {/* Icon animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex w-20 h-20 bg-white rounded-2xl shadow-xl items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-violet-500" />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Oops! Page not found
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track!
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 hover:border-violet-300 text-slate-700 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </motion.button>

          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-violet-200 transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </motion.button>
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-slate-500 mb-4">Or explore these popular pages:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
            <QuickLink
              to="/"
              icon={Tag}
              title="Deals"
              description="Browse offers"
              color="bg-gradient-to-br from-violet-500 to-purple-600"
            />
            <QuickLink
              to="/companies"
              icon={Building2}
              title="Companies"
              description="Find merchants"
              color="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
            <QuickLink
              to="/categories"
              icon={ShoppingBag}
              title="Categories"
              description="Shop by type"
              color="bg-gradient-to-br from-amber-500 to-orange-600"
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound
