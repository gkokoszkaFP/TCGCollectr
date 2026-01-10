### 1.1 Card Catalog Tables

#### `tcg_types`

Lookup table for trading card game types to support future multi-TCG expansion.

| Column       | Type           | Constraints               | Description                    |
| ------------ | -------------- | ------------------------- | ------------------------------ |
| `id`         | `smallint`     | `PRIMARY KEY, GENERATED`  | Auto-incrementing identifier   |
| `code`       | `varchar(20)`  | `NOT NULL, UNIQUE`        | TCG code (e.g., 'pokemon')     |
| `name`       | `varchar(100)` | `NOT NULL`                | Display name (e.g., 'Pokémon') |
| `created_at` | `timestamptz`  | `NOT NULL, DEFAULT now()` | Record creation timestamp      |

```sql
create table tcg_types (
  id smallint primary key generated always as identity,
  code varchar(20) not null unique,
  name varchar(100) not null,
  created_at timestamptz not null default now()
);

-- Seed initial data
insert into tcg_types (code, name) values ('pokemon', 'Pokémon TCG');
```

---

#### `sets`

Card sets/expansions imported from tcgcsv.com.

| Column         | Type           | Constraints                              | Description                                |
| -------------- | -------------- | ---------------------------------------- | ------------------------------------------ |
| `id`           | `uuid`         | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique identifier                          |
| `tcg_type_id`  | `smallint`     | `NOT NULL, REFERENCES tcg_types(id)`     | TCG type foreign key                       |
| `external_id`  | `varchar(50)`  | `NOT NULL`                               | External ID from data source               |
| `name`         | `varchar(255)` | `NOT NULL`                               | Set name                                   |
| `series`       | `varchar(255)` | `NULL`                                   | Series grouping (e.g., 'Scarlet & Violet') |
| `release_date` | `date`         | `NULL`                                   | Official release date                      |
| `total_cards`  | `integer`      | `NULL`                                   | Total cards in set                         |
| `logo_url`     | `text`         | `NULL`                                   | Set logo image URL                         |
| `symbol_url`   | `text`         | `NULL`                                   | Set symbol image URL                       |
| `created_at`   | `timestamptz`  | `NOT NULL, DEFAULT now()`                | Record creation timestamp                  |
| `updated_at`   | `timestamptz`  | `NOT NULL, DEFAULT now()`                | Record update timestamp                    |

```sql
create table sets (
  id uuid primary key default gen_random_uuid(),
  tcg_type_id smallint not null references tcg_types(id),
  external_id varchar(50) not null,
  name varchar(255) not null,
  series varchar(255),
  release_date date,
  total_cards integer,
  logo_url text,
  symbol_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tcg_type_id, external_id)
);
```

---

#### `rarities`

Lookup table for card rarity values.

| Column        | Type           | Constraints                          | Description                  |
| ------------- | -------------- | ------------------------------------ | ---------------------------- |
| `id`          | `smallint`     | `PRIMARY KEY, GENERATED`             | Auto-incrementing identifier |
| `tcg_type_id` | `smallint`     | `NOT NULL, REFERENCES tcg_types(id)` | TCG type foreign key         |
| `code`        | `varchar(50)`  | `NOT NULL`                           | Rarity code                  |
| `name`        | `varchar(100)` | `NOT NULL`                           | Display name                 |
| `sort_order`  | `smallint`     | `NOT NULL, DEFAULT 0`                | Sort order for UI display    |

```sql
create table rarities (
  id smallint primary key generated always as identity,
  tcg_type_id smallint not null references tcg_types(id),
  code varchar(50) not null,
  name varchar(100) not null,
  sort_order smallint not null default 0,
  unique (tcg_type_id, code)
);
```

---

#### `cards`

Card catalog imported from tcgcsv.com with supplementary data from pokemontcg.io.

