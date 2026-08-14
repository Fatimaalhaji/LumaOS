ALTER TABLE "memories" ALTER COLUMN "source" SET DEFAULT 'USER';
UPDATE "memories" SET "source" = 'USER' WHERE "source" = 'manual';
ALTER TABLE "memories" ADD CONSTRAINT "memories_source_check" CHECK ("source" IN ('USER', 'SYSTEM', 'ASSISTANT'));
ALTER TABLE "memories" ADD CONSTRAINT "memories_importance_check" CHECK ("importance" BETWEEN 1 AND 5);
