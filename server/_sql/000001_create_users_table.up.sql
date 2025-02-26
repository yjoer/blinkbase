BEGIN;

CREATE OR REPLACE FUNCTION next_id(
    IN sequence TEXT,
    OUT identifier BIGINT
) AS $$
DECLARE
    initial_epoch BIGINT := 1640995200000;
    now_epoch BIGINT;
    shard_id INT := 0;
    seq_id BIGINT;
BEGIN
    SELECT nextval(sequence) % 1024 INTO seq_id;
    SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000) INTO now_epoch;

    identifier := (now_epoch - initial_epoch) << 22;
    identifier := identifier | (shard_id << 10);
    identifier := identifier | (seq_id);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email_address TEXT UNIQUE,
    password TEXT
);

CREATE SEQUENCE users_seq
MINVALUE 0 MAXVALUE 1023 CYCLE OWNED BY users.user_id;

ALTER TABLE users
ALTER COLUMN user_id SET DEFAULT next_id('users_seq');

COMMIT;
