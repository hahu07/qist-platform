# Real-Time Member/Investor Dashboard

## Overview

The member dashboard now displays **real-time data** fetched from Juno's datastore, showing actual investor profiles and investment portfolios.

## Key Features Implemented

### ✅ Real-Time Data Fetching
- Investor profile loaded from `investor_profiles` collection
- Investment portfolio fetched from `investments` collection
- Dynamic KYC status tracking
- Live portfolio statistics calculation

### ✅ Dynamic UI Components
- **Portfolio Stats Cards**: Display real-time totals, returns, and active investments
- **Investment List**: Renders actual investment data or empty state
- **Personalized Greeting**: Shows user's name from profile (individual or corporate)
- **KYC Alert**: Displays based on actual verification status

### ✅ Data Models

#### Investor Profile (`investor_profiles` collection)
- Individual or corporate investor types
- Contact information and identity details
- Risk profile and investment preferences
- KYC verification status and documents
- Pool allocation preferences

#### Investments (`investments` collection)
- Investment amount and returns
- Associated application/business
- Status (active, pending, completed, cancelled)
- Pool allocation (profit/waqf)
- Performance tracking

### ✅ Empty States
- Shows helpful message when no investments exist
- Call-to-action to browse opportunities
- Encourages user engagement

## File Structure

```
src/
├── app/member/dashboard/page.tsx       # Main dashboard with real-time data
├── components/
│   ├── kyc-alert.tsx                   # KYC status alert component
│   └── data-seeder.tsx                 # Dev utility for seeding test data
├── utils/
│   ├── seed-investment-data.ts         # Sample data generation
│   └── seed-admin-data.ts              # Existing admin seeder
└── schemas/
    ├── investor.schema.ts               # Investor profile types
    └── application.schema.ts            # Investment/application types
```

## Usage

### For Authenticated Users

1. **Complete Onboarding**: User must first complete investor onboarding (individual or corporate)
2. **KYC Verification**: Dashboard prompts KYC completion if status is "pending"
3. **View Portfolio**: Real-time stats and investment list automatically load
4. **Empty State**: If no investments, user sees call-to-action to browse opportunities

### For Development/Testing

#### Seed Test Data

In **development mode**, a data seeder utility appears in the bottom-right corner:

```typescript
// Automatically available on dashboard in dev mode
<DataSeeder userId={user.key} />
```

**Steps to seed data:**
1. Open member dashboard (`/member/dashboard`)
2. Click the "Seed Test Data" floating widget (bottom-right)
3. Select investor type (individual or corporate)
4. Click "Seed All Data" or specific buttons

**Sample Data Includes:**
- Individual investor profile (Ahmad bin Abdullah)
- Corporate investor profile (Barakah Trading Sdn Bhd)
- 5 sample investments with varying amounts and statuses
- Realistic returns and performance data

#### Manual Seeding

```typescript
import { seedDashboardData } from "@/utils/seed-investment-data";

// In your code or browser console
await seedDashboardData(userId, "individual"); // or "corporate"
```

## Data Flow

```
User Login
    ↓
Authentication (Juno)
    ↓
Fetch Investor Profile (getDoc)
    ↓
Fetch Investments (listDocs with filter)
    ↓
Calculate Portfolio Stats
    ↓
Render Dashboard with Real Data
```

## API Calls

### Fetch Investor Profile
```typescript
// Try individual profile first, then corporate
let profileDoc = await getDoc({
  collection: "individual_investor_profiles",
  key: user.key,
});

if (!profileDoc) {
  profileDoc = await getDoc({
    collection: "corporate_investor_profiles",
    key: user.key,
  });
}
```

### Fetch Investments
```typescript
const investmentsResult = await listDocs({
  collection: "investments",
  filter: {
    matcher: {
      key: user.key, // Filter by investor ID
    },
  },
});
```

