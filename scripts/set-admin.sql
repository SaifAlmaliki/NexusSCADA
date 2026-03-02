-- Set a user to ADMIN by email.
-- 1. Replace the email below with the actual user email.
-- 2. Run this SQL in your database client (pgAdmin, DBeaver, psql, etc.).

UPDATE "User" SET role = 'ADMIN' WHERE email = 'saif.wsm@gmail.com';
