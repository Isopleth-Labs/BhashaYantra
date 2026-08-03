# Documentation Index

This folder is the initial source of truth for BhashaYantra before application code is created.

## Reading order

1. [Product Specification](01-product-spec.md) — what the product must do.
2. [System Architecture](02-system-architecture.md) — how the approved technologies fit together.
3. [Database ERD](03-database-erd.md) — entities, relationships, and data ownership.
4. [Repository Pattern](04-repositories.md) — how application code accesses data.
5. [Business Logic](05-business-logic.md) — typing, conversion, scoring, and stenography rules.
6. [Frontend Design System](06-frontend-design-system.md) — final layout, themes, fonts, and UI rules.
7. [Development Roadmap](07-development-roadmap.md) — implementation sequence and completion gates.
8. [Implementation Status](08-implementation-status.md) — what is runnable now and what remains.
9. [Business Model](09-business-model.md) — product tiers, monetization boundaries, pricing hypotheses, and launch gates.

## Document ownership

| Document | Primary owner | Reviewers |
|---|---|---|
| Product specification | Product owner | Design, engineering |
| System architecture | Technical lead | Frontend, Tauri, database engineers |
| Database ERD | Database engineer | Technical lead, business-logic owner |
| Repositories | Application engineer | Database and frontend engineers |
| Business logic | Domain engineer | Product owner, QA |
| Frontend design system | Product designer | Frontend engineer, product owner |
| Roadmap | Technical lead | Entire delivery team |
| Business model | Product owner | Finance, engineering, support |

## Change rule

Any change that affects product behavior, security boundaries, database ownership, or final UI must update the relevant document in the same change as the implementation.

The final approved reference image is stored at [assets/bhashayantra-final-reference.png](assets/bhashayantra-final-reference.png).

The latest verified implementation screenshot is stored at [assets/bhashayantra-implemented-ui.png](assets/bhashayantra-implemented-ui.png).