### Calculate Portfolio Stats
```typescript
const stats = {
  totalInvested: sum(investments.map(i => i.amount)),
  currentValue: sum(investments.map(i => i.amount + i.returns)),
  totalReturns: sum(investments.map(i => i.actualReturn || i.expectedReturn)),
  activeInvestments: count(investments.filter(i => i.status === "active")),
};
```

## Portfolio Statistics

### Metrics Displayed
1. **Total Invested**: Sum of all investment amounts
2. **Current Value**: Total invested + total returns
3. **Total Returns**: Sum of actual/expected returns
4. **Active Investments**: Count of investments with status "active"
5. **ROI Percentage**: (Total Returns / Total Invested) × 100

### Dynamic Calculation
All statistics are calculated in real-time from actual investment data:
- No hardcoded values
- Updates automatically when data changes
- Handles empty states gracefully

## Investment Performance Status

Each investment shows a performance indicator:
- **✓ Performing Well**: Actual returns ≥ expected returns (green)
- **→ On Track**: Actual returns ≥ 80% of expected (blue)
- **⚠ Needs Attention**: Actual returns < 80% of expected (yellow)

## Responsive Design

- **Mobile**: Single column, collapsible menu
- **Tablet**: Two columns for stats, stacked investments
- **Desktop**: Full sidebar navigation, multi-column layout
- **Charts**: SVG-based portfolio distribution (works on all devices)

## Security & Access Control

- Only authenticated users can access dashboard
- Users can only see their own data (filtered by user.key)
- KYC verification required for full access
- Juno handles authentication and authorization

## Next Steps / TODO

### Immediate
- [ ] Implement real application fetching (currently mock data)
- [ ] Add investment filtering by contract type
- [ ] Implement transaction history modal
- [ ] Add performance report generation

### Future Enhancements
- [ ] Real-time notifications via WebSocket/polling
- [ ] Chart.js integration for performance graphs
- [ ] Export portfolio to PDF/CSV
- [ ] Investment comparison tools
- [ ] Mobile app push notifications
- [ ] Automated profit distribution tracking

## Testing

### Manual Testing Steps
1. Sign in with test account
2. Use data seeder to create sample data
3. Verify portfolio stats calculate correctly
4. Test empty state (clear data first)
5. Check KYC alert appearance based on status
6. Test responsive layout on different screen sizes

### Test Scenarios
- ✅ New user with no investments (empty state)
- ✅ User with pending investments
- ✅ User with active investments showing returns
- ✅ Individual vs corporate investor profiles
- ✅ KYC status: pending, in-review, verified, rejected

## Performance Considerations

- **Lazy Loading**: Investment list renders only visible items
- **Memoization**: Stats calculations cached to avoid re-renders
- **Pagination**: Future - implement for large investment lists
- **CDN**: Static assets served via Juno's CDN
- **Caching**: Browser caching enabled for repeated visits

## Troubleshooting

### Dashboard Shows "Loading..." Forever
- Check authentication status
- Verify Satellite initialization
- Check browser console for errors

### Empty State Shows But User Has Investments
- Verify investments collection exists in Juno console
- Check that `investorId` matches `user.key`
- Inspect Juno console for data structure

### Portfolio Stats Show $0
- Ensure investments have `amount` and `expectedReturn` fields
- Check data type (should be `number`, not string)
- Verify data seeding was successful

### KYC Alert Not Showing
- Check investor profile exists
- Verify `kycStatus` field is set correctly
- Ensure `KYCAlert` component is imported

## Related Documentation

- [KYC Requirements](./kyc-requirements.md) - KYC verification process
- [Investor Schemas](../src/schemas/investor.schema.ts) - Data models
- [Juno Documentation](https://juno.build/docs) - Platform guide
- [Design System](./design-system.md) - UI components and styling

## Support

For issues or questions:
- Check Juno console: `http://localhost:5866/` (local dev)
- Review browser console for errors
- Check network tab for failed API calls
- Verify data structure in Juno collections
