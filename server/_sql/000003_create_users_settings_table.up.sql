BEGIN;

CREATE TABLE library.users_settings (
    user_setting_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    default_workspace_id BIGINT,
    UNIQUE (user_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (default_workspace_id)
    REFERENCES library.workspaces (workspace_id)
);

CREATE SEQUENCE library.users_settings_seq
MINVALUE 0 MAXVALUE 1023 CYCLE OWNED BY library.users_settings.user_setting_id;

ALTER TABLE library.users_settings
ALTER COLUMN user_setting_id SET DEFAULT next_id('library.users_settings_seq');

COMMIT;
