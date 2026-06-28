-- Seed data for SubGuard (PostgreSQL / Supabase Edition)

-- 1. Insert Default User (password: password123)
INSERT INTO users (id, username, email, password, created_at)
VALUES (1, 'john_doe', 'john@example.com', '$2a$10$obrL/92PXI1v8joxDYtwueFQFw.OuZnok2DdcIRTJ2IoLyzSsVBnS', '2026-03-01 10:00:00')
ON CONFLICT (id) DO NOTHING;

-- Reset serial sequence after manual ID inserts
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users), 1), false);

-- 2. Insert Active Subscriptions
INSERT INTO subscriptions (id, user_id, name, category, amount, billing_cycle, next_renewal_date, utilization_rate, last_used_date) VALUES
(1, 1, 'AWS Cloud Hosting', 'Cloud', 9999.00, 'MONTHLY', '2026-07-02', 0.90, '2026-06-18'),
(2, 1, 'GitHub Copilot', 'DevTools', 599.00, 'MONTHLY', '2026-06-25', 0.95, '2026-06-18'),
(3, 1, 'Netflix Premium', 'Entertainment', 649.00, 'MONTHLY', '2026-06-28', 0.85, '2026-06-17'),
(4, 1, 'Slack Pro', 'Collaboration', 750.00, 'MONTHLY', '2026-07-05', 0.30, '2026-06-12'),
(5, 1, 'Zoom Pro', 'Collaboration', 11999.00, 'ANNUAL', '2027-06-10', 0.15, '2026-05-20'),
(6, 1, 'Spotify Family', 'Entertainment', 179.00, 'MONTHLY', '2026-06-20', 0.95, '2026-06-18'),
(7, 1, 'Microsoft 365', 'Collaboration', 6199.00, 'ANNUAL', '2026-12-15', 0.80, '2026-06-18'),
(8, 1, 'ChatGPT Plus', 'DevTools', 1999.00, 'MONTHLY', '2026-07-01', 0.90, '2026-06-18'),
(9, 1, 'Claude Pro', 'DevTools', 1999.00, 'MONTHLY', '2026-06-29', 0.10, '2026-06-05'),
(10, 1, 'Framer Design', 'Other', 1500.00, 'MONTHLY', '2026-07-10', 0.05, '2026-05-10')
ON CONFLICT (id) DO NOTHING;

SELECT setval('subscriptions_id_seq', COALESCE((SELECT MAX(id)+1 FROM subscriptions), 1), false);

-- 3. Insert Billing History
INSERT INTO payment_history (id, user_id, subscription_name, amount, date) VALUES
(1, 1, 'AWS Cloud Hosting', 7900.00, '2026-03-02'),
(2, 1, 'GitHub Copilot', 599.00, '2026-03-25'),
(3, 1, 'Netflix Premium', 599.00, '2026-03-28'),
(4, 1, 'Slack Pro', 750.00, '2026-03-05'),
(5, 1, 'Spotify Family', 179.00, '2026-03-20'),
(6, 1, 'ChatGPT Plus', 1999.00, '2026-03-01'),
(7, 1, 'Claude Pro', 1999.00, '2026-03-29'),
(8, 1, 'Framer Design', 1500.00, '2026-03-10'),
(9, 1, 'AWS Cloud Hosting', 8900.00, '2026-04-02'),
(10, 1, 'GitHub Copilot', 599.00, '2026-04-25'),
(11, 1, 'Netflix Premium', 599.00, '2026-04-28'),
(12, 1, 'Slack Pro', 750.00, '2026-04-05'),
(13, 1, 'Spotify Family', 179.00, '2026-04-20'),
(14, 1, 'ChatGPT Plus', 1999.00, '2026-04-01'),
(15, 1, 'Claude Pro', 1999.00, '2026-04-29'),
(16, 1, 'Framer Design', 1500.00, '2026-04-10'),
(17, 1, 'AWS Cloud Hosting', 9999.00, '2026-05-02'),
(18, 1, 'GitHub Copilot', 599.00, '2026-05-25'),
(19, 1, 'Netflix Premium', 649.00, '2026-05-28'),
(20, 1, 'Slack Pro', 750.00, '2026-05-05'),
(21, 1, 'Spotify Family', 179.00, '2026-05-20'),
(22, 1, 'ChatGPT Plus', 1999.00, '2026-05-01'),
(23, 1, 'Claude Pro', 1999.00, '2026-05-29'),
(24, 1, 'Framer Design', 1500.00, '2026-05-10'),
(25, 1, 'Zoom Pro', 11999.00, '2026-05-10'),
(26, 1, 'AWS Cloud Hosting', 9999.00, '2026-06-02'),
(27, 1, 'GitHub Copilot', 599.00, '2026-06-25'),
(28, 1, 'Netflix Premium', 649.00, '2026-06-28'),
(29, 1, 'Slack Pro', 1500.00, '2026-06-05'),
(30, 1, 'Spotify Family', 179.00, '2026-06-20'),
(31, 1, 'ChatGPT Plus', 1999.00, '2026-06-01'),
(32, 1, 'Claude Pro', 1999.00, '2026-06-29'),
(33, 1, 'Framer Design', 1500.00, '2026-06-10')
ON CONFLICT (id) DO NOTHING;

SELECT setval('payment_history_id_seq', COALESCE((SELECT MAX(id)+1 FROM payment_history), 1), false);

-- 4. Insert Budgets
INSERT INTO budgets (user_id, category, amount, month) VALUES
(1, 'TOTAL', 30000.00, '2026-05'),
(1, 'Cloud', 12000.00, '2026-05'),
(1, 'Collaboration', 10000.00, '2026-05'),
(1, 'DevTools', 5000.00, '2026-05'),
(1, 'Entertainment', 1000.00, '2026-05'),
(1, 'TOTAL', 35000.00, '2026-06'),
(1, 'Cloud', 12000.00, '2026-06'),
(1, 'Collaboration', 10000.00, '2026-06'),
(1, 'DevTools', 5000.00, '2026-06'),
(1, 'Entertainment', 1000.00, '2026-06')
ON CONFLICT (user_id, category, month) DO UPDATE SET amount = EXCLUDED.amount;

SELECT setval('budgets_id_seq', COALESCE((SELECT MAX(id)+1 FROM budgets), 1), false);
