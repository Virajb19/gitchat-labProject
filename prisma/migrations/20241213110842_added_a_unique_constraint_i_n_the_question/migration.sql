/*
  Warnings:

  - A unique constraint covering the columns `[answer,projectId]` on the table `Question` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Question_answer_projectId_key" ON "Question"("answer", "projectId");
