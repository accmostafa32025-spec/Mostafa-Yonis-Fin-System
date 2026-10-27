# Firestore access setup and separation of duties

Firestore access is role-based and deny-by-default. New Google sign-ins receive the unprivileged `pending` role. The app's sample users are demonstration records, not real access identities.

## Responsibilities and permissions

| Role | Responsibility | Entry rights | Review / approval | Master data | Sensitive savings |
| --- | --- | --- | --- | --- | --- |
| `admin` | User and system administration; emergency technical access | No financial posting | No routine financial approval | Manage | Read/write |
| `cfo` | Financial approver and policy owner | No entry creation or editing | Final approval/rejection after manager review; cannot approve own entry | Read only; manage settings | Read/write |
| `accounts_manager` | Accounting supervision and master-data stewardship | Create/edit drafts | Review or return entries; cannot finally approve | Manage | Read/write |
| `accountant` | Prepare accounting records | Create and edit own drafts; submit for review | No | Read only | No |
| `data_entry` | Capture source documents | Create and edit own drafts; submit for review | No | Read only | No |
| `auditor` | Independent inspection | Read only | Inspect audit trail; no operational edits | Read only | No |
| `view_only` | Read-only access | No | No | Read only | No |
| `pending` | Awaiting approved assignment | No system access | No | No | No |

The journal-entry rules enforce a two-step approval chain: a preparer creates a draft, an accounts manager reviews it, and a different CFO approves or rejects it. A CFO cannot approve an entry they created or reviewed. Entries without creator/reviewer UID fields cannot be approved; legacy records need a controlled migration/review before production use. Corrections use reversal entries rather than deletion.

## First administrator and rollout

1. Review existing Firestore user documents before deploying. The old rules allowed signed-in users to write their own profiles, so existing role values must be treated as untrusted until checked.
2. Have each association user sign in once. New profiles receive `pending` and have no accounting access.
3. In Firebase Console, assign `role: "admin"` to the approved initial administrator's `users/{uid}` document. Use the Firebase Auth UID as the document ID. The browser app cannot assign roles.
4. Assign each user one role from the matrix through Firebase Console or a trusted Admin SDK process. Do not let users self-assign or self-upgrade.
5. Verify the rules with distinct test accounts for preparer, reviewer, approver, auditor, and viewer before importing association records.

## Scope

- This branch establishes Firestore authorization; it does not yet implement selectable seed migration or end-to-end persistence.
- The app still renders bundled sample data locally.
- Firebase rules must be deployed to the intended Firebase project after review. Collection names not explicitly listed remain denied.
