-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "call_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "route_count" INTEGER NOT NULL DEFAULT 0;
