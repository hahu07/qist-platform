# Member Dashboard - Quick Start Guide

## 🚀 Getting Started

### 1. Start Development Environment
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Juno Emulator (optional but recommended)
juno emulator start
```

### 2. Access Dashboard
- Navigate to: `http://localhost:3000/member/dashboard`
- Sign in with Internet Identity or test account

### 3. Seed Test Data (Development Only)
Look for the **yellow floating widget** in bottom-right corner:
- Select investor type (Individual/Corporate)
- Click "Seed All Data"
- Refresh page to see populated dashboard

---

## 📊 Dashboard Features

### Real-Time Data Display

#### Portfolio Stats (Top Cards)
- **Total Invested**: Sum of all your investments
- **Current Value**: Invested amount + returns
- **Total Returns**: Your profit/earnings
- **Active Investments**: Number of active positions

#### Investment List
- View all your investments
- See performance status
- Track returns and gains
- Access transaction history

#### KYC Status Alert
- Appears if KYC not verified
- Different colors for different statuses
- Direct link to upload documents

---

## 🗂️ Data Collections

### Juno Collections Used

#### `individual_investor_profiles`
- **Key**: User ID (from authentication)
- **Data**: Full individual investor profile
- **Access**: One document per individual investor user

#### `corporate_investor_profiles`
- **Key**: User ID (from authentication)
- **Data**: Full corporate investor profile
- **Access**: One document per corporate investor user

#### `investments`
- **Key**: `{userId}-investment-{number}`
- **Data**: Investment details (amount, returns, status)
- **Access**: Multiple documents per user

---

## 🧪 Testing Scenarios

### Empty State
```typescript
// No investments exist
Result: Shows "No Active Investments Yet" message
Action: Browse Investment Opportunities button
```

### With Investments
```typescript
// 5 sample investments created
Result: Shows stats + investment cards
Stats: Calculated from actual data
```

### Different Investor Types
```typescript
// Individual: Shows first name in greeting
// Corporate: Shows company name in greeting
```

---

## 🔧 Development Tools

### Data Seeder (Bottom-Right Widget)
**Buttons:**
- `Seed All Data` - Creates profile + investments
- `Profile Only` - Creates investor profile
- `Investments Only` - Creates sample investments

**Console Access:**
```typescript
// Browser console
import { seedDashboardData } from "@/utils/seed-investment-data";
await seedDashboardData(userId, "individual");
```

### Juno Console
- URL: `http://localhost:5866/`
- View collections and documents
- Manual data editing
- Access control testing

---

## 💡 Quick Tips

### Viewing Real Data
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "listDocs" or "getDoc"
4. Inspect response data

### Clearing Test Data
1. Open Juno console: `http://localhost:5866/`
2. Navigate to Collections
3. Delete documents manually
4. Or use browser console

### Debugging
```typescript
// Add to dashboard page
console.log("Profile:", investorProfile);
console.log("Investments:", investments);
console.log("Stats:", portfolioStats);
```

---

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (single column)
- **Tablet**: 768px - 1024px (two columns)
- **Desktop**: > 1024px (full sidebar + content)

---

## ⚡ Performance

### Loading States
- Shows spinner while fetching data
- Skeleton screens (future enhancement)
- Progressive loading

### Data Refresh
- Currently manual (page refresh)
- Future: Auto-refresh every 30s
- Future: Real-time WebSocket updates

---

## 🎨 Customization

### Changing Colors
Edit `/src/app/globals.css`:
```css
/* Primary color palette */
--primary-600: #your-color;
--business-600: #your-color;
--success-600: #your-color;
```

### Modifying Stats
Edit calculation in dashboard:
```typescript
const calculatePortfolioStats = (investments) => {
  // Custom calculations here
};
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Dashboard stuck loading | Check authentication, refresh page |
| Empty stats ($0) | Seed data using widget |
| KYC alert not showing | Check profile has `kycStatus` field |
| Investments not displaying | Verify collection name and user ID |

---

## 📚 Related Files

### Key Files to Know
- `/src/app/member/dashboard/page.tsx` - Main dashboard
- `/src/schemas/investor.schema.ts` - Data types
- `/src/utils/seed-investment-data.ts` - Sample data
- `/src/components/kyc-alert.tsx` - KYC notification

### Configuration
- `/juno.config.mjs` - Satellite IDs
- `/next.config.mjs` - Next.js + Juno setup

---

## 🎯 Next Features to Implement

### High Priority
- [ ] Real application data fetching
- [ ] Investment detail modal
- [ ] Transaction history page
- [ ] Profit distribution timeline

### Medium Priority
- [ ] Portfolio performance charts
- [ ] Export reports (PDF/CSV)
- [ ] Investment filtering
- [ ] Notification preferences

### Future
- [ ] Mobile app
- [ ] Real-time updates
- [ ] Investment recommendations
- [ ] Social features (leaderboards)

---

## 📞 Support

**In Development:**
- Check browser console for errors
- Review Juno console for data issues
- Use data seeder to reset state

**In Production:**
- Contact admin via support email
- Submit bug reports through portal
- Check platform status page

---

## 🔐 Security Notes

- All data user-scoped (filtered by user.key)
- Juno handles authentication
- No direct database access from frontend
- KYC documents stored securely
- Audit logs maintained

---

## ✅ Checklist for New Developers

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Start dev server (`npm run dev`)
- [ ] Start Juno emulator (optional)
- [ ] Sign in to dashboard
- [ ] Use data seeder to create test data
- [ ] Explore all dashboard features
- [ ] Read schemas in `/src/schemas/`
- [ ] Review Juno documentation
- [ ] Test responsive design

---

**Happy Coding! 🚀**
