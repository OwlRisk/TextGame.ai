-- Coins recharge at 1:100 (1 USD = 100 coins)
-- Deactivate non-1:100 packages; ensure 1:100 packages exist and are active

UPDATE token_packages SET is_active = false WHERE tokens != price_cents;

INSERT INTO token_packages (name, tokens, price_cents, bonus_percentage, is_active)
SELECT v.name, v.tokens, v.price_cents, v.bonus_percentage, v.is_active
FROM (VALUES
  ('100 Coins', 100, 100, 0, true),
  ('500 Coins', 500, 500, 0, true),
  ('1,000 Coins', 1000, 1000, 0, true),
  ('2,000 Coins', 2000, 2000, 0, true),
  ('5,000 Coins', 5000, 5000, 0, true),
  ('10,000 Coins', 10000, 10000, 0, true)
) AS v(name, tokens, price_cents, bonus_percentage, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM token_packages p WHERE p.tokens = v.tokens AND p.price_cents = v.price_cents
);

UPDATE token_packages SET is_active = true WHERE tokens = price_cents AND tokens IN (100, 500, 1000, 2000, 5000, 10000);
