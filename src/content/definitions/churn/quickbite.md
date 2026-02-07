---
term: churn
product: quickbite
custdev_phase: building
confidence: canonical
version: "1.0.0"
owner: Admin User
method: analytics
status: published
override_reason: "QuickBite uses a 60-day inactivity window to define churn, calibrated to the natural ordering cadence of food delivery customers."
last_validated: 2025-06-01
---

In QuickBite, a customer is considered churned when they have not placed any orders for 60 consecutive days. This means the clock starts from their last completed delivery, and if two full months pass without a new order, they move into the churned category. The account does not need to be deleted or deactivated for the customer to count as churned.

The 60-day window was set based on analysis of ordering patterns. Most active QuickBite users order at least once a month, so going two months without any activity is a strong signal that the customer has moved on. This timeframe is long enough to account for vacations or temporary changes in routine, but short enough to catch real disengagement before it becomes permanent.

QuickBite monitors churn closely because acquiring a new customer costs significantly more than keeping an existing one. The team uses churn data to trigger win-back campaigns, such as personalized discounts or notifications about new restaurant partners in the customer's area. Reducing churn by even a small percentage has a big impact on monthly revenue and long-term business health.
