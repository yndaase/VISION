# New Pricing Page Design Plan

## Layout Structure

### 1. **Plan Type Toggle** (Top of page)
```
┌─────────────────────────────────────┐
│  [ Individual ]  [ Enterprise ]     │  ← Toggle buttons
└─────────────────────────────────────┘
```

---

## Individual Plans Section

### Display: **3 cards side-by-side**

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│   FREE   │  │ PRO      │  │ PRO      │
│          │  │ MONTHLY  │  │ ANNUAL   │
│  GH₵ 0   │  │ GH₵ 30   │  │ GH₵ 300  │
│ /forever │  │ /month   │  │ /year    │
│          │  │          │  │ Save 17% │
└──────────┘  └──────────┘  └──────────┘
```

**Features:**
- Free: Basic features
- Pro Monthly: GH₵ 30/month
- Pro Annual: GH₵ 300/year (save GH₵ 60 = 17% discount)

---

## Enterprise Plans Section

### Display: **Slider/Carousel with 4 plans**

```
← [Prev]  ┌──────────────┐  [Next] →
          │   STARTER    │
          │  GH₵ 2,500   │
          │   /month     │
          │  50 students │
          └──────────────┘
```

**Plans:**

1. **Enterprise Starter** - GH₵ 2,500/month
   - Up to 50 students
   - 5 teacher accounts
   - Basic analytics
   - Email support

2. **Enterprise Professional** - GH₵ 5,000/month
   - Up to 200 students
   - 20 teacher accounts
   - Advanced analytics
   - Custom branding
   - Priority support

3. **Enterprise Premium** - GH₵ 10,000/month
   - Up to 500 students
   - Unlimited teachers
   - Full white-label
   - API access
   - Dedicated account manager
   - Quiz creation tools
   - Excel export

4. **Enterprise Custom** - Contact Sales
   - 500+ students
   - Custom features
   - SLA guarantees
   - On-site training

---

## Technical Implementation

### Files to Create:
1. `pricing-new.html` - New pricing page
2. `pricing-new.css` - Styling
3. `pricing-new.js` - Toggle & slider logic

### Features:
- **Toggle**: Switch between Individual/Enterprise
- **Slider**: Swipe/click through Enterprise plans
- **Responsive**: Mobile-friendly
- **Animations**: Smooth transitions
- **CTA Buttons**: Different for each plan

### Slider Library:
Use **Swiper.js** (lightweight, 40KB)
- Touch-enabled
- Keyboard navigation
- Pagination dots
- Arrow navigation

---

## Pricing Summary

### Individual:
| Plan | Price | Billing |
|------|-------|---------|
| Free | GH₵ 0 | Forever |
| Pro Monthly | GH₵ 30 | Monthly |
| Pro Annual | GH₵ 300 | Yearly (save 17%) |

### Enterprise:
| Plan | Price | Students |
|------|-------|----------|
| Starter | GH₵ 2,500/mo | 50 |
| Professional | GH₵ 5,000/mo | 200 |
| Premium | GH₵ 10,000/mo | 500 |
| Custom | Contact Sales | 500+ |

---

## Next Steps:
1. Create HTML structure
2. Add CSS styling
3. Implement toggle logic
4. Add slider functionality
5. Test responsiveness
6. Deploy

**Estimated time:** 3-4 hours
