/*
  Warnings:

  - You are about to drop the column `id_auditory` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `id_device` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `auditoryId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "id_auditory",
DROP COLUMN "id_device",
ADD COLUMN     "auditoryId" TEXT NOT NULL,
ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_auditoryId_fkey" FOREIGN KEY ("auditoryId") REFERENCES "Auditory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
