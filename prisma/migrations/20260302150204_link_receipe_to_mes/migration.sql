-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "defaultBatchSize" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "recipeId" TEXT;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
