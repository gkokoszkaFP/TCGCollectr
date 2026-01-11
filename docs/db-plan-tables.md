### profiles

User profile information linked to Supabase auth users.

| Column               | Type        | Constraints                                                                        | Description                               |
| -------------------- | ----------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| id                   | UUID        | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE                           | User ID from auth.users                   |
| onboarding_completed | BOOLEAN     | DEFAULT FALSE, NOT NULL                                                            | Whether user has completed onboarding     |
| favorite_type        | TEXT        |                                                                                    | Favorite Pokémon type                     |
| favorite_set         | TEXT        |                                                                                    | Favorite card set                         |
| total_cards_count    | INTEGER     | DEFAULT 0, NOT NULL, CHECK (total_cards_count >= 0 AND total_cards_count <= 10000) | Denormalized counter of total cards owned |
| created_at           | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                                                            | Creation timestamp                        |
| updated_at           | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                                                            | Last update timestamp                     |

### sets

Pokémon TCG sets/expansions.

| Column         | Type        | Constraints                 | Description                                          |
| -------------- | ----------- | --------------------------- | ---------------------------------------------------- |
| id             | TEXT        | PRIMARY KEY                 | Unique set identifier (e.g., 'sv04.5')               |
| name           | TEXT        | NOT NULL, UNIQUE            | Set name (e.g., 'Surging Sparks')                    |
| series         | TEXT        |                             | Series the set belongs to (e.g., 'Scarlet & Violet') |
| total_cards    | INTEGER     | NOT NULL                    | Total cards in the complete set                      |
| release_date   | DATE        |                             | Official release date of the set                     |
| logo_url       | TEXT        |                             | URL to set logo image                                |
| symbol_url     | TEXT        |                             | URL to set symbol image                              |
| tcg_type       | TEXT        | DEFAULT 'pokemon', NOT NULL | Type of TCG (for future expansion)                   |
| last_synced_at | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL     | Last sync from TCGDex API                            |
| created_at     | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL     | Creation timestamp                                   |
| updated_at     | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL     | Last update timestamp                                |

### cards

Card metadata cached from TCGDex API for offline support.

| Column          | Type        | Constraints                                      | Description                                           |
| --------------- | ----------- | ------------------------------------------------ | ----------------------------------------------------- |
| id              | TEXT        | PRIMARY KEY                                      | Unique card identifier from TCGDex (e.g., 'sv04.5-1') |
| set_id          | TEXT        | NOT NULL, REFERENCES sets(id) ON DELETE RESTRICT | Set this card belongs to                              |
| name            | TEXT        | NOT NULL                                         | Card name                                             |
| card_number     | TEXT        | NOT NULL                                         | Card number within set (e.g., '1/102')                |
| rarity          | TEXT        |                                                  | Rarity symbol or grade (e.g., '◇', '★')               |
| types           | TEXT[]      |                                                  | Array of Pokémon types (e.g., '{"grass", "water"}')   |
| hp              | INTEGER     |                                                  | Hit points for Pokémon cards                          |
| image_url_small | TEXT        |                                                  | URL to small card image from TCGDex CDN               |
| image_url_large | TEXT        |                                                  | URL to large card image from TCGDex CDN               |
| tcg_type        | TEXT        | DEFAULT 'pokemon', NOT NULL                      | Type of TCG                                           |
| last_synced_at  | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                          | Last sync from TCGDex API                             |
| created_at      | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                          | Creation timestamp                                    |
| updated_at      | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                          | Last update timestamp                                 |

### user_cards

User's collection entries (owned cards with variants and quantities).

| Column                             | Type        | Constraints                                                                | Description                            |
| ---------------------------------- | ----------- | -------------------------------------------------------------------------- | -------------------------------------- |
| id                                 | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()                                     | Unique identifier for collection entry |
| user_id                            | UUID        | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE                        | Owner of this collection entry         |
| card_id                            | TEXT        | NOT NULL, REFERENCES cards(id) ON DELETE RESTRICT                          | Card in collection                     |
| variant                            | TEXT        | NOT NULL, CHECK (variant IN ('normal', 'reverse', 'holo', 'firstEdition')) | Card variant/condition type            |
| quantity                           | INTEGER     | NOT NULL, DEFAULT 1, CHECK (quantity >= 1 AND quantity <= 1000)            | Number of copies owned                 |
| wishlisted                         | BOOLEAN     | DEFAULT FALSE, NOT NULL                                                    | Whether card is on wishlist            |
| created_at                         | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                                                    | When card was added to collection      |
| updated_at                         | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                                                    | Last update timestamp                  |
| UNIQUE (user_id, card_id, variant) |             |                                                                            | Prevent duplicate card+variant entries |

### analytics_events

Tracking user actions for analytics and success metrics.

| Column     | Type        | Constraints                               | Description                                                                 |
| ---------- | ----------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| id         | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()    | Unique event identifier                                                     |
| event_type | TEXT        | NOT NULL                                  | Type of event (e.g., 'card_added', 'collection_viewed', 'search_performed') |
| user_id    | UUID        | REFERENCES profiles(id) ON DELETE CASCADE | User who triggered the event (nullable for anonymous events)                |
| event_data | JSONB       |                                           | Additional event context and data                                           |
| created_at | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL                   | When event occurred                                                         |

---
