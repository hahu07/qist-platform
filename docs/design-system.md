# QistFi Design System

Complete design guidelines for the QistFi platform, ensuring consistency across all interfaces and maintaining Islamic aesthetic principles.

---

## 🎨 Color Palette

### **Primary Colors**

#### **Emerald Green** (Islamic prosperity, trust, growth)
**Use for**: CTAs, primary actions, success states

```css
--color-primary-50: #ecfdf5
--color-primary-100: #d1fae5
--color-primary-200: #a7f3d0
--color-primary-300: #6ee7b7
--color-primary-400: #34d399
--color-primary-500: #10b981  /* Main brand color */
--color-primary-600: #059669
--color-primary-700: #047857
--color-primary-800: #065f46
--color-primary-900: #064e3b
```

#### **Deep Blue** (Trust, stability, wisdom)
**Use for**: Headers, navigation, secondary actions

```css
--color-secondary-50: #eff6ff
--color-secondary-500: #3b82f6  /* Main secondary */
--color-secondary-900: #1e3a8a
```

---

### **Feature-Specific Colors**

#### **Profit Pool** - Teal
**Use for**: All profit-oriented investment features

```css
--color-profit-50: #f0fdfa
--color-profit-500: #14b8a6   /* Main profit color */
--color-profit-900: #134e4a
```

**Example usage**:
- Investment cards
- Portfolio growth charts
- Profit distribution badges
- ROI indicators

#### **Waqf Pool** - Purple
**Use for**: All Waqf endowment and social impact features

```css
--color-waqf-50: #faf5ff
--color-waqf-500: #a855f7     /* Main waqf color */
--color-waqf-900: #581c87
```

**Example usage**:
- Waqf creation wizards
- Social enterprise cards
- Impact metrics
- Beneficiary stories

#### **Gold Accent**
**Use for**: Premium features, highlights, heritage elements

```css
--color-accent-400: #facc15
--color-accent-600: #ca8a04
```

---

### **Semantic Colors**

#### **Success** (Matches primary green)
```css
--color-success-500: #10b981
```
Use for: Approvals, completed actions, positive outcomes

#### **Warning** - Amber
```css
--color-warning-500: #f59e0b
```
Use for: Pending states, caution messages, review needed

#### **Error** - Red
```css
--color-error-500: #ef4444
```
Use for: Rejections, errors, critical alerts

#### **Info** - Sky Blue
```css
--color-info-500: #0ea5e9
```
Use for: Informational messages, tips, guidance

---

### **Neutrals** - Slate
**Use for**: Text, backgrounds, borders, surfaces

```css
/* Light Mode */
--color-neutral-50: #f8fafc    /* Subtle backgrounds */
--color-neutral-100: #f1f5f9   /* Card backgrounds */
--color-neutral-200: #e2e8f0   /* Borders */
--color-neutral-600: #475569   /* Secondary text */
--color-neutral-900: #0f172a   /* Primary text */

/* Dark Mode */
--color-neutral-950: #020617   /* Dark bg primary */
--color-neutral-900: #0f172a   /* Dark surfaces */
--color-neutral-800: #1e293b   /* Dark elevated */
--color-neutral-400: #94a3b8   /* Dark secondary text */
--color-neutral-50: #f8fafc    /* Dark primary text */
```

---

## 🖋️ Typography

### **Font Families**

#### **Sans Serif** (Inter) - Body Text
```css
font-family: var(--font-sans)
```
**Use for**: 
- Paragraphs
- Form inputs
- Button text
- UI labels
- General content

**Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

#### **Display** (Poppins) - Headings
```css
font-family: var(--font-display)
```
**Use for**:
- Page titles (h1, h2)
- Section headings
- Hero text
- Marketing copy
- CTAs

**Weights**: 600 (semibold), 700 (bold)

#### **Arabic** (Tajawal)
```css
font-family: var(--font-arabic)
```
**Use for**:
- Arabic content
- RTL layouts
- Islamic terms (Mudarabah, Waqf, etc.)

**Weights**: 400 (regular), 700 (bold)

