# Database Schema

## MVP

```sql
CREATE TABLE openings (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    side        VARCHAR(5) NOT NULL CHECK (side IN ('WHITE', 'BLACK')),
    moves       JSONB NOT NULL  -- e.g. ["e4", "e5", "Nf3", "Nc6", "Bb5"]
);
```

## V1 Additions (user accounts)

```sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(20) NOT NULL UNIQUE,  -- max 20 alphanumeric characters, enforced at API layer
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE favorite_openings (
    user_id     BIGINT REFERENCES users(id),
    opening_id  BIGINT REFERENCES openings(id),
    PRIMARY KEY (user_id, opening_id)
);

CREATE TABLE chat_sessions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    opening_id  BIGINT REFERENCES openings(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  BIGINT REFERENCES chat_sessions(id),
    role        VARCHAR(10) NOT NULL CHECK (role IN ('USER', 'MODEL')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Future (Later milestone)
The `openings.moves` JSONB column stores a single move sequence for MVP.
When the practice feature with variations is introduced, this will need to be
restructured into a move tree (e.g. a separate `opening_variations` table or
a recursive move node structure) to support branching lines.