| Column             | Type           | Constraints                              | Description                           |
| ------------------ | -------------- | ---------------------------------------- | ------------------------------------- |
| `id`               | `uuid`         | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique identifier                     |
| `tcg_type_id`      | `smallint`     | `NOT NULL, REFERENCES tcg_types(id)`     | TCG type foreign key                  |
| `set_id`           | `uuid`         | `NOT NULL, REFERENCES sets(id)`          | Set foreign key                       |
| `external_id`      | `varchar(50)`  | `NOT NULL`                               | External ID from data source          |
| `name`             | `varchar(255)` | `NOT NULL`                               | Card name                             |
| `card_number`      | `varchar(20)`  | `NOT NULL`                               | Card number within set                |
| `rarity_id`        | `smallint`     | `NULL, REFERENCES rarities(id)`          | Rarity foreign key                    |
| `card_type`        | `varchar(50)`  | `NULL`                                   | Card type (Pokémon, Trainer, Energy)  |
| `supertype`        | `varchar(50)`  | `NULL`                                   | Supertype from API                    |
| `subtypes`         | `text[]`       | `NULL`                                   | Subtypes array from API               |
| `hp`               | `smallint`     | `NULL`                                   | Hit points (for Pokémon cards)        |
| `types`            | `text[]`       | `NULL`                                   | Energy types array                    |
| `evolves_from`     | `varchar(100)` | `NULL`                                   | Evolution predecessor                 |
| `abilities`        | `jsonb`        | `NULL`                                   | Abilities data from API               |
| `attacks`          | `jsonb`        | `NULL`                                   | Attacks data from API                 |
| `weaknesses`       | `jsonb`        | `NULL`                                   | Weaknesses data from API              |
| `resistances`      | `jsonb`        | `NULL`                                   | Resistances data from API             |
| `retreat_cost`     | `text[]`       | `NULL`                                   | Retreat cost energy types             |
| `rules`            | `text[]`       | `NULL`                                   | Rules text array                      |
| `artist`           | `varchar(255)` | `NULL`                                   | Card artist name                      |
| `flavor_text`      | `text`         | `NULL`                                   | Flavor text                           |
| `image_small_url`  | `text`         | `NULL`                                   | Small image URL (pokemontcg.io CDN)   |
| `image_large_url`  | `text`         | `NULL`                                   | Large image URL (pokemontcg.io CDN)   |
| `api_data_fetched` | `boolean`      | `NOT NULL, DEFAULT false`                | Whether API details have been fetched |
| `created_at`       | `timestamptz`  | `NOT NULL, DEFAULT now()`                | Record creation timestamp             |
| `updated_at`       | `timestamptz`  | `NOT NULL, DEFAULT now()`                | Record update timestamp               |

```sql
create table cards (
  id uuid primary key default gen_random_uuid(),
  tcg_type_id smallint not null references tcg_types(id),
  set_id uuid not null references sets(id) on delete cascade,
  external_id varchar(50) not null,
  name varchar(255) not null,
  card_number varchar(20) not null,
  rarity_id smallint references rarities(id),
  card_type varchar(50),
  supertype varchar(50),
  subtypes text[],
  hp smallint,
  types text[],
  evolves_from varchar(100),
  abilities jsonb,
  attacks jsonb,
  weaknesses jsonb,
  resistances jsonb,
  retreat_cost text[],
  rules text[],
  artist varchar(255),
  flavor_text text,
  image_small_url text,
  image_large_url text,
  api_data_fetched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tcg_type_id, external_id)
);
```

---

### 1.2 Pricing Tables

#### `price_sources`

Lookup table for price data sources.

| Column | Type           | Constraints              | Description                  |
| ------ | -------------- | ------------------------ | ---------------------------- |
| `id`   | `smallint`     | `PRIMARY KEY, GENERATED` | Auto-incrementing identifier |
| `code` | `varchar(50)`  | `NOT NULL, UNIQUE`       | Source code (e.g., 'tcgcsv') |
| `name` | `varchar(100)` | `NOT NULL`               | Display name                 |
| `url`  | `text`         | `NULL`                   | Source website URL           |