#### **Monospace** (JetBrains Mono)
```css
font-family: var(--font-mono)
```
**Use for**:
- Transaction IDs
- Amounts/numbers
- Code snippets
- Contract references
- Wallet addresses

---

### **Type Scale**

#### **Mobile-First Responsive**

```css
/* Headings */
h1: text-3xl md:text-5xl      /* 30px → 48px */
h2: text-2xl md:text-4xl      /* 24px → 36px */
h3: text-xl md:text-3xl       /* 20px → 30px */
h4: text-lg md:text-2xl       /* 18px → 24px */
h5: text-base md:text-xl      /* 16px → 20px */
h6: text-sm md:text-lg        /* 14px → 18px */

/* Body Text */
Large: text-lg                 /* 18px */
Base: text-base                /* 16px */
Small: text-sm                 /* 14px */
Tiny: text-xs                  /* 12px */
```

#### **Font Weights**

```css
Light: font-light (300)
Regular: font-normal (400)
Medium: font-medium (500)
Semibold: font-semibold (600)
Bold: font-bold (700)
```

#### **Line Heights**

```css
Tight: leading-tight (1.25)    /* Headings */
Normal: leading-normal (1.5)   /* Body text */
Relaxed: leading-relaxed (1.625) /* Long-form content */
Loose: leading-loose (2)       /* Spaced content */
```

---

## 📱 Mobile-First Responsive Design

### **Breakpoints**

```css
/* Tailwind default breakpoints */
sm: 640px    /* Small tablets */
md: 768px    /* Tablets */
lg: 1024px   /* Laptops */
xl: 1280px   /* Desktops */
2xl: 1536px  /* Large screens */
```

### **Container Padding**

```css
Mobile (< 640px): px-4    /* 16px */
Tablet (≥ 640px): px-6    /* 24px */
Desktop (≥ 1024px): px-8  /* 32px */
```

### **Touch Targets**

**Minimum Size**: 44x44px (Apple HIG / Material Design)

```tsx
/* All interactive elements */
<button className="min-h-[44px] min-w-[44px]">
```

### **Safe Areas** (Mobile notches, home indicators)

Automatically handled in `globals.css`:
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

---

## 🎭 Dark Mode

### **Implementation**

#### **System Preference** (Default)
Automatically follows user's OS setting

#### **Manual Toggle**
Use `ThemeToggle` component:
```tsx
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />
```

#### **Programmatic Control**
```tsx
import { useTheme } from "@/components/theme-provider";

const { theme, setTheme } = useTheme();
setTheme("dark"); // "light" | "dark" | "system"
```

### **Color Usage**

```tsx
/* Text */
className="text-neutral-900 dark:text-neutral-50"

/* Backgrounds */
className="bg-white dark:bg-neutral-950"

/* Borders */
className="border-neutral-200 dark:border-neutral-800"

/* Surfaces (cards, modals) */
className="bg-neutral-50 dark:bg-neutral-900"
```

---

## 🎨 Neuomorphic Design System

QistFi's signature aesthetic combining flat design with subtle 3D effects.

### **Standard Neomorph**

```tsx
<div className="neomorph bg-white dark:bg-neutral-900 p-6 rounded-xl">
  Content
</div>
```

**Effect**:
- Light: Black border + black shadow
- Dark: Primary green border + green glow shadow
- Active: Translates element, removes shadow

### **Profit Pool Variant**

```tsx
<div className="neomorph-profit bg-white dark:bg-neutral-900 p-6 rounded-xl">
  Profit content
</div>
```

**Effect**: Teal border + teal shadow

### **Waqf Pool Variant**

```tsx
<div className="neomorph-waqf bg-white dark:bg-neutral-900 p-6 rounded-xl">
  Waqf content
</div>
```

**Effect**: Purple border + purple shadow

### **Manual Implementation**

```tsx
<div className="border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] 
                dark:border-primary-400 dark:shadow-[8px_8px_0px_rgba(16,185,129,0.3)]
                active:translate-x-[8px] active:translate-y-[8px] active:shadow-none
                transition-all duration-150">
  Custom neomorph
</div>
```

---

## 🧩 Component Patterns

