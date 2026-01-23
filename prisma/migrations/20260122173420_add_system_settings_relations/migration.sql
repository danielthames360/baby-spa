-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_defaultPackageId_fkey" FOREIGN KEY ("defaultPackageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
