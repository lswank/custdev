---
term: customer-lifetime-value
product: quickbite
custdev_phase: building
confidence: canonical
version: "1.0.0"
owner: Admin User
method: analytics
status: published
override_reason: "QuickBite calculates CLV using an 18-month projection window based on order frequency and average order value, reflecting the typical food delivery customer lifecycle."
last_validated: 2025-06-01
---

In QuickBite, customer lifetime value is calculated as the projected revenue from a single customer over an 18-month period, based on their order frequency and average order value. The 18-month window was chosen because data shows that most QuickBite customers who remain active beyond this point have established a stable ordering pattern that can be extrapolated with confidence.

The formula takes a customer's average order value, multiplies it by their monthly order frequency, and projects that forward for 18 months while applying a retention decay factor. For example, a customer who orders twice a month with a $25 average order value and a steady retention rate would have a projected CLV that the team can compare against acquisition costs to determine profitability.

This metric drives major business decisions at QuickBite, from how much to spend on paid advertising in new markets to which customer segments deserve premium support. The team segments CLV by acquisition channel, geography, and customer behavior to understand where the highest-value customers come from and what keeps them ordering. Increasing CLV by even a few dollars per customer can justify significant investments in product improvements and restaurant partnerships.