### **Buttons**

#### **Primary CTA**
```tsx
<button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 
                   text-white font-semibold rounded-lg 
                   transition-colors duration-200
                   active:scale-95">
  Invest Now
</button>
```

#### **Secondary Button**
```tsx
<button className="px-6 py-3 bg-white dark:bg-neutral-900 
                   border-2 border-neutral-300 dark:border-neutral-700
                   text-neutral-900 dark:text-neutral-50
                   hover:border-primary-500 dark:hover:border-primary-400
                   rounded-lg transition-all">
  Learn More
</button>
```

#### **Profit Pool Button**
```tsx
<button className="neomorph-profit px-6 py-3 bg-profit-50 dark:bg-profit-950/20
                   text-profit-700 dark:text-profit-300 font-semibold rounded-lg">
  View Portfolio
</button>
```

#### **Waqf Pool Button**
```tsx
<button className="neomorph-waqf px-6 py-3 bg-waqf-50 dark:bg-waqf-950/20
                   text-waqf-700 dark:text-waqf-300 font-semibold rounded-lg">
  Create Waqf
</button>
```

---

### **Cards**

#### **Basic Card**
```tsx
<div className="bg-white dark:bg-neutral-900 
                border border-neutral-200 dark:border-neutral-800
                rounded-xl p-6 shadow-sm
                hover:shadow-md transition-shadow">
  <h3 className="font-display font-bold text-xl mb-2">Title</h3>
  <p className="text-neutral-600 dark:text-neutral-400">Content</p>
</div>
```

#### **Neomorphic Card**
```tsx
<div className="neomorph bg-white dark:bg-neutral-900 rounded-xl p-6">
  <h3 className="font-display font-bold text-2xl mb-4">Featured</h3>
  <p className="text-neutral-700 dark:text-neutral-300">Description</p>
</div>
```

#### **Profit Opportunity Card**
```tsx
<div className="neomorph-profit bg-gradient-to-br from-profit-50 to-white 
                dark:from-profit-950/20 dark:to-neutral-900
                rounded-xl p-6">
  <div className="flex items-center gap-2 mb-3">
    <span className="px-3 py-1 bg-profit-100 dark:bg-profit-900/50 
                     text-profit-700 dark:text-profit-300 
                     rounded-full text-sm font-medium">
      Musharakah
    </span>
  </div>
  <h3 className="font-display font-bold text-2xl mb-2">Business Name</h3>
  <p className="text-neutral-600 dark:text-neutral-400 mb-4">Description</p>
  
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Target</p>
      <p className="font-mono font-bold text-lg">$50,000</p>
    </div>
    <div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Expected ROI</p>
      <p className="font-mono font-bold text-lg text-profit-600">15%</p>
    </div>
  </div>
</div>
```

#### **Waqf Impact Card**
```tsx
<div className="neomorph-waqf bg-gradient-to-br from-waqf-50 to-white
                dark:from-waqf-950/20 dark:to-neutral-900
                rounded-xl p-6">
  <div className="flex items-center gap-2 mb-3">
    <span className="px-3 py-1 bg-waqf-100 dark:bg-waqf-900/50
                     text-waqf-700 dark:text-waqf-300
                     rounded-full text-sm font-medium">
      Education
    </span>
  </div>
  <h3 className="font-display font-bold text-2xl mb-2">Scholarship Fund</h3>
  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
    Supporting orphaned students
  </p>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Beneficiaries</p>
      <p className="font-mono font-bold text-lg">1,250</p>
    </div>
    <div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Impact Score</p>
      <p className="font-mono font-bold text-lg text-waqf-600">9.2/10</p>
    </div>
  </div>
</div>
```

---

### **Forms**

#### **Input Field**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
    Amount
  </label>
  <input
    type="number"
    className="w-full px-4 py-3 
               bg-white dark:bg-neutral-900
               border-2 border-neutral-300 dark:border-neutral-700
               rounded-lg
               text-neutral-900 dark:text-neutral-50
               focus:border-primary-500 dark:focus:border-primary-400
               focus:outline-none focus:ring-2 focus:ring-primary-500/20
               transition-all"
    placeholder="Enter amount"
  />