```sql
create table price_sources (
  id smallint primary key generated always as identity,
  code varchar(50) not null unique,
  name varchar(100) not null,
  url text
);

-- Seed initial data
insert into price_sources (code, name, url) values
  ('tcgcsv', 'TCGPlayer (via tcgcsv.com)', 'https://tcgcsv.com'),
  ('pokemontcg', 'pokemontcg.io', 'https://pokemontcg.io');
```

---

#### `card_prices`

Market pricing data for cards, supporting multiple price sources.

| Column            | Type            | Constraints                              | Description                         |
| ----------------- | --------------- | ---------------------------------------- | ----------------------------------- |
| `id`              | `uuid`          | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique identifier                   |
| `card_id`         | `uuid`          | `NOT NULL, REFERENCES cards(id)`         | Card foreign key                    |
| `price_source_id` | `smallint`      | `NOT NULL, REFERENCES price_sources(id)` | Price source foreign key            |
| `price_type`      | `varchar(50)`   | `NOT NULL, DEFAULT 'market'`             | Price type (market, low, mid, high) |
| `price`           | `numeric(10,2)` | `NULL`                                   | Price value                         |
| `currency`        | `char(3)`       | `NOT NULL, DEFAULT 'USD'`                | ISO 4217 currency code              |
| `fetched_at`      | `timestamptz`   | `NOT NULL, DEFAULT now()`                | When price was fetched              |

```sql
create table card_prices (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  price_source_id smallint not null references price_sources(id),
  price_type varchar(50) not null default 'market',
  price numeric(10,2),
  currency char(3) not null default 'USD',
  fetched_at timestamptz not null default now(),
  unique (card_id, price_source_id, price_type)
);
```

---

### 1.3 User Collection Tables

#### `card_conditions`

Lookup table for card condition values.

| Column       | Type          | Constraints              | Description                  |
| ------------ | ------------- | ------------------------ | ---------------------------- |
| `id`         | `smallint`    | `PRIMARY KEY, GENERATED` | Auto-incrementing identifier |
| `code`       | `varchar(20)` | `NOT NULL, UNIQUE`       | Condition code               |
| `name`       | `varchar(50)` | `NOT NULL`               | Display name                 |
| `sort_order` | `smallint`    | `NOT NULL, DEFAULT 0`    | Sort order (best to worst)   |

```sql
create table card_conditions (
  id smallint primary key generated always as identity,
  code varchar(20) not null unique,
  name varchar(50) not null,
  sort_order smallint not null default 0
);

-- Seed initial data (FR-003 condition scale)
insert into card_conditions (code, name, sort_order) values
  ('mint', 'Mint', 1),
  ('near_mint', 'Near Mint', 2),
  ('excellent', 'Excellent', 3),
  ('good', 'Good', 4),
  ('played', 'Played', 5),
  ('poor', 'Poor', 6);
```

---

#### `grading_companies`

Lookup table for professional grading companies.

| Column      | Type           | Constraints              | Description                  |
| ----------- | -------------- | ------------------------ | ---------------------------- |
| `id`        | `smallint`     | `PRIMARY KEY, GENERATED` | Auto-incrementing identifier |
| `code`      | `varchar(10)`  | `NOT NULL, UNIQUE`       | Company code (PSA, BGS, CGC) |
| `name`      | `varchar(100)` | `NOT NULL`               | Full company name            |
| `min_grade` | `numeric(3,1)` | `NOT NULL, DEFAULT 1.0`  | Minimum grade value          |
| `max_grade` | `numeric(3,1)` | `NOT NULL, DEFAULT 10.0` | Maximum grade value          |

