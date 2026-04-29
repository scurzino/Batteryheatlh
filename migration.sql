-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "oem" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "batteryModel" TEXT NOT NULL,
    "grossCapacity" DOUBLE PRECISION,
    "netCapacity" DOUBLE PRECISION,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SohEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "soh" DOUBLE PRECISION NOT NULL,
    "mileage" DOUBLE PRECISION NOT NULL,
    "region" TEXT NOT NULL,
    "usageType" TEXT NOT NULL,
    "chargeType" TEXT NOT NULL,
    "measurementMethod" TEXT NOT NULL,
    "measurementTemp" DOUBLE PRECISION,
    "minEnvTemp" DOUBLE PRECISION,
    "maxEnvTemp" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SohEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationFlag" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "reportedById" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "initialSoc" DOUBLE PRECISION NOT NULL,
    "finalSoc" DOUBLE PRECISION NOT NULL,
    "initialEnvTemp" DOUBLE PRECISION NOT NULL,
    "finalEnvTemp" DOUBLE PRECISION NOT NULL,
    "chargeType" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_oem_model_year_batteryModel_key" ON "Vehicle"("oem", "model", "year", "batteryModel");

-- AddForeignKey
ALTER TABLE "SohEntry" ADD CONSTRAINT "SohEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SohEntry" ADD CONSTRAINT "SohEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationFlag" ADD CONSTRAINT "ModerationFlag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "SohEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationFlag" ADD CONSTRAINT "ModerationFlag_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleNote" ADD CONSTRAINT "VehicleNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleNote" ADD CONSTRAINT "VehicleNote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

