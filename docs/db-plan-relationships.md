### Entity Relationship Summary

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  tcg_types  │◄────│    sets     │◄────│   cards     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       ▼                                       ▼
┌─────────────┐                        ┌─────────────┐
│  rarities   │◄───────────────────────│ card_prices │
└─────────────┘                        └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │price_sources│
                                       └─────────────┘

┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│ auth.users  │◄────│user_profiles    │     │card_conditions│
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ user_lists  │◄────│ list_entries    │────►│collection_entries│
└─────────────┘     └─────────────────┘     └─────────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────────┐
                                            │grading_companies│
                                            └─────────────────┘
```

### Cardinality

| Relationship                               | Cardinality  | Description                                         |
| ------------------------------------------ | ------------ | --------------------------------------------------- |
| `tcg_types` → `sets`                       | One-to-Many  | One TCG type has many sets                          |
| `tcg_types` → `cards`                      | One-to-Many  | One TCG type has many cards                         |
| `tcg_types` → `rarities`                   | One-to-Many  | One TCG type has many rarities                      |
| `sets` → `cards`                           | One-to-Many  | One set contains many cards                         |
| `rarities` → `cards`                       | One-to-Many  | One rarity applies to many cards                    |
| `cards` → `card_prices`                    | One-to-Many  | One card has multiple price entries                 |
| `price_sources` → `card_prices`            | One-to-Many  | One source provides many prices                     |
| `auth.users` → `user_profiles`             | One-to-One   | Each user has one profile                           |
| `auth.users` → `collection_entries`        | One-to-Many  | One user has many collection entries                |
| `auth.users` → `user_lists`                | One-to-Many  | One user has many lists (max 10)                    |
| `cards` → `collection_entries`             | One-to-Many  | One card can be in many collections                 |
| `card_conditions` → `collection_entries`   | One-to-Many  | One condition applies to many entries               |
| `grading_companies` → `collection_entries` | One-to-Many  | One company applies to many entries                 |
| `user_lists` ↔ `collection_entries`       | Many-to-Many | Lists contain entries; entries can be in many lists |

---