```sql
create table grading_companies (
  id smallint primary key generated always as identity,
  code varchar(10) not null unique,
  name varchar(100) not null,
  min_grade numeric(3,1) not null default 1.0,
  max_grade numeric(3,1) not null default 10.0
);

-- Seed initial data (FR-003)
insert into grading_companies (code, name) values
  ('PSA', 'Professional Sports Authenticator'),
  ('BGS', 'Beckett Grading Services'),
  ('CGC', 'Certified Guaranty Company');
```

---

#### `user_profiles`

Extended user profile information (references Supabase auth.users).

| Column         | Type           | Constraints                                                | Description                                 |
| -------------- | -------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `id`           | `uuid`         | `PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE` | User ID from auth.users                     |
| `display_name` | `varchar(100)` | `NULL`                                                     | User display name                           |
| `avatar_url`   | `text`         | `NULL`                                                     | Profile avatar URL                          |
| `is_admin`     | `boolean`      | `NOT NULL, DEFAULT false`                                  | Admin role flag                             |
| `deleted_at`   | `timestamptz`  | `NULL`                                                     | Soft-delete timestamp (30-day grace period) |
| `created_at`   | `timestamptz`  | `NOT NULL, DEFAULT now()`                                  | Record creation timestamp                   |
| `updated_at`   | `timestamptz`  | `NOT NULL, DEFAULT now()`                                  | Record update timestamp                     |

```sql
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(100),
  avatar_url text,
  is_admin boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

#### `collection_entries`

User card collection entries with quantity, condition, and optional grading info.

| Column               | Type            | Constraints                                 | Description                           |
| -------------------- | --------------- | ------------------------------------------- | ------------------------------------- |
| `id`                 | `uuid`          | `PRIMARY KEY, DEFAULT gen_random_uuid()`    | Unique identifier                     |
| `user_id`            | `uuid`          | `NOT NULL, REFERENCES auth.users(id)`       | User foreign key                      |
| `card_id`            | `uuid`          | `NOT NULL, REFERENCES cards(id)`            | Card foreign key                      |
| `condition_id`       | `smallint`      | `NOT NULL, REFERENCES card_conditions(id)`  | Condition foreign key                 |
| `quantity`           | `integer`       | `NOT NULL, DEFAULT 1, CHECK (quantity > 0)` | Number of copies                      |
| `grading_company_id` | `smallint`      | `NULL, REFERENCES grading_companies(id)`    | Grading company (optional)            |
| `grade_value`        | `numeric(3,1)`  | `NULL`                                      | Professional grade (1.0-10.0)         |
| `purchase_price`     | `numeric(10,2)` | `NULL`                                      | Purchase price in USD                 |
| `notes`              | `varchar(500)`  | `NULL`                                      | User notes (max 500 chars per FR-003) |
| `created_at`         | `timestamptz`   | `NOT NULL, DEFAULT now()`                   | Record creation timestamp             |
| `updated_at`         | `timestamptz`   | `NOT NULL, DEFAULT now()`                   | Record update timestamp               |

```sql
create table collection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  condition_id smallint not null references card_conditions(id),
  quantity integer not null default 1 check (quantity > 0),
  grading_company_id smallint references grading_companies(id),
  grade_value numeric(3,1) check (grade_value is null or (grade_value >= 1.0 and grade_value <= 10.0)),
  purchase_price numeric(10,2) check (purchase_price is null or purchase_price >= 0),
  notes varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Ensure grade company is required if grade value is provided (US-019)
  constraint grade_company_required check (
    (grade_value is null and grading_company_id is null) or
    (grade_value is not null and grading_company_id is not null)
  ),
  -- Allow multiple entries per user/card for different conditions (decision 3)
  unique (user_id, card_id, condition_id, grading_company_id, grade_value)
);
```

---

#### `user_lists`

Custom user-defined lists for organizing collection (FR-004: max 10 per user).

| Column       | Type          | Constraints                              | Description               |
| ------------ | ------------- | ---------------------------------------- | ------------------------- |
| `id`         | `uuid`        | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique identifier         |
| `user_id`    | `uuid`        | `NOT NULL, REFERENCES auth.users(id)`    | User foreign key          |
| `name`       | `varchar(50)` | `NOT NULL`                               | List name (max 50 chars)  |
| `sort_order` | `smallint`    | `NOT NULL, DEFAULT 0`                    | Display order             |
| `created_at` | `timestamptz` | `NOT NULL, DEFAULT now()`                | Record creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL, DEFAULT now()`                | Record update timestamp   |

