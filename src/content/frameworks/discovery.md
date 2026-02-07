---
title: "Phase 1: Customer Discovery"
order: 1
---

## The Twitter Version

Customer Discovery means talking to people to find out if the problem you want to solve is real.

## What Happens in This Phase

Imagine you're starting QuickBite, a food delivery app. You have a hunch that people in your city want faster food delivery from local restaurants. But a hunch isn't a business. Before you write a single line of code, you need to find out if this problem is real.

So you talk to people. Not your friends (they'll tell you what you want to hear). You talk to strangers who might be your customers. You ask questions like: "How do you decide what to eat for dinner?" and "What frustrates you about ordering food?" You listen more than you talk.

What you learn might surprise you. Maybe speed isn't the real problem — maybe it's that existing apps don't have enough healthy options. Maybe the problem is real but only for people in certain neighborhoods. Every conversation gives you data. You write it all down, and you update your assumptions based on what you hear.

## You Know You're in This Phase When...

- You have more questions than answers
- Your definitions keep changing after every conversation
- You're using words like "we think" and "we assume" more than "we know"
- You haven't built anything yet (or you've only built a prototype)
- Your team disagrees about what the core problem even is

## Common Mistakes

1. **Skipping straight to building.** You're so excited about your idea that you start coding before talking to a single customer. Six months later, you've built something nobody wants.

2. **Asking leading questions.** "Don't you think faster delivery would be great?" isn't a question — it's a suggestion. Ask open-ended questions and let people tell you what matters to them.

3. **Treating opinions as facts.** One person saying "I'd totally use that" isn't validation. You need patterns across multiple conversations before you can call something a finding.

## What Wiki Entries Look Like in This Phase

Definitions in Discovery are tagged with `confidence: hypothesis`. They're written in tentative language. They include open questions. They cite specific interviews or observations, not analytics or experiments (because there's nothing to measure yet).

Example frontmatter:
```yaml
custdev_phase: "discovery"
confidence: "hypothesis"
method: "customer-interview"
```

The definition body will say things like "Based on 12 interviews, we believe..." and include a section called "What would change this definition" listing the evidence that would make you revise it.
