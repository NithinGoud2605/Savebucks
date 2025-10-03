# 🎨 Filter System - Visual Guide

## Left Sidebar Layout

```
┌─────────────────────────────────────┐
│  ⚡ QUICK FILTERS                   │
├─────────────────────────────────────┤
│                                     │
│  📦 All Deals                       │
│  🔥 Trending                        │
│  📈 Hot Deals                       │
│  % 50% Off+                         │
│  💵 Under $10                       │
│  💵 Under $25                       │
│  💵 Under $50                       │
│  🚚 Free Shipping                   │
│  ⏰ Ending Soon                     │
│  ✨ New Arrivals                    │
│  🎁 Free Stuff                      │
│  ⚡ Flash Sales                     │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🔲 CATEGORIES                      │
├─────────────────────────────────────┤
│                                     │
│  📱 Electronics                     │
│  👗 Fashion                         │
│  🏡 Home & Garden                   │
│  ✨ Beauty & Health                 │
│  🎮 Toys & Games                    │
│  💪 Sports & Fitness                │
│  📚 Books & Media                   │
│  🚗 Automotive                      │
│  🍔 Food & Grocery                  │
│  👶 Baby & Kids                     │
│  🐾 Pet Supplies                    │
│  📦 Office Supplies                 │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🔖 My Saved Items                  │
│  (Gradient Amber Button)            │
└─────────────────────────────────────┘
```

## Active State Example

### When "Trending" is selected:

```
┌─────────────────────────────────────┐
│  📦 All Deals                       │  ← Gray hover
│  ┌───────────────────────────────┐ │
│  │ 🔥 Trending              ✓    │ │  ← Gradient + Checkmark
│  └───────────────────────────────┘ │
│  📈 Hot Deals                       │  ← Gray hover
│  % 50% Off+                         │
└─────────────────────────────────────┘
```

**Visual Properties:**
- **Background:** Gradient from mint-500 to emerald-600
- **Text:** White
- **Icon:** White
- **Badge:** White checkmark in translucent circle
- **Shadow:** Medium shadow
- **Scale:** 1.02x (slightly enlarged)

### When "Electronics" category is selected:

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐ │
│  │ 📱 Electronics           ✓    │ │  ← Active
│  └───────────────────────────────┘ │
│  👗 Fashion                         │
│  🏡 Home & Garden                   │
└─────────────────────────────────────┘
```

## Feed Header with Active Filter

When filter is active, a banner appears at the top of the feed:

```
┌─────────────────────────────────────────────────────┐
│  Showing: Trending                       (23 results)│ X │
│  [Mint gradient background with close button]       │
└─────────────────────────────────────────────────────┘
```

## Color Scheme

### Filter Icons
- 📦 All Deals - Gray (text-gray-600)
- 🔥 Trending - Orange (text-orange-600)
- 📈 Hot Deals - Red (text-red-600)
- % 50% Off+ - Red (text-red-600)
- 💵 Price filters - Green (text-green-600)
- 🚚 Free Shipping - Blue (text-blue-600)
- ⏰ Ending Soon - Purple (text-purple-600)
- ✨ New Arrivals - Purple (text-purple-600)
- 🎁 Free Stuff - Pink (text-pink-600)
- ⚡ Flash Sales - Yellow (text-yellow-600)

### Category Icons
- 📱 Electronics - Blue (text-blue-600)
- 👗 Fashion - Pink (text-pink-600)
- 🏡 Home & Garden - Green (text-green-600)
- ✨ Beauty & Health - Purple (text-purple-600)
- 🎮 Toys & Games - Orange (text-orange-600)
- 💪 Sports & Fitness - Red (text-red-600)
- 📚 Books & Media - Indigo (text-indigo-600)
- 🚗 Automotive - Gray (text-gray-600)
- 🍔 Food & Grocery - Yellow (text-yellow-600)
- 👶 Baby & Kids - Pink Light (text-pink-400)
- 🐾 Pet Supplies - Amber (text-amber-600)
- 📦 Office Supplies - Slate (text-slate-600)

## Interactive States

### Default (Inactive)
```css
background: transparent
text: gray-700
icon: colored (per category)
hover: bg-gray-50, text-mint-600
```

### Active
```css
background: gradient(mint-500 → emerald-600)
text: white
icon: white
shadow: medium
scale: 1.02
checkmark: visible
```

### Hover (on inactive)
```css
background: gray-50
text: mint-600
icon: colored (brighter)
transition: 200ms
```

## Spacing & Layout

```
Sidebar padding: 8px (p-2)
Section spacing: 16px (space-y-4)
Card padding: 12px (p-3)
Button spacing: 4px (space-y-1)
Button padding: 10px 12px (px-2.5 py-1.5)
Icon size: 14px (w-3.5 h-3.5)
Text size: 12px (text-xs)
```

## Responsive Behavior

### Desktop (lg+)
- Sidebar visible
- Sticky positioning
- Full filter/category lists
- 2-column feed grid

### Mobile
- Sidebar hidden
- Filter pills at top of feed
- Horizontal scroll
- 1-column feed grid

## Animation Details

### Scale on Active
```css
transform: scale(1.02)
transition: all 200ms
```

### Hover Effect
```css
transform: translateY(-1px)
box-shadow: 0 2px 4px rgba(0,0,0,0.1)
transition: all 200ms
```

### Checkmark Appearance
```css
opacity: 0 → 1
scale: 0.8 → 1
transition: 150ms ease-out
```

## Accessibility

- ✅ Full keyboard navigation
- ✅ ARIA labels on all buttons
- ✅ Focus visible states
- ✅ Color contrast WCAG AA compliant
- ✅ Screen reader friendly
- ✅ Clear active state indicators

## Example User Journeys

### Journey 1: Find Cheap Electronics
1. User clicks "Electronics" category
2. Feed shows only electronics deals
3. User clicks "Under $25" filter
4. Feed shows electronics under $25
5. Banner shows: "Showing: Electronics (12 results)"

### Journey 2: Find Flash Sales
1. User clicks "Flash Sales" filter
2. Feed shows deals with 40%+ discount expiring soon
3. Sorted by discount percentage (highest first)
4. Banner shows: "Showing: Flash Sales (8 results)"

### Journey 3: Browse Trending
1. User clicks "Trending" filter
2. Feed shows deals from last 7 days
3. Sorted by engagement (upvotes - downvotes)
4. High engagement items appear first
5. Banner shows: "Showing: Trending (23 results)"

