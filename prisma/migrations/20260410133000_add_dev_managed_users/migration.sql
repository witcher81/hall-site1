CREATE TABLE "DevManagedUser" (
    "id" SERIAL NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "managedUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevManagedUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DevManagedUser_adminUserId_managedUserId_key" ON "DevManagedUser"("adminUserId", "managedUserId");
CREATE INDEX "DevManagedUser_adminUserId_idx" ON "DevManagedUser"("adminUserId");
CREATE INDEX "DevManagedUser_managedUserId_idx" ON "DevManagedUser"("managedUserId");

ALTER TABLE "DevManagedUser"
ADD CONSTRAINT "DevManagedUser_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DevManagedUser"
ADD CONSTRAINT "DevManagedUser_managedUserId_fkey"
FOREIGN KEY ("managedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
