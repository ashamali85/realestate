import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Governorate -> areas (English, Arabic). A representative, verified set of the
// most common residential areas per governorate. The admin can add the rest
// from the backend, so this is a starting point, not an exhaustive list.
const GEO: Array<{ en: string; ar: string; areas: Array<[string, string]> }> = [
  {
    en: 'Capital', ar: 'العاصمة',
    areas: [
      ['Kuwait City', 'مدينة الكويت'],
      ['Dasma', 'الدسمة'],
      ['Daiya', 'الدعية'],
      ['Abdullah Al-Salem', 'ضاحية عبد الله السالم'],
      ['Mansouriya', 'المنصورية'],
      ['Adailiya', 'العديلية'],
      ['Khaldiya', 'الخالدية'],
      ['Kaifan', 'كيفان'],
      ['Shamiya', 'الشامية'],
      ['Rawda', 'الروضة'],
      ['Qadsiya', 'القادسية'],
      ['Faiha', 'الفيحاء'],
      ['Nuzha', 'النزهة'],
      ['Surra', 'السرة'],
      ['Qortuba', 'قرطبة'],
      ['Yarmouk', 'اليرموك'],
      ['Sharq', 'شرق'],
      ['Jabriya', 'الجابرية']
    ]
  },
  {
    en: 'Hawalli', ar: 'حولي',
    areas: [
      ['Hawalli', 'حولي'],
      ['Salmiya', 'السالمية'],
      ['Rumaithiya', 'الرميثية'],
      ['Bayan', 'بيان'],
      ['Mishref', 'مشرف'],
      ['Salwa', 'سلوى'],
      ['Jabriya', 'الجابرية'],
      ['Shaab', 'الشعب'],
      ['Nugra', 'النقرة'],
      ['Hitteen', 'حطين'],
      ['Zahra', 'الزهراء'],
      ['Salam', 'السلام'],
      ['Shuhada', 'الشهداء'],
      ['Siddiq', 'الصديق']
    ]
  },
  {
    en: 'Farwaniya', ar: 'الفروانية',
    areas: [
      ['Farwaniya', 'الفروانية'],
      ['Khaitan', 'خيطان'],
      ['Jleeb Al-Shuyoukh', 'جليب الشيوخ'],
      ['Abbasiya', 'العباسية'],
      ['Rabiya', 'الرابية'],
      ['Andalous', 'الأندلس'],
      ['Ardiya', 'العارضية'],
      ['Rehab', 'الرحاب'],
      ['Ishbiliya', 'إشبيلية'],
      ['Firdous', 'الفردوس'],
      ['Omariya', 'العمرية'],
      ['Dhajeej', 'الضجيج'],
      ['Sabah Al-Nasser', 'صباح الناصر']
    ]
  },
  {
    en: 'Ahmadi', ar: 'الأحمدي',
    areas: [
      ['Ahmadi', 'الأحمدي'],
      ['Fahaheel', 'الفحيحيل'],
      ['Mangaf', 'المنقف'],
      ['Abu Halifa', 'أبو حليفة'],
      ['Fintas', 'الفنطاس'],
      ['Mahboula', 'المهبولة'],
      ['Riqqa', 'الرقة'],
      ['Hadiya', 'هدية'],
      ['Sabahiya', 'الصباحية'],
      ['Jaber Al-Ali', 'جابر العلي'],
      ['Fahad Al-Ahmad', 'فهد الأحمد'],
      ['Ali Sabah Al-Salem', 'علي صباح السالم'],
      ['Wafra', 'الوفرة'],
      ['Sabah Al-Ahmad', 'صباح الأحمد']
    ]
  },
  {
    en: 'Jahra', ar: 'الجهراء',
    areas: [
      ['Jahra', 'الجهراء'],
      ['Saad Al-Abdullah', 'سعد العبد الله'],
      ['Naeem', 'النعيم'],
      ['Naseem', 'النسيم'],
      ['Qasr', 'القصر'],
      ['Oyoun', 'العيون'],
      ['Waha', 'الواحة'],
      ['Taima', 'تيماء'],
      ['Sulaibiya', 'الصليبية'],
      ['Amghara', 'أمغرة'],
      ['Kabd', 'كبد']
    ]
  },
  {
    en: 'Mubarak Al-Kabeer', ar: 'مبارك الكبير',
    areas: [
      ['Mubarak Al-Kabeer', 'مبارك الكبير'],
      ['Qurain', 'القرين'],
      ['Adan', 'العدان'],
      ['Qusour', 'القصور'],
      ['Sabah Al-Salem', 'صباح السالم'],
      ['Messila', 'المسيلة'],
      ['Fnaitees', 'الفنيطيس'],
      ['Abu Fatira', 'أبو فطيرة'],
      ['Funaitees', 'الفنيطيس'],
      ['Wista', 'الوسطى']
    ]
  }
];

