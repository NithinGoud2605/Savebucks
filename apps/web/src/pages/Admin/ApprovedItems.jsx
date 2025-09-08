import React, { useMemo, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/Loader/Skeleton'
import { CheckCircleIcon, PencilSquareIcon, MagnifyingGlassIcon, TagIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

const SearchBar = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="w-5 h-5 text-secondary-400 absolute left-3 top-2.5" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  )
}

const EditRow = ({ item, type, onCancel, onSave }) => {
  const [form, setForm] = useState(() => ({
    title: item.title || '',
    description: item.description || '',
    merchant: item.merchant || '',
    price: item.price ?? '',
    original_price: item.original_price ?? '',
    coupon_code: item.coupon_code || '',
    coupon_type: item.coupon_type || '',
    image_url: item.image_url || '',
  }))

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="input" value={form.title} onChange={(e)=>update('title', e.target.value)} placeholder="Title" />
        <input className="input" value={form.merchant} onChange={(e)=>update('merchant', e.target.value)} placeholder="Merchant" />
        {type === 'deals' && (
          <>
            <input className="input" value={form.price} onChange={(e)=>update('price', e.target.value)} placeholder="Price" />
            <input className="input" value={form.original_price} onChange={(e)=>update('original_price', e.target.value)} placeholder="Original Price" />
          </>
        )}
        {type === 'coupons' && (
          <>
            <input className="input" value={form.coupon_code} onChange={(e)=>update('coupon_code', e.target.value)} placeholder="Coupon Code" />
            <input className="input" value={form.coupon_type} onChange={(e)=>update('coupon_type', e.target.value)} placeholder="Coupon Type" />
          </>
        )}
        <input className="input" value={form.image_url} onChange={(e)=>update('image_url', e.target.value)} placeholder="Image URL" />
      </div>
      <textarea className="input" rows={3} value={form.description} onChange={(e)=>update('description', e.target.value)} placeholder="Description" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={()=>onSave(form)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Save</button>
      </div>
    </div>
  )
}

const ItemRow = ({ item, type, onEdit }) => {
  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-secondary-100 rounded overflow-hidden flex items-center justify-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <TagIcon className="w-6 h-6 text-secondary-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-secondary-900 truncate">{item.title}</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3" /> Approved
            </span>
          </div>
          <div className="text-xs text-secondary-600 mb-2">
            {type === 'deals' ? item.merchant : item.companies?.name} • {new Date(item.created_at).toLocaleDateString()}
          </div>
          {type === 'deals' && (
            <div className="text-sm text-secondary-800 mb-2">
              {item.price != null && <span className="font-semibold">${item.price}</span>} {item.original_price && <span className="line-through text-secondary-500 ml-2">${item.original_price}</span>}
            </div>
          )}
          <div className="text-sm text-secondary-700 line-clamp-2">{item.description}</div>
        </div>
        <div className="flex-shrink-0">
          <button onClick={onEdit} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-secondary-50">
            <PencilSquareIcon className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

const ApprovedItems = () => {
  const [activeTab, setActiveTab] = useState('deals')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const debounced = useDebounce(search, 350)
  const qc = useQueryClient()

  const { data: deals, isLoading: loadingDeals } = useQuery({
    queryKey: ['admin', 'approved', 'deals', debounced, page],
    queryFn: () => api.listAdminDeals({ status: 'approved', search: debounced, page }),
    enabled: activeTab === 'deals'
  })

  const { data: coupons, isLoading: loadingCoupons } = useQuery({
    queryKey: ['admin', 'approved', 'coupons', debounced, page],
    queryFn: () => api.listAdminCoupons({ status: 'approved', search: debounced, page }),
    enabled: activeTab === 'coupons'
  })

  const updateDeal = useMutation({
    mutationFn: ({ id, updates }) => api.updateDealAdmin(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approved', 'deals'] })
      setEditingId(null)
    }
  })

  const updateCoupon = useMutation({
    mutationFn: ({ id, updates }) => api.updateCouponAdmin(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approved', 'coupons'] })
      setEditingId(null)
    }
  })

  const items = activeTab === 'deals' ? (deals || []) : (coupons || [])
  const loading = activeTab === 'deals' ? loadingDeals : loadingCoupons

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Approved Items</h2>
          <p className="text-secondary-600 mt-1">Search and edit approved deals and coupons</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex gap-2">
          <button onClick={()=>{setActiveTab('deals'); setEditingId(null)}} className={`px-3 py-2 rounded-lg border ${activeTab==='deals'?'border-primary-300 bg-primary-50 text-primary-700':'border-secondary-200 text-secondary-700'}`}>Deals</button>
          <button onClick={()=>{setActiveTab('coupons'); setEditingId(null)}} className={`px-3 py-2 rounded-lg border ${activeTab==='coupons'?'border-primary-300 bg-primary-50 text-primary-700':'border-secondary-200 text-secondary-700'}`}>Coupons</button>
        </div>
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder={`Search approved ${activeTab}`} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_,i)=>(<Skeleton key={i} className="h-24" />))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((it)=> (
            <div key={it.id} className="">
              {editingId === it.id ? (
                <EditRow
                  item={it}
                  type={activeTab}
                  onCancel={()=>setEditingId(null)}
                  onSave={(form)=> activeTab==='deals' ? updateDeal.mutate({ id: it.id, updates: form }) : updateCoupon.mutate({ id: it.id, updates: form })}
                />
              ) : (
                <ItemRow item={it} type={activeTab} onEdit={()=>setEditingId(it.id)} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-secondary-600">No approved {activeTab} found.</div>
      )}
    </div>
  )
}

export default ApprovedItems



