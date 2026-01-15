/**
 * ASISTEN - Phase 1 Core System
 * Database Seed Script
 *
 * This script seeds the database with initial data including:
 * - Workflow stages (PERENCANAAN, PERSIAPAN, KONTRAK, PELAKSANAAN, PEMBAYARAN, ARSIP)
 * - Default roles
 * - Admin user
 */

import { PrismaClient, WorkflowState } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // ==========================================================================
  // SEED WORKFLOW STAGES
  // ==========================================================================
  console.log('Seeding workflow stages...');

  const workflowStages = [
    {
      kode: WorkflowState.PERENCANAAN,
      nama: 'Perencanaan',
      deskripsi: 'Tahap perencanaan dan penyusunan kegiatan',
      urutan: 1,
      is_initial: true,
      is_final: false,
      color: '#3B82F6', // Blue
    },
    {
      kode: WorkflowState.PERSIAPAN,
      nama: 'Persiapan',
      deskripsi: 'Tahap persiapan pengadaan dan dokumen',
      urutan: 2,
      is_initial: false,
      is_final: false,
      color: '#8B5CF6', // Purple
    },
    {
      kode: WorkflowState.KONTRAK,
      nama: 'Kontrak',
      deskripsi: 'Tahap penandatanganan dan pengelolaan kontrak',
      urutan: 3,
      is_initial: false,
      is_final: false,
      color: '#F59E0B', // Amber
    },
    {
      kode: WorkflowState.PELAKSANAAN,
      nama: 'Pelaksanaan',
      deskripsi: 'Tahap pelaksanaan pekerjaan',
      urutan: 4,
      is_initial: false,
      is_final: false,
      color: '#10B981', // Emerald
    },
    {
      kode: WorkflowState.PEMBAYARAN,
      nama: 'Pembayaran',
      deskripsi: 'Tahap proses pembayaran dan pencairan dana',
      urutan: 5,
      is_initial: false,
      is_final: false,
      color: '#EF4444', // Red
    },
    {
      kode: WorkflowState.ARSIP,
      nama: 'Arsip',
      deskripsi: 'Tahap pengarsipan dokumen dan penutupan',
      urutan: 6,
      is_initial: false,
      is_final: true,
      color: '#6B7280', // Gray
    },
  ];

  for (const stage of workflowStages) {
    await prisma.workflow_stage.upsert({
      where: { kode: stage.kode },
      update: stage,
      create: stage,
    });
  }

  console.log(`Created ${workflowStages.length} workflow stages`);

  // ==========================================================================
  // SEED DEFAULT ROLES
  // ==========================================================================
  console.log('Seeding default roles...');

  const defaultRoles = [
    {
      kode: 'ADMIN',
      nama: 'Administrator',
      deskripsi: 'Full system access',
      level: 100,
      permissions: ['*'],
    },
    {
      kode: 'PPK',
      nama: 'Pejabat Pembuat Komitmen',
      deskripsi: 'Pejabat yang bertanggung jawab atas pelaksanaan pengadaan',
      level: 80,
      permissions: ['paket:*', 'dokumen:*', 'approval:create', 'workflow:transition'],
    },
    {
      kode: 'PPTK',
      nama: 'Pejabat Pelaksana Teknis Kegiatan',
      deskripsi: 'Pejabat yang membantu PPK dalam pelaksanaan kegiatan',
      level: 70,
      permissions: ['paket:read', 'dokumen:*', 'perjalanan:*'],
    },
    {
      kode: 'BENDAHARA',
      nama: 'Bendahara',
      deskripsi: 'Pengelola keuangan dan pembayaran',
      level: 60,
      permissions: ['uang_persediaan:*', 'kuitansi:*', 'pertanggungjawaban:*'],
    },
    {
      kode: 'VERIFIKATOR',
      nama: 'Verifikator',
      deskripsi: 'Verifikasi dokumen dan pembayaran',
      level: 50,
      permissions: ['dokumen:read', 'approval:create', 'pertanggungjawaban:verify'],
    },
    {
      kode: 'STAFF',
      nama: 'Staff',
      deskripsi: 'Staff pelaksana umum',
      level: 10,
      permissions: ['paket:read', 'dokumen:read', 'perjalanan:read'],
    },
  ];

  for (const role of defaultRoles) {
    await prisma.roles.upsert({
      where: { kode: role.kode },
      update: {
        nama: role.nama,
        deskripsi: role.deskripsi,
        level: role.level,
        permissions: role.permissions,
      },
      create: {
        kode: role.kode,
        nama: role.nama,
        deskripsi: role.deskripsi,
        level: role.level,
        permissions: role.permissions,
      },
    });
  }

  console.log(`Created ${defaultRoles.length} default roles`);

  // ==========================================================================
  // SEED ADMIN USER
  // ==========================================================================
  console.log('Seeding admin user...');

  const adminUser = await prisma.users.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@asisten.local',
      password: '$2b$10$placeholder_hash_replace_in_production', // Replace with bcrypt hash
      nama: 'System Administrator',
      is_active: true,
    },
  });

  // Assign admin role to admin user
  const adminRole = await prisma.roles.findUnique({
    where: { kode: 'ADMIN' },
  });

  if (adminRole) {
    await prisma.user_roles.upsert({
      where: {
        user_id_role_id: {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      },
      update: {},
      create: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    });
  }

  console.log('Admin user created and role assigned');

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n========================================');
  console.log('Database seed completed successfully!');
  console.log('========================================');
  console.log(`Workflow Stages: ${workflowStages.length}`);
  console.log(`Roles: ${defaultRoles.length}`);
  console.log(`Users: 1 (admin)`);
  console.log('========================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
