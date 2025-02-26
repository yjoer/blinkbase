BEGIN;

CREATE SCHEMA library;

CREATE TABLE library.workspaces (
    workspace_id BIGINT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE SEQUENCE library.workspaces_seq
MINVALUE 0 MAXVALUE 1023 CYCLE OWNED BY library.workspaces.workspace_id;

ALTER TABLE library.workspaces
ALTER COLUMN workspace_id SET DEFAULT next_id('library.workspaces_seq');

CREATE TABLE library.workspaces_roles (
    name TEXT PRIMARY KEY CHECK (name ~ '^[a-z_]+$')
);

INSERT INTO library.workspaces_roles (name)
VALUES ('owner');

CREATE TABLE library.users_workspaces (
    user_workspace_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    role TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (workspace_id) REFERENCES library.workspaces (workspace_id),
    FOREIGN KEY (role) REFERENCES library.workspaces_roles (name)
);

CREATE SEQUENCE library.users_workspaces_seq
MINVALUE 0 MAXVALUE 1023 CYCLE
OWNED BY library.users_workspaces.user_workspace_id;

ALTER TABLE library.users_workspaces
ALTER COLUMN user_workspace_id
SET DEFAULT next_id('library.users_workspaces_seq');

CREATE TABLE library.collections (
    collection_id BIGINT PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    rank TEXT,
    UNIQUE (workspace_id, rank),
    FOREIGN KEY (workspace_id) REFERENCES library.workspaces (workspace_id)
);

CREATE SEQUENCE library.collections_seq
MINVALUE 0 MAXVALUE 1023 CYCLE OWNED BY library.collections.collection_id;

ALTER TABLE library.collections
ALTER COLUMN collection_id SET DEFAULT next_id('library.collections_seq');

CREATE TABLE library.categories (
    category_id BIGINT PRIMARY KEY,
    collection_id BIGINT NOT NULL,
    parent_id BIGINT,
    name TEXT NOT NULL,
    FOREIGN KEY (collection_id) REFERENCES library.collections (collection_id),
    FOREIGN KEY (parent_id) REFERENCES library.categories (category_id)
);

CREATE SEQUENCE library.categories_seq
MINVALUE 0 MAXVALUE 1023 CYCLE OWNED BY library.categories.category_id;

ALTER TABLE library.categories
ALTER COLUMN category_id SET DEFAULT next_id('library.categories_seq');

COMMIT;
