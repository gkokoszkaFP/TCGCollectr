### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
│─────────────────│
│ id (PK)         │
└────────┬────────┘
         │
         │ 1:1
         │ CASCADE
         ▼
┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │      sets       │
│─────────────────│       │─────────────────│
│ id (PK, FK)     │       │ id (PK)         │
│ created_at      │       │ name            │
│ updated_at      │       │ series          │
│ onboarding_done │       │ total_cards     │
│ favorite_type   │       │ release_date    │
│ favorite_set    │       │ logo_url        │
│ total_cards_cnt │       │ symbol_url      │
└────────┬────────┘       │ last_synced_at  │
         │                │ created_at      │
         │ 1:N            │ updated_at      │
         │ CASCADE        └────────┬────────┘
         │                        │
         │                        │ 1:N
         │                        │ RESTRICT
         │                        ▼
         │                ┌─────────────────┐
         │                │      cards      │
         │                │─────────────────│
         │                │ id (PK)         │
         │                │ set_id (FK)     │
         │                │ name            │
         │                │ card_number     │
         │                │ rarity          │
         │                │ types (TEXT[])  │
         │                │ hp              │
         │                │ image_url_small │
         │                │ image_url_large │
         │                │ tcg_type        │
         │                │ last_synced_at  │
         │                │ created_at      │
         │                │ updated_at      │
         │                └────────┬────────┘
         │                         │
         │                         │ 1:N
         │                         │ RESTRICT
         ▼                         ▼
┌─────────────────┐
│   user_cards    │◀──────┘
│─────────────────│
│ id (PK)         │
│ user_id (FK)    │ N:1
│ card_id (FK)    │ CASCADE
│ variant         │
│ quantity        │
│ wishlisted      │
│ created_at      │
│ updated_at      │
└─────────────────┘
 UNIQUE(user_id,
  card_id,variant)

┌──────────────────────┐
│ analytics_events     │
│──────────────────────│
│ id (PK)              │
│ event_type           │
│ user_id (FK) [null]  │
│ event_data (JSONB)   │
│ created_at           │
└──────────────────────┘
```

### Cardinality Summary

| From       | To               | Type | Notes                                                             |
| ---------- | ---------------- | ---- | ----------------------------------------------------------------- |
| auth.users | profiles         | 1:1  | ON DELETE CASCADE - auto-remove profiles when user deleted        |
| profiles   | user_cards       | 1:N  | ON DELETE CASCADE - remove all collection items when user deleted |
| sets       | cards            | 1:N  | ON DELETE RESTRICT - prevent set deletion if cards exist          |
| cards      | user_cards       | 1:N  | ON DELETE RESTRICT - prevent card deletion if in user collections |
| profiles   | analytics_events | 1:N  | ON DELETE CASCADE (nullable) - remove events when user deleted    |

---
