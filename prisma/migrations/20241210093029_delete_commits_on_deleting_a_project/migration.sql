-- DropForeignKey
ALTER TABLE "Commit" DROP CONSTRAINT "Commit_projectId_fkey";

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
