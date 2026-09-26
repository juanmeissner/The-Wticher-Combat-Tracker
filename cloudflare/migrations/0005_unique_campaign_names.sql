PRAGMA foreign_keys = ON;

ALTER TABLE cloud_campaigns
    ADD COLUMN name_key TEXT NOT NULL DEFAULT '';

-- Campanhas antigas podiam compartilhar o mesmo nome dentro de uma conta.
-- A primeira preserva o nome original; as demais recebem o próprio ID como
-- sufixo para continuarem identificáveis sem perder qualquer snapshot.
WITH ranked AS MATERIALIZED (
    SELECT rowid AS campaign_rowid,
           id,
           name,
           ROW_NUMBER() OVER (
               PARTITION BY owner_user_id, lower(trim(name))
               ORDER BY created_at ASC, id ASC
           ) AS duplicate_position
    FROM cloud_campaigns
)
UPDATE cloud_campaigns
SET name = (
    SELECT CASE
        WHEN ranked.duplicate_position = 1 THEN trim(ranked.name)
        ELSE substr(trim(ranked.name), 1, 52) || ' [' || ranked.id || ']'
    END
    FROM ranked
    WHERE ranked.campaign_rowid = cloud_campaigns.rowid
);

UPDATE cloud_campaigns
SET name_key = lower(trim(name));

CREATE UNIQUE INDEX IF NOT EXISTS idx_cloud_campaigns_owner_name
    ON cloud_campaigns(owner_user_id, name_key);
