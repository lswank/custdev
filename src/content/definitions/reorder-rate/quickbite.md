---
term: reorder-rate
product: quickbite
custdev_phase: validation
confidence: tested
version: "1.0.0"
owner: Admin User
method: ab-test
status: published
override_reason: "QuickBite measures reorder rate within a 14-day window after the first order, based on A/B testing that identified this as the critical habit-forming period."
last_validated: 2025-06-01
---

In QuickBite, reorder rate is defined as the percentage of users who place a second order within 14 days of their first completed delivery. This narrow window focuses the metric on the most critical period for forming a food delivery habit. If a customer comes back within two weeks, they are much more likely to become a regular user than someone who waits longer.

The 14-day timeframe was validated through A/B testing across multiple customer cohorts. Tests showed that users who reordered within this window had three times the six-month retention rate compared to those who waited longer. This insight led the team to concentrate its post-first-order engagement efforts, such as targeted push notifications and follow-up discounts, within those first two weeks.

QuickBite tracks reorder rate by market, by acquisition channel, and by the restaurant the customer first ordered from. This helps the team understand which first-order experiences lead to the highest reorder rates. For example, orders from restaurants with fast preparation times and high ratings tend to produce better reorder numbers, which informs how the app ranks and recommends restaurants to first-time users.
