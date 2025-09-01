import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import * as Dialog from '@radix-ui/react-dialog'
import { Icon } from './Icon'
import { Button, IconButton } from './Button'

// Modal variants
const modalVariants = {
  center: 'flex items-center justify-center p-4',
  top: 'flex items-start justify-center pt-20 p-4',
  bottom: 'flex items-end justify-center pb-20 p-4'
}

const sizeVariants = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full'
}

// Modal overlay component
const ModalOverlay = ({ className, ...props }) => (
  <Dialog.Overlay asChild>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        className
      )}
      {...props}
    />
  </Dialog.Overlay>
)

// Modal content component
const ModalContent = ({
  children,
  className,
  size = 'md',
  position = 'center',
  ...props
}) => (
  <Dialog.Content asChild>
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? 100 : position === 'top' ? -100 : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? 100 : position === 'top' ? -100 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={clsx(
        'relative bg-white rounded-2xl shadow-2xl border border-secondary-200',
        'max-h-[85vh] overflow-hidden',
        'focus:outline-none',
        sizeVariants[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  </Dialog.Content>
)

// Main Modal component
export const Modal = ({
  open,
  onOpenChange,
  children,
  size = 'md',
  position = 'center',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <div className={clsx('fixed inset-0 z-50', modalVariants[position])}>
              <ModalOverlay />
              <ModalContent
                size={size}
                position={position}
                className={className}
                onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
                onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
              >
                {children}
              </ModalContent>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// Modal header component
export const ModalHeader = ({ children, className, showClose = true, onClose, ...props }) => (
  <div
    className={clsx(
      'flex items-center justify-between p-6 border-b border-secondary-200',
      className
    )}
    {...props}
  >
    <div className="flex-1">{children}</div>
    {showClose && (
      <Dialog.Close asChild>
        <IconButton
          icon="close"
          variant="ghost"
          size="sm"
          className="text-secondary-400 hover:text-secondary-600"
          onClick={onClose}
        />
      </Dialog.Close>
    )}
  </div>
)

// Modal title component
export const ModalTitle = ({ children, className, ...props }) => (
  <Dialog.Title asChild>
    <h2
      className={clsx(
        'text-lg font-semibold text-secondary-900',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  </Dialog.Title>
)

// Modal description component
export const ModalDescription = ({ children, className, ...props }) => (
  <Dialog.Description asChild>
    <p
      className={clsx(
        'text-sm text-secondary-600 mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  </Dialog.Description>
)

// Modal body component
export const ModalBody = ({ children, className, scrollable = true, ...props }) => (
  <div
    className={clsx(
      'p-6',
      scrollable && 'overflow-y-auto max-h-[60vh]',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

// Modal footer component
export const ModalFooter = ({ children, className, ...props }) => (
  <div
    className={clsx(
      'flex items-center justify-end gap-3 p-6 border-t border-secondary-200',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

// Confirmation modal component
export const ConfirmModal = ({
  open,
  onOpenChange,
  title = 'Confirm Action',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
  icon,
  ...props
}) => {
  const variantConfig = {
    danger: {
      icon: icon || 'alertTriangle',
      iconColor: 'text-danger-600',
      iconBg: 'bg-danger-100',
      confirmVariant: 'danger'
    },
    warning: {
      icon: icon || 'alertTriangle',
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-100',
      confirmVariant: 'warning'
    },
    info: {
      icon: icon || 'info',
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
      confirmVariant: 'primary'
    }
  }

  const config = variantConfig[variant] || variantConfig.info

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      {...props}
    >
      <ModalBody className="text-center">
        <div className={clsx('mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-4', config.iconBg)}>
          <Icon name={config.icon} size="lg" className={config.iconColor} />
        </div>
        
        <ModalTitle className="mb-2">{title}</ModalTitle>
        
        {description && (
          <ModalDescription className="mb-6">
            {description}
          </ModalDescription>
        )}
        
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              onCancel?.()
              onOpenChange(false)
            }}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={() => {
              onConfirm?.()
              onOpenChange(false)
            }}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  )
}

// Alert modal component
export const AlertModal = ({
  open,
  onOpenChange,
  title,
  description,
  buttonText = 'OK',
  variant = 'info',
  icon,
  ...props
}) => {
  const variantConfig = {
    success: {
      icon: icon || 'checkCircle',
      iconColor: 'text-success-600',
      iconBg: 'bg-success-100'
    },
    error: {
      icon: icon || 'xCircle',
      iconColor: 'text-danger-600',
      iconBg: 'bg-danger-100'
    },
    warning: {
      icon: icon || 'alertTriangle',
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-100'
    },
    info: {
      icon: icon || 'info',
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100'
    }
  }

  const config = variantConfig[variant] || variantConfig.info

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      {...props}
    >
      <ModalBody className="text-center">
        <div className={clsx('mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-4', config.iconBg)}>
          <Icon name={config.icon} size="lg" className={config.iconColor} />
        </div>
        
        <ModalTitle className="mb-2">{title}</ModalTitle>
        
        {description && (
          <ModalDescription className="mb-6">
            {description}
          </ModalDescription>
        )}
        
        <Button
          variant="primary"
          onClick={() => onOpenChange(false)}
        >
          {buttonText}
        </Button>
      </ModalBody>
    </Modal>
  )
}

// Form modal component
export const FormModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  ...props
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    >
      <form onSubmit={onSubmit}>
        <ModalHeader>
          <div>
            <ModalTitle>{title}</ModalTitle>
            {description && <ModalDescription>{description}</ModalDescription>}
          </div>
        </ModalHeader>
        
        <ModalBody>
          {children}
        </ModalBody>
        
        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {submitText}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default Modal
