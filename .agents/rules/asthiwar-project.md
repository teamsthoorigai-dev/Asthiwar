# ASTHIWAR Project Rules

1. Read the project documents before substantial changes.
2. Treat the supplied package source as source data, not as a complete formula specification.
3. Never invent missing prices or calculation rules.
4. Never silently convert a text allowance into an upgrade price.
5. The backend is the authoritative calculator.
6. Every generated estimate gets a unique human-readable estimate number and immutable snapshots.
7. Maintain price history with effective dates.
8. Never destroy a price used by an existing estimate.
9. Package selection provides the baseline/default configuration.
10. Brands/options are data, not hard-coded frontend constants.
11. Admin changes data/configuration, not executable formulas.
12. Use PostgreSQL.
13. Use Drizzle with standard node-postgres connection for portability.
14. Avoid Neon-specific application APIs/drivers unless explicitly justified.
15. All admin APIs require server-side authentication/authorization.
16. Validate all untrusted input.
17. Keep public site and admin in one web application.
18. Admin scope is calculator management, estimates, enquiries and small dashboard.
19. Do not add CRM/CMS features without approval.
20. Use migrations for every database schema change.
21. Test calculator and pricing-history changes.
22. Verify important UI flows in a real browser.
23. Keep deployment provider-agnostic.
24. When a requirement is ambiguous, document it in OPEN-QUESTIONS rather than guessing.
