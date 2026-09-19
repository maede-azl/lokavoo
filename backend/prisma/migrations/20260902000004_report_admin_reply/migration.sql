-- AlterTable: problem_reports gets an admin reply
ALTER TABLE "problem_reports" ADD COLUMN     "admin_reply" TEXT,
ADD COLUMN     "replied_at" TIMESTAMP(3);
