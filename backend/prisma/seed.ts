import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SPECIALTIES = [
  { name: 'General Medicine', description: 'Primary care and general health concerns' },
  { name: 'Cardiology', description: 'Heart and cardiovascular system' },
  { name: 'Dermatology', description: 'Skin, hair, and nail conditions' },
  { name: 'Pediatrics', description: 'Healthcare for infants, children, and adolescents' },
  { name: 'Orthopedics', description: 'Bones, joints, ligaments, and muscles' },
  { name: 'Neurology', description: 'Brain and nervous system disorders' },
  { name: 'Psychiatry', description: 'Mental health and psychiatric disorders' },
  { name: 'Gastroenterology', description: 'Digestive system and liver disorders' },
  { name: 'Endocrinology', description: 'Hormones and metabolic disorders' },
  { name: 'Ophthalmology', description: 'Eye and vision care' },
  { name: 'ENT (Otolaryngology)', description: 'Ear, nose, and throat conditions' },
  { name: 'Pulmonology', description: 'Respiratory system and lungs' },
  { name: 'Nephrology', description: 'Kidney diseases and disorders' },
  { name: 'Urology', description: 'Urinary tract and male reproductive system' },
  { name: 'Gynecology', description: 'Female reproductive health' },
  { name: 'Obstetrics', description: 'Pregnancy, childbirth, and postpartum care' },
  { name: 'Oncology', description: 'Cancer diagnosis and treatment' },
  { name: 'Rheumatology', description: 'Arthritis and autoimmune diseases' },
  { name: 'Hematology', description: 'Blood disorders and diseases' },
  { name: 'Infectious Disease', description: 'Infections and communicable diseases' },
  { name: 'Allergy & Immunology', description: 'Allergies and immune system disorders' },
  { name: 'Anesthesiology', description: 'Pain management and anesthesia' },
  { name: 'Emergency Medicine', description: 'Acute illness and injury care' },
  { name: 'Family Medicine', description: 'Comprehensive care for all ages' },
  { name: 'Internal Medicine', description: 'Adult disease prevention and treatment' },
  { name: 'Sports Medicine', description: 'Sports injuries and performance' },
  { name: 'Geriatrics', description: 'Healthcare for older adults' },
  { name: 'Pain Management', description: 'Chronic and acute pain treatment' },
  { name: 'Sleep Medicine', description: 'Sleep disorders and sleep health' },
  { name: 'Physical Medicine & Rehabilitation', description: 'Rehabilitation and functional restoration' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed Specialties
  console.log('Creating specialties...');
  for (const specialty of SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { name: specialty.name },
      update: {},
      create: specialty,
    });
  }
  console.log(`✅ Created ${SPECIALTIES.length} specialties`);

  // ── Admin user ──────────────────────────────────────────
  console.log('Creating admin user...');
  const adminEmail = 'admin@medbuddy.com';
  const adminPassword = await bcrypt.hash('Admin1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminPassword },
    create: {
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user ready — email: ${admin.email}  password: Admin1234`);

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