</div>
```

#### **Select Dropdown**
```tsx
<select className="w-full px-4 py-3
                   bg-white dark:bg-neutral-900
                   border-2 border-neutral-300 dark:border-neutral-700
                   rounded-lg
                   text-neutral-900 dark:text-neutral-50
                   focus:border-primary-500 dark:focus:border-primary-400
                   focus:outline-none
                   transition-all">
  <option>Musharakah</option>
  <option>Murabaha</option>
  <option>Ijarah</option>
</select>
```

---

### **Badges**

#### **Status Badges**
```tsx
/* Approved */
<span className="px-3 py-1 bg-success-100 dark:bg-success-900/30
                 text-success-700 dark:text-success-300
                 rounded-full text-sm font-medium">
  Approved
</span>

/* Pending */
<span className="px-3 py-1 bg-warning-100 dark:bg-warning-900/30
                 text-warning-700 dark:text-warning-300
                 rounded-full text-sm font-medium">
  Pending Review
</span>

/* Rejected */
<span className="px-3 py-1 bg-error-100 dark:bg-error-900/30
                 text-error-700 dark:text-error-300
                 rounded-full text-sm font-medium">
  Rejected
</span>
```

#### **Contract Type Badges**
```tsx
<span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-900/30
                 text-secondary-700 dark:text-secondary-300
                 rounded-full text-sm font-medium">
  Musharakah
</span>
```

---

## ♿ Accessibility

### **Keyboard Navigation**
All interactive elements support keyboard focus:
```css
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### **ARIA Labels**
```tsx
<button aria-label="Close modal">
  <XIcon />
</button>

<nav aria-label="Main navigation">
  ...
</nav>
```

### **Color Contrast**
- **WCAG AA**: Minimum 4.5:1 for normal text
- **WCAG AAA**: Minimum 7:1 for normal text
- All color combinations tested for compliance

### **Reduced Motion**
Respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📐 Spacing Scale

```css
0: 0px
0.5: 2px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
32: 128px
```

**Usage**:
```tsx
/* Padding */
p-4    /* 16px all sides */
px-6   /* 24px horizontal */
py-3   /* 12px vertical */

/* Margin */
mb-8   /* 32px bottom */
mt-12  /* 48px top */

/* Gap (flexbox/grid) */
gap-4  /* 16px between items */
```

---

## 🎯 Component Library Roadmap

### **Phase 1** (Foundation)
- ✅ Button variants
- ✅ Card layouts
- ✅ Form inputs
- ✅ Badges
- ✅ Theme toggle

### **Phase 2** (Dashboards)
- [ ] Navigation bar
- [ ] Sidebar
- [ ] Dashboard cards
- [ ] Data tables
- [ ] Charts (profit/impact)

### **Phase 3** (Advanced)
- [ ] Modals
- [ ] Tooltips
- [ ] Toast notifications
- [ ] Progress bars
- [ ] Skeleton loaders

---

## 🌍 Islamic Design Principles

### **Cultural Sensitivity**
- **Green**: Primary brand color (Islamic symbolism)
- **Gold**: Heritage and tradition
- **Geometric patterns**: Subtle backgrounds (future)
- **Calligraphy**: Arabic terms styled appropriately

### **RTL Support** (Arabic)
```tsx
<html dir="rtl" lang="ar">
```

Enable RTL in Tailwind:
```tsx
<div className="text-left rtl:text-right">
```

### **Islamic Terminology**
Always use proper Arabic terms with translations:
- Mudarabah (مضاربة)
- Waqf (وقف)
- Musharakah (مشاركة)

---

## 📚 Resources

### **Tailwind Documentation**
https://tailwindcss.com/docs

### **Color Palette Tools**
- https://uicolors.app (Generate custom palettes)
- https://coolors.co (Color scheme generator)

### **Accessibility Testing**
- https://wave.webaim.org (WAVE)
- https://www.deque.com/axe (Axe DevTools)

---

**Design system maintained by QistFi Design Team**  
Last updated: December 16, 2025
