# Security Specification - Performance Evaluation System

## Data Invariants
1. A performance evaluation must have all ratings specified between 1 and 5.
2. The `averageScore` must be the mean of the 5 ratings.
3. Users can only create evaluations if they are authenticated.
4. Evaluations are immutable once created (except for systemic administrative corrections).
5. Identity fields (`designation`, `department`) must be provided.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create an evaluation with a fake `uid` in metadata.
2. **Resource Poisoning**: Inject a 2MB string into `comments`.
3. **Rating Overflow**: Set `quality` rating to 100.
4. **Average Mismatch**: Set ratings to 1 but `averageScore` to 5.
5. **Unauthorized Read**: Read specific evaluation data without being signed in.
6. **Self-Promotion**: Authenticated user trying to update their own evaluation's scores.
7. **Phantom Document**: Create an evaluation for a non-existent PO number (schema validation).
8. **PII Leak**: Access signature data of another staff member (if restricted).
9. **Deletion Attempt**: Authenticated user trying to delete a record.
10. **State Poisoning**: Update `ratingCategory` to "Excellent" when average is 1.2.
11. **Timestamp Manipulation**: Set `createdAt` to a date in the future.
12. **Blanket List**: Querying all records without any filters (if we restrict to specific departments).

## Test Runner (Logic Overview)
The `firestore.rules` will be tested against:
- `isSignedIn()`
- `isValidEvaluation()` helper
- `immutable()` checks on `ownerId` (if added) and `createdAt`.

## Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|---|---|---|---|
| /evaluations | Protected (isValidEvaluation) | Protected (Immutable) | Protected (size checks) |
| /configs | Restricted to Admin | N/A | Restricted to Admin |
