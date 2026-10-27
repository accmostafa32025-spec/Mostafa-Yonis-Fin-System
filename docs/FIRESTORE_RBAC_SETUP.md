# Firestore access setup

This repository previously allowed every signed-in Google account to read and write most Firestore collections. The rules in this branch replace that fallback with role-based access and remove automatic CFO assignment for new users.

## Role matrix

| Role | Operational data | Create/edit drafts | Review entries | Approve entries | Master data/settings | Payroll/savings |
| --- | --- | --- | --- | --- | --- | --- |
| `admin` | Full access | Yes | Yes | Yes | Yes | Yes |
| `cfo` | Read/write | Yes | Yes | Yes | Yes | Yes |
| `accounts_manager` | Read/write | Yes | Yes | Yes | Master data, not settings | Yes |
| `auditor` | Read-only | No | Read audit trail | No | No | No |
| `accountant` | Read/write | Drafts only | No | No | No | No |
| `data_entry` | Read/write | Drafts only | No | No | No | No |
| `view_only` | Read-only | No | No | No | No | No |
| `pending` | No system data | No | No | No | No | No |

The app's seeded sample users and role labels are not identity assignments. They must not be used as access-control identities.

## First administrator and rollout

1. Deploy the new rules only after reviewing the existing Firestore user documents. The previous rules allowed users to write their own profile, so treat old role values as untrusted until reviewed.
2. Have each association user sign in once. New profiles receive the `pending` role and cannot access accounting collections.
3. In the Firebase Console, assign `role: "admin"` to the approved initial administrator's `users/{uid}` document. The document ID must be that Firebase Auth UID. Do not assign admin from the browser app.
4. The administrator can assign roles only through a trusted administrative path (Firebase Console/Admin SDK); no self-service role change is allowed by these rules.
5. Assign the role for every user using the matrix above, then verify access with test accounts before importing association records.

## Scope notes

- These rules secure Firestore requests. They do not yet hide seeded demo data rendered locally in the React app.
- The app does not yet persist the accounting collections end-to-end. This branch establishes the access boundary required before implementing selectable migration and ongoing persistence.
- If the deployed project uses different collection names, add explicit rules for those names before enabling writes. The catch-all is intentionally deny-by-default.