```sql
create table user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(50) not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);
```

---

#### `list_entries`

Junction table linking collection entries to user lists (many-to-many).

| Column                | Type          | Constraints                                   | Description                  |
| --------------------- | ------------- | --------------------------------------------- | ---------------------------- |
| `id`                  | `uuid`        | `PRIMARY KEY, DEFAULT gen_random_uuid()`      | Unique identifier            |
| `list_id`             | `uuid`        | `NOT NULL, REFERENCES user_lists(id)`         | List foreign key             |
| `collection_entry_id` | `uuid`        | `NOT NULL, REFERENCES collection_entries(id)` | Collection entry foreign key |
| `created_at`          | `timestamptz` | `NOT NULL, DEFAULT now()`                     | Record creation timestamp    |

```sql
create table list_entries (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references user_lists(id) on delete cascade,
  collection_entry_id uuid not null references collection_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (list_id, collection_entry_id)
);
```

---

### 1.4 API Caching Tables

#### `api_cache`

Cache for pokemontcg.io API responses (24-hour TTL per tech stack).

| Column         | Type           | Constraints                              | Description                        |
| -------------- | -------------- | ---------------------------------------- | ---------------------------------- |
| `id`           | `uuid`         | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique identifier                  |
| `endpoint_key` | `varchar(255)` | `NOT NULL, UNIQUE`                       | Cache key (endpoint + params hash) |
| `payload`      | `jsonb`        | `NOT NULL`                               | Cached response data               |
| `fetched_at`   | `timestamptz`  | `NOT NULL, DEFAULT now()`                | When data was fetched              |
| `expires_at`   | `timestamptz`  | `NOT NULL`                               | Cache expiration timestamp         |

```sql
create table api_cache (
  id uuid primary key default gen_random_uuid(),
  endpoint_key varchar(255) not null unique,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);
```

---

### 1.5 Import and Admin Tables

#### `import_jobs`

Import job tracking for admin monitoring (FR-007, FR-008).

| Column          | Type          | Constraints                              | Description                                 |
| --------------- | ------------- | ---------------------------------------- | ------------------------------------------- |
| `id`            | `uuid`        | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique identifier                           |
| `job_type`      | `varchar(50)` | `NOT NULL`                               | Job type (e.g., 'csv_import')               |
| `status`        | `varchar(20)` | `NOT NULL, DEFAULT 'pending'`            | Status: pending, running, completed, failed |
| `started_at`    | `timestamptz` | `NULL`                                   | Job start timestamp                         |
| `completed_at`  | `timestamptz` | `NULL`                                   | Job completion timestamp                    |
| `total_records` | `integer`     | `NOT NULL, DEFAULT 0`                    | Total records processed                     |
| `success_count` | `integer`     | `NOT NULL, DEFAULT 0`                    | Successfully imported records               |
| `failure_count` | `integer`     | `NOT NULL, DEFAULT 0`                    | Failed records                              |
| `error_details` | `jsonb`       | `NULL`                                   | Error details for failed records            |
| `triggered_by`  | `uuid`        | `NULL, REFERENCES auth.users(id)`        | User who triggered (null = scheduled)       |
| `created_at`    | `timestamptz` | `NOT NULL, DEFAULT now()`                | Record creation timestamp                   |

```sql
create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type varchar(50) not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  total_records integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  error_details jsonb,
  triggered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
```

---
