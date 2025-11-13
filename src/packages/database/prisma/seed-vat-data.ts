import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedVATData() {
  console.log('🌍 Seeding countries...');

  // Seed EU Member States (27 countries)
  const euCountries = [
    { id: 'AT', alpha3: 'AUT', numericCode: '040', nameEn: 'Austria', isEuMember: true, isEeaMember: true, standardVatRate: 20.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'BE', alpha3: 'BEL', numericCode: '056', nameEn: 'Belgium', isEuMember: true, isEeaMember: true, standardVatRate: 21.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'BG', alpha3: 'BGR', numericCode: '100', nameEn: 'Bulgaria', nameLocal: 'България', isEuMember: true, isEeaMember: true, standardVatRate: 20.00, currencyCode: 'BGN', region: 'Europe' },
    { id: 'HR', alpha3: 'HRV', numericCode: '191', nameEn: 'Croatia', isEuMember: true, isEeaMember: true, standardVatRate: 25.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'CY', alpha3: 'CYP', numericCode: '196', nameEn: 'Cyprus', isEuMember: true, isEeaMember: true, standardVatRate: 19.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'CZ', alpha3: 'CZE', numericCode: '203', nameEn: 'Czech Republic', isEuMember: true, isEeaMember: true, standardVatRate: 21.00, currencyCode: 'CZK', region: 'Europe' },
    { id: 'DK', alpha3: 'DNK', numericCode: '208', nameEn: 'Denmark', isEuMember: true, isEeaMember: true, standardVatRate: 25.00, currencyCode: 'DKK', region: 'Europe' },
    { id: 'EE', alpha3: 'EST', numericCode: '233', nameEn: 'Estonia', isEuMember: true, isEeaMember: true, standardVatRate: 22.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'FI', alpha3: 'FIN', numericCode: '246', nameEn: 'Finland', isEuMember: true, isEeaMember: true, standardVatRate: 25.50, currencyCode: 'EUR', region: 'Europe' },
    { id: 'FR', alpha3: 'FRA', numericCode: '250', nameEn: 'France', isEuMember: true, isEeaMember: true, standardVatRate: 20.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'DE', alpha3: 'DEU', numericCode: '276', nameEn: 'Germany', nameLocal: 'Deutschland', isEuMember: true, isEeaMember: true, standardVatRate: 19.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'GR', alpha3: 'GRC', numericCode: '300', nameEn: 'Greece', isEuMember: true, isEeaMember: true, standardVatRate: 24.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'HU', alpha3: 'HUN', numericCode: '348', nameEn: 'Hungary', isEuMember: true, isEeaMember: true, standardVatRate: 27.00, currencyCode: 'HUF', region: 'Europe' },
    { id: 'IE', alpha3: 'IRL', numericCode: '372', nameEn: 'Ireland', isEuMember: true, isEeaMember: true, standardVatRate: 23.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'IT', alpha3: 'ITA', numericCode: '380', nameEn: 'Italy', isEuMember: true, isEeaMember: true, standardVatRate: 22.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'LV', alpha3: 'LVA', numericCode: '428', nameEn: 'Latvia', isEuMember: true, isEeaMember: true, standardVatRate: 21.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'LT', alpha3: 'LTU', numericCode: '440', nameEn: 'Lithuania', isEuMember: true, isEeaMember: true, standardVatRate: 21.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'LU', alpha3: 'LUX', numericCode: '442', nameEn: 'Luxembourg', isEuMember: true, isEeaMember: true, standardVatRate: 17.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'MT', alpha3: 'MLT', numericCode: '470', nameEn: 'Malta', isEuMember: true, isEeaMember: true, standardVatRate: 18.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'NL', alpha3: 'NLD', numericCode: '528', nameEn: 'Netherlands', isEuMember: true, isEeaMember: true, standardVatRate: 21.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'PL', alpha3: 'POL', numericCode: '616', nameEn: 'Poland', isEuMember: true, isEeaMember: true, standardVatRate: 23.00, currencyCode: 'PLN', region: 'Europe' },
    { id: 'PT', alpha3: 'PRT', numericCode: '620', nameEn: 'Portugal', isEuMember: true, isEeaMember: true, standardVatRate: 23.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'RO', alpha3: 'ROU', numericCode: '642', nameEn: 'Romania', isEuMember: true, isEeaMember: true, standardVatRate: 19.00, currencyCode: 'RON', region: 'Europe' },
    { id: 'SK', alpha3: 'SVK', numericCode: '703', nameEn: 'Slovakia', isEuMember: true, isEeaMember: true, standardVatRate: 23.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'SI', alpha3: 'SVN', numericCode: '705', nameEn: 'Slovenia', isEuMember: true, isEeaMember: true, standardVatRate: 22.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'ES', alpha3: 'ESP', numericCode: '724', nameEn: 'Spain', isEuMember: true, isEeaMember: true, standardVatRate: 21.00, currencyCode: 'EUR', region: 'Europe' },
    { id: 'SE', alpha3: 'SWE', numericCode: '752', nameEn: 'Sweden', isEuMember: true, isEeaMember: true, standardVatRate: 25.00, currencyCode: 'SEK', region: 'Europe' },
  ];

  // EEA Members (not in EU)
  const eeaCountries = [
    { id: 'IS', alpha3: 'ISL', numericCode: '352', nameEn: 'Iceland', isEuMember: false, isEeaMember: true, standardVatRate: 24.00, currencyCode: 'ISK', region: 'Europe' },
    { id: 'LI', alpha3: 'LIE', numericCode: '438', nameEn: 'Liechtenstein', isEuMember: false, isEeaMember: true, standardVatRate: 8.10, currencyCode: 'CHF', region: 'Europe' },
    { id: 'NO', alpha3: 'NOR', numericCode: '578', nameEn: 'Norway', isEuMember: false, isEeaMember: true, standardVatRate: 25.00, currencyCode: 'NOK', region: 'Europe' },
  ];

  // Other Major Countries
  const otherCountries = [
    { id: 'GB', alpha3: 'GBR', numericCode: '826', nameEn: 'United Kingdom', isEuMember: false, isEeaMember: false, standardVatRate: 20.00, currencyCode: 'GBP', region: 'Europe' },
    { id: 'CH', alpha3: 'CHE', numericCode: '756', nameEn: 'Switzerland', isEuMember: false, isEeaMember: false, standardVatRate: 8.10, currencyCode: 'CHF', region: 'Europe' },
    { id: 'US', alpha3: 'USA', numericCode: '840', nameEn: 'United States', isEuMember: false, isEeaMember: false, standardVatRate: null, currencyCode: 'USD', region: 'Americas' },
    { id: 'CA', alpha3: 'CAN', numericCode: '124', nameEn: 'Canada', isEuMember: false, isEeaMember: false, standardVatRate: 5.00, currencyCode: 'CAD', region: 'Americas' },
    { id: 'AU', alpha3: 'AUS', numericCode: '036', nameEn: 'Australia', isEuMember: false, isEeaMember: false, standardVatRate: 10.00, currencyCode: 'AUD', region: 'Oceania' },
    { id: 'JP', alpha3: 'JPN', numericCode: '392', nameEn: 'Japan', isEuMember: false, isEeaMember: false, standardVatRate: 10.00, currencyCode: 'JPY', region: 'Asia' },
    { id: 'CN', alpha3: 'CHN', numericCode: '156', nameEn: 'China', isEuMember: false, isEeaMember: false, standardVatRate: 13.00, currencyCode: 'CNY', region: 'Asia' },
    { id: 'IN', alpha3: 'IND', numericCode: '356', nameEn: 'India', isEuMember: false, isEeaMember: false, standardVatRate: 18.00, currencyCode: 'INR', region: 'Asia' },
  ];

  const allCountries = [...euCountries, ...eeaCountries, ...otherCountries];

  for (const country of allCountries) {
    await prisma.country.upsert({
      where: { id: country.id },
      update: country,
      create: country,
    });
  }

  console.log(`✅ Seeded ${allCountries.length} countries`);

  // Seed VAT Categories
  console.log('📦 Seeding VAT categories...');

  const vatCategories = [
    { code: 'STANDARD', nameEn: 'Standard Products/Services', nameBg: 'Стандартни продукти/услуги', annexIiiCategory: null },
    { code: 'ELECTRONICS', nameEn: 'Electronics and Appliances', nameBg: 'Електроника и уреди', annexIiiCategory: null },
    { code: 'BOOKS', nameEn: 'Books and Periodicals', nameBg: 'Книги и периодични издания', annexIiiCategory: 6 },
    { code: 'BABY_PRODUCTS', nameEn: 'Baby Food and Hygiene', nameBg: 'Бебешки продукти и хигиена', annexIiiCategory: 10 },
    { code: 'HOTEL', nameEn: 'Hotel Accommodation', nameBg: 'Хотелско настаняване', annexIiiCategory: 8 },
    { code: 'RESTAURANT', nameEn: 'Restaurant and Catering', nameBg: 'Ресторант и кетъринг', annexIiiCategory: 12 },
    { code: 'FOOD_GENERAL', nameEn: 'General Food Products', nameBg: 'Общи хранителни продукти', annexIiiCategory: 1 },
    { code: 'FOOD_ESSENTIAL', nameEn: 'Essential Foodstuffs', nameBg: 'Основни хранителни продукти', annexIiiCategory: 1 },
    { code: 'MEDICINE', nameEn: 'Pharmaceutical Products', nameBg: 'Лекарства', annexIiiCategory: 2 },
    { code: 'TRANSPORT', nameEn: 'Passenger Transport', nameBg: 'Пътнически транспорт', annexIiiCategory: 7 },
    { code: 'CULTURAL', nameEn: 'Cultural Events and Services', nameBg: 'Културни събития', annexIiiCategory: 5 },
  ];

  const createdCategories: any = {};

  for (const category of vatCategories) {
    const created = await prisma.vatCategory.upsert({
      where: { code: category.code },
      update: category,
      create: category,
    });
    createdCategories[category.code] = created.id;
  }

  console.log(`✅ Seeded ${vatCategories.length} VAT categories`);

  // Seed Country VAT Rates
  console.log('💰 Seeding country VAT rates...');

  const effectiveDate = new Date('2024-01-01');

  // Bulgaria rates
  const bulgariaRates = [
    { countryId: 'BG', categoryCode: 'STANDARD', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'BG', categoryCode: 'ELECTRONICS', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'BG', categoryCode: 'BOOKS', vatRate: 9.00, rateType: 'REDUCED' },
    { countryId: 'BG', categoryCode: 'BABY_PRODUCTS', vatRate: 9.00, rateType: 'REDUCED' },
    { countryId: 'BG', categoryCode: 'HOTEL', vatRate: 9.00, rateType: 'REDUCED' },
    { countryId: 'BG', categoryCode: 'RESTAURANT', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'BG', categoryCode: 'FOOD_GENERAL', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'BG', categoryCode: 'FOOD_ESSENTIAL', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'BG', categoryCode: 'MEDICINE', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'BG', categoryCode: 'TRANSPORT', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'BG', categoryCode: 'CULTURAL', vatRate: 20.00, rateType: 'STANDARD' },
  ];

  // Germany rates
  const germanyRates = [
    { countryId: 'DE', categoryCode: 'STANDARD', vatRate: 19.00, rateType: 'STANDARD' },
    { countryId: 'DE', categoryCode: 'ELECTRONICS', vatRate: 19.00, rateType: 'STANDARD' },
    { countryId: 'DE', categoryCode: 'BOOKS', vatRate: 7.00, rateType: 'REDUCED' },
    { countryId: 'DE', categoryCode: 'BABY_PRODUCTS', vatRate: 19.00, rateType: 'STANDARD' },
    { countryId: 'DE', categoryCode: 'HOTEL', vatRate: 7.00, rateType: 'REDUCED' },
    { countryId: 'DE', categoryCode: 'RESTAURANT', vatRate: 19.00, rateType: 'STANDARD' },
    { countryId: 'DE', categoryCode: 'FOOD_GENERAL', vatRate: 7.00, rateType: 'REDUCED' },
    { countryId: 'DE', categoryCode: 'FOOD_ESSENTIAL', vatRate: 7.00, rateType: 'REDUCED' },
    { countryId: 'DE', categoryCode: 'MEDICINE', vatRate: 19.00, rateType: 'STANDARD' },
    { countryId: 'DE', categoryCode: 'TRANSPORT', vatRate: 7.00, rateType: 'REDUCED' },
    { countryId: 'DE', categoryCode: 'CULTURAL', vatRate: 7.00, rateType: 'REDUCED' },
  ];

  // France rates
  const franceRates = [
    { countryId: 'FR', categoryCode: 'STANDARD', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'FR', categoryCode: 'ELECTRONICS', vatRate: 20.00, rateType: 'STANDARD' },
    { countryId: 'FR', categoryCode: 'BOOKS', vatRate: 5.50, rateType: 'REDUCED' },
    { countryId: 'FR', categoryCode: 'BABY_PRODUCTS', vatRate: 5.50, rateType: 'REDUCED' },
    { countryId: 'FR', categoryCode: 'HOTEL', vatRate: 10.00, rateType: 'REDUCED' },
    { countryId: 'FR', categoryCode: 'RESTAURANT', vatRate: 10.00, rateType: 'REDUCED' },
    { countryId: 'FR', categoryCode: 'FOOD_GENERAL', vatRate: 5.50, rateType: 'REDUCED' },
    { countryId: 'FR', categoryCode: 'FOOD_ESSENTIAL', vatRate: 5.50, rateType: 'REDUCED' },
    { countryId: 'FR', categoryCode: 'MEDICINE', vatRate: 2.10, rateType: 'SUPER_REDUCED' },
    { countryId: 'FR', categoryCode: 'TRANSPORT', vatRate: 10.00, rateType: 'REDUCED' },
    { countryId: 'FR', categoryCode: 'CULTURAL', vatRate: 5.50, rateType: 'REDUCED' },
  ];

  // Denmark rates (flat 25%)
  const denmarkRates = vatCategories.map(cat => ({
    countryId: 'DK',
    categoryCode: cat.code,
    vatRate: 25.00,
    rateType: 'STANDARD'
  }));

  // Ireland rates (0% for books and food)
  const irelandRates = [
    { countryId: 'IE', categoryCode: 'STANDARD', vatRate: 23.00, rateType: 'STANDARD' },
    { countryId: 'IE', categoryCode: 'ELECTRONICS', vatRate: 23.00, rateType: 'STANDARD' },
    { countryId: 'IE', categoryCode: 'BOOKS', vatRate: 0.00, rateType: 'ZERO' },
    { countryId: 'IE', categoryCode: 'BABY_PRODUCTS', vatRate: 0.00, rateType: 'ZERO' },
    { countryId: 'IE', categoryCode: 'HOTEL', vatRate: 9.00, rateType: 'REDUCED' },
    { countryId: 'IE', categoryCode: 'RESTAURANT', vatRate: 13.50, rateType: 'REDUCED' },
    { countryId: 'IE', categoryCode: 'FOOD_GENERAL', vatRate: 0.00, rateType: 'ZERO' },
    { countryId: 'IE', categoryCode: 'FOOD_ESSENTIAL', vatRate: 0.00, rateType: 'ZERO' },
    { countryId: 'IE', categoryCode: 'MEDICINE', vatRate: 0.00, rateType: 'ZERO' },
    { countryId: 'IE', categoryCode: 'TRANSPORT', vatRate: 13.50, rateType: 'REDUCED' },
    { countryId: 'IE', categoryCode: 'CULTURAL', vatRate: 9.00, rateType: 'REDUCED' },
  ];

  const allRates = [...bulgariaRates, ...germanyRates, ...franceRates, ...denmarkRates, ...irelandRates];

  for (const rate of allRates) {
    await prisma.countryVatRate.create({
      data: {
        countryId: rate.countryId,
        vatCategoryId: createdCategories[rate.categoryCode],
        vatRate: rate.vatRate,
        rateType: rate.rateType as any,
        effectiveFrom: effectiveDate,
      },
    });
  }

  console.log(`✅ Seeded ${allRates.length} country VAT rates`);
  console.log('🎉 VAT data seeding complete!');
}

seedVATData()
  .catch((e) => {
    console.error('❌ Error seeding VAT data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
