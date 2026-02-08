/**
 * ASISTEN - Database Seed Script
 *
 * Seeds the database with:
 * - Workflow stages
 * - Default roles
 * - Admin user (admin/admin123)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // ==========================================================================
  // SEED WORKFLOW STAGES
  // ==========================================================================
  console.log('Seeding workflow stages...');

  const workflowStages = [
    {
      kode: 'PERENCANAAN',
      nama: 'Perencanaan',
      deskripsi: 'Tahap perencanaan dan penyusunan kegiatan',
      urutan: 1,
      is_initial: true,
      is_final: false,
    },
    {
      kode: 'PERSIAPAN',
      nama: 'Persiapan',
      deskripsi: 'Tahap persiapan pengadaan dan dokumen',
      urutan: 2,
      is_initial: false,
      is_final: false,
    },
    {
      kode: 'KONTRAK',
      nama: 'Kontrak',
      deskripsi: 'Tahap penandatanganan dan pengelolaan kontrak',
      urutan: 3,
      is_initial: false,
      is_final: false,
    },
    {
      kode: 'PELAKSANAAN',
      nama: 'Pelaksanaan',
      deskripsi: 'Tahap pelaksanaan pekerjaan',
      urutan: 4,
      is_initial: false,
      is_final: false,
    },
    {
      kode: 'PEMBAYARAN',
      nama: 'Pembayaran',
      deskripsi: 'Tahap proses pembayaran dan pencairan dana',
      urutan: 5,
      is_initial: false,
      is_final: false,
    },
    {
      kode: 'ARSIP',
      nama: 'Arsip',
      deskripsi: 'Tahap pengarsipan dokumen dan penutupan',
      urutan: 6,
      is_initial: false,
      is_final: true,
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
      kode: 'KPA',
      nama: 'Kuasa Pengguna Anggaran',
      deskripsi: 'Pejabat yang memperoleh kuasa dari PA untuk mengelola anggaran',
      level: 90,
      permissions: ['paket:*', 'dokumen:*', 'approval:approve', 'workflow:transition', 'keuangan:*', 'master:read', 'honorarium:*', 'sk:*'],
    },
    {
      kode: 'PPK',
      nama: 'Pejabat Pembuat Komitmen',
      deskripsi: 'Pejabat yang bertanggung jawab atas pelaksanaan pengadaan',
      level: 80,
      permissions: ['paket:*', 'dokumen:*', 'approval:approve', 'workflow:transition', 'permintaan:*', 'kepanitiaan:*', 'hps:*', 'perjalanan:*', 'sk:*'],
    },
    {
      kode: 'PPSPM',
      nama: 'Pejabat Penandatangan SPM',
      deskripsi: 'Pejabat yang menandatangani Surat Perintah Membayar',
      level: 75,
      permissions: ['keuangan:*', 'dokumen:read', 'paket:read', 'approval:approve', 'honorarium:read'],
    },
    {
      kode: 'OPERATOR',
      nama: 'Operator',
      deskripsi: 'Operator data entry dan pengelolaan dokumen',
      level: 20,
      permissions: ['paket:read', 'paket:create', 'paket:update', 'dokumen:read', 'dokumen:create', 'dokumen:update', 'dokumen:export', 'permintaan:read', 'permintaan:create', 'permintaan:update', 'perjalanan:read', 'perjalanan:create', 'perjalanan:update', 'master:read', 'master:create', 'master:update', 'hps:read', 'hps:create', 'hps:update', 'kepanitiaan:read', 'kepanitiaan:create', 'kepanitiaan:update', 'honorarium:read', 'honorarium:create', 'honorarium:update', 'sk:read', 'sk:create', 'sk:update', 'keuangan:read', 'keuangan:create'],
    },
  ];

  for (const role of defaultRoles) {
    const permStr = JSON.stringify(role.permissions);
    await prisma.roles.upsert({
      where: { kode: role.kode },
      update: {
        nama: role.nama,
        deskripsi: role.deskripsi,
        level: role.level,
        permissions: permStr,
      },
      create: {
        kode: role.kode,
        nama: role.nama,
        deskripsi: role.deskripsi,
        level: role.level,
        permissions: permStr,
      },
    });
  }

  console.log(`Created ${defaultRoles.length} default roles`);

  // ==========================================================================
  // SEED ADMIN USER
  // ==========================================================================
  console.log('Seeding admin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.users.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
    },
    create: {
      username: 'admin',
      email: 'admin@asisten.local',
      password: hashedPassword,
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
  console.log('  Username: admin');
  console.log('  Password: admin123');

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n========================================');
  console.log('Database seed completed successfully!');
  console.log('========================================');
  console.log(`Workflow Stages: ${workflowStages.length}`);
  console.log(`Roles: ${defaultRoles.length}`);
  console.log(`Users: 1 (admin/admin123)`);
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
