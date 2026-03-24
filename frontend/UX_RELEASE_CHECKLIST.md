# Rice Mill Express - Frontend UX Release Checklist

Use this checklist before production release. Validate each role flow on mobile and desktop where applicable.

## 1) Global Standards

- [ ] Typography hierarchy is consistent (`h1-h6`, body, captions)
- [ ] Spacing follows 8pt rhythm (8/16/24/32)
- [ ] Primary CTA is visually clear on each screen
- [ ] Loading, empty, and error states exist for critical pages
- [ ] Buttons, cards, tabs, and chips use consistent radius and weight
- [ ] Color usage follows semantic intent (success/warning/error/info)
- [ ] Keyboard focus states are visible
- [ ] No layout breakage at common widths (360, 768, 1024, 1440)

## 2) Customer

### Discovery + Product
- [ ] Product listing supports search/filter and zero-results state
- [ ] Product detail shows clear price stack and stock state
- [ ] Add-to-cart/wishlist actions provide immediate feedback

### Cart + Checkout
- [ ] Cart quantity updates are reflected correctly
- [ ] Checkout supports selected-item flow and summary clarity
- [ ] Delivery fee and final total are understandable
- [ ] Payment method switching behaves correctly
- [ ] Empty checkout/cart states render correctly

### Orders + Account
- [ ] Order detail timeline renders current status correctly
- [ ] Order cancel/download actions show success/failure feedback
- [ ] Bookmarks, notifications, and settings states are handled

## 3) Seller

- [ ] Seller orders table/kanban views are consistent and usable
- [ ] Delivery assignment flow works with clear status feedback
- [ ] Product create/edit forms are validated and refresh list correctly
- [ ] Seller payments/payout screens show readable financial data
- [ ] Empty-state messaging is actionable

## 4) Delivery Partner

- [ ] Dashboard stats and assigned orders load reliably
- [ ] No-orders state appears with clear next action
- [ ] Error state includes retry path
- [ ] Status chips and order cards are readable on mobile
- [ ] Earnings/payout sections are visually clear

## 5) Admin

### Overview
- [ ] Dashboard cards/charts are readable and aligned
- [ ] Quick actions and moderation shortcuts navigate correctly

### Orders + Payments
- [ ] Orders search works and zero-results state appears
- [ ] Order details show payment + price breakdown clearly
- [ ] Payment transactions show status chips consistently
- [ ] Payout table and COD settlement table handle empty/loading states

## 6) State Coverage (Must-Have)

For each critical screen, validate:

- [ ] Loading state
- [ ] Empty/no-data state
- [ ] Error state with retry
- [ ] Partial success state (if applicable, e.g. payment pending)

## 7) Production Safety

- [ ] No frontend lints introduced in changed files
- [ ] No API contract changes from frontend
- [ ] No hardcoded sensitive values
- [ ] Environment-based API URLs behave in staging/prod

## 8) Final Sign-off

- [ ] Customer flow sign-off
- [ ] Seller flow sign-off
- [ ] Delivery Partner flow sign-off
- [ ] Admin flow sign-off
- [ ] QA sign-off
- [ ] PM sign-off

