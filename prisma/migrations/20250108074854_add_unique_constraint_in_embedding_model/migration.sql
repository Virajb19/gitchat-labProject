/*
  Warnings:

  - A unique constraint covering the columns `[filename,projectId]` on the table `SourceCodeEmbedding` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SourceCodeEmbedding_filename_projectId_key" ON "SourceCodeEmbedding"("filename", "projectId");