const PURPOSES: Array<[string, string]> = [
  ['Purchase decision', 'قرار الشراء'],
  ['Pre-sale inspection', 'فحص ما قبل البيع'],
  ['Investment valuation', 'تقييم استثماري'],
  ['General condition report', 'تقرير الحالة العامة']
];

const STATUSES: Array<[string, string]> = [
  ['Ready / occupied', 'جاهز / مأهول'],
  ['Vacant', 'شاغر'],
  ['Under construction', 'تحت الإنشاء'],
  ['Needs renovation', 'يحتاج ترميم']
];

const EXTERIORS: Array<[string, string]> = [
  ['Excellent', 'ممتاز'],
  ['Good', 'جيد'],
  ['Fair', 'مقبول'],
  ['Poor', 'ضعيف']
];

const ELEVATORS: Array<[string, string]> = [
  ['None', 'لا يوجد'],
  ['One elevator', 'مصعد واحد'],
  ['Two or more', 'مصعدان أو أكثر'],
  ['Present, not working', 'موجود، لا يعمل']
];

const ACS: Array<[string, string]> = [
  ['Central', 'مركزي'],
  ['Split units', 'وحدات سبليت'],
  ['Window units', 'وحدات شباك'],
  ['None', 'لا يوجد']
];

// Separate status list for criteria measures — independent of request status.
// Third value is the 0–3 score used for evaluation averages.
const MEASURE_STATUSES: Array<[string, string, number]> = [
  ['Compliant', 'مطابق', 3],
  ['Minor issue', 'ملاحظة بسيطة', 2],
  ['Major issue', 'ملاحظة جوهرية', 1],
  ['Not applicable', 'لا ينطبق', 0]
];

async function seedLookup(
  model: {
    upsert: (args: {
      where: { nameEn: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<unknown>;
  },
  rows: Array<[string, string]>
) {
  for (let i = 0; i < rows.length; i++) {
    const [nameEn, nameAr] = rows[i]!;
    await model.upsert({
      where: { nameEn },
      create: { nameEn, nameAr, displayOrder: i },
      update: { nameAr, displayOrder: i }
    });
  }
}

async function main() {
  console.log('Seeding inspection system…');

  // Geography
  for (let gi = 0; gi < GEO.length; gi++) {
    const g = GEO[gi]!;
    const gov = await prisma.governorate.upsert({
      where: { nameEn: g.en },
      create: { nameEn: g.en, nameAr: g.ar, displayOrder: gi },
      update: { nameAr: g.ar, displayOrder: gi }
    });
    for (let ai = 0; ai < g.areas.length; ai++) {
      const [nameEn, nameAr] = g.areas[ai]!;
      await prisma.area.upsert({
        where: { governorateId_nameEn: { governorateId: gov.id, nameEn } },
        create: { nameEn, nameAr, displayOrder: ai, governorateId: gov.id },
        update: { nameAr, displayOrder: ai }
      });
    }
    console.log(`  ${g.en}: ${g.areas.length} areas`);
  }

  // Lookups
  await seedLookup(prisma.purposeOption, PURPOSES);
  await seedLookup(prisma.statusOption, STATUSES);
  for (let i = 0; i < MEASURE_STATUSES.length; i++) {
    const [nameEn, nameAr, score] = MEASURE_STATUSES[i]!;
    await prisma.measureStatusOption.upsert({
      where: { nameEn },
      create: { nameEn, nameAr, score, displayOrder: i },
      update: { nameAr, score, displayOrder: i }
    });
  }
  await seedLookup(prisma.exteriorOption, EXTERIORS);
  await seedLookup(prisma.elevatorOption, ELEVATORS);
  await seedLookup(prisma.acOption, ACS);
  console.log('  lookups seeded');

  // First super admin
  const username = (process.env.SEED_ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'change-me-immediately';
  const name = process.env.SEED_ADMIN_NAME || 'Super Admin';
  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    await prisma.user.create({
      data: {
        username,
        name,
        role: 'SUPER_ADMIN',
        passwordHash: await bcrypt.hash(password, 10)
      }
    });
    console.log(`  super admin "${username}" created`);
  } else {
    console.log(`  super admin "${username}" already exists — left unchanged`);
  }

  const govCount = await prisma.governorate.count();
  const areaCount = await prisma.area.count();

  // One example evaluation criteria with a few measures (only if none exist).
  const criteriaCount = await prisma.criteria.count();
  if (criteriaCount === 0) {
    await prisma.criteria.create({
      data: {
        nameEn: 'Structural Safety',
        nameAr: 'السلامة الإنشائية',
        measures: {
          create: [
            { nameEn: 'Foundation condition', nameAr: 'حالة الأساسات', displayOrder: 0 },
            { nameEn: 'Load-bearing walls', nameAr: 'الجدران الحاملة', displayOrder: 1 },
            { nameEn: 'Roof and ceilings', nameAr: 'السقف والأسقف', displayOrder: 2 }
          ]
        }
      }
    });
    console.log('  example criteria seeded');
  }

  console.log(`Done. ${govCount} governorates, ${areaCount} areas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
