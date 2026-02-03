-- AddCertificatesToDoctorProfile

ALTER TABLE "DoctorProfile" ADD COLUMN "certificates" JSONB NOT NULL DEFAULT '[]';
