ALTER TABLE founding_cashflow
  ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN;
