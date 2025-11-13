/**
 * EU Country VAT Rates Configuration
 *
 * This configuration includes standard VAT rates for all 27 EU member countries.
 * Only EU-based organizations can use this invoicing system.
 * EU organizations can invoice both EU and non-EU customers.
 *
 * Rates are based on 2024 data and should be updated periodically.
 *
 * @see https://ec.europa.eu/taxation_customs/tedb/taxSearch.html
 */

export interface CountryTaxRate {
  country: string;           // Country name
  countryCode: string;        // ISO 3166-1 alpha-2 code
  standardRate: number;       // Standard VAT rate (percentage)
  currency: string;           // ISO 4217 currency code
  requiresVatRegistration: boolean; // Whether VAT registration is required for businesses
}

/**
 * EU Member States VAT Rates (27 countries)
 * These are the ONLY countries allowed for organization registration
 */
export const EU_VAT_RATES: Record<string, CountryTaxRate> = {
  'AT': {
    country: 'Austria',
    countryCode: 'AT',
    standardRate: 20,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'BE': {
    country: 'Belgium',
    countryCode: 'BE',
    standardRate: 21,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'BG': {
    country: 'Bulgaria',
    countryCode: 'BG',
    standardRate: 20,
    currency: 'BGN',
    requiresVatRegistration: true,
  },
  'HR': {
    country: 'Croatia',
    countryCode: 'HR',
    standardRate: 25,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'CY': {
    country: 'Cyprus',
    countryCode: 'CY',
    standardRate: 19,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'CZ': {
    country: 'Czech Republic',
    countryCode: 'CZ',
    standardRate: 21,
    currency: 'CZK',
    requiresVatRegistration: true,
  },
  'DK': {
    country: 'Denmark',
    countryCode: 'DK',
    standardRate: 25,
    currency: 'DKK',
    requiresVatRegistration: true,
  },
  'EE': {
    country: 'Estonia',
    countryCode: 'EE',
    standardRate: 22,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'FI': {
    country: 'Finland',
    countryCode: 'FI',
    standardRate: 24,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'FR': {
    country: 'France',
    countryCode: 'FR',
    standardRate: 20,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'DE': {
    country: 'Germany',
    countryCode: 'DE',
    standardRate: 19,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'GR': {
    country: 'Greece',
    countryCode: 'GR',
    standardRate: 24,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'HU': {
    country: 'Hungary',
    countryCode: 'HU',
    standardRate: 27,
    currency: 'HUF',
    requiresVatRegistration: true,
  },
  'IE': {
    country: 'Ireland',
    countryCode: 'IE',
    standardRate: 23,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'IT': {
    country: 'Italy',
    countryCode: 'IT',
    standardRate: 22,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'LV': {
    country: 'Latvia',
    countryCode: 'LV',
    standardRate: 21,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'LT': {
    country: 'Lithuania',
    countryCode: 'LT',
    standardRate: 21,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'LU': {
    country: 'Luxembourg',
    countryCode: 'LU',
    standardRate: 17,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'MT': {
    country: 'Malta',
    countryCode: 'MT',
    standardRate: 18,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'NL': {
    country: 'Netherlands',
    countryCode: 'NL',
    standardRate: 21,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'PL': {
    country: 'Poland',
    countryCode: 'PL',
    standardRate: 23,
    currency: 'PLN',
    requiresVatRegistration: true,
  },
  'PT': {
    country: 'Portugal',
    countryCode: 'PT',
    standardRate: 23,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'RO': {
    country: 'Romania',
    countryCode: 'RO',
    standardRate: 19,
    currency: 'RON',
    requiresVatRegistration: true,
  },
  'SK': {
    country: 'Slovakia',
    countryCode: 'SK',
    standardRate: 20,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'SI': {
    country: 'Slovenia',
    countryCode: 'SI',
    standardRate: 22,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'ES': {
    country: 'Spain',
    countryCode: 'ES',
    standardRate: 21,
    currency: 'EUR',
    requiresVatRegistration: true,
  },
  'SE': {
    country: 'Sweden',
    countryCode: 'SE',
    standardRate: 25,
    currency: 'SEK',
    requiresVatRegistration: true,
  },
};

/**
 * Get EU countries sorted by name
 * These are the ONLY countries available for organization registration
 */
export function getEUCountries(): CountryTaxRate[] {
  return Object.values(EU_VAT_RATES).sort((a, b) => a.country.localeCompare(b.country));
}

/**
 * Alias for getEUCountries for backward compatibility
 * Since we only support EU countries, this returns the same as getEUCountries
 */
export function getCountries(): CountryTaxRate[] {
  return getEUCountries();
}

/**
 * Get country VAT info by country code
 * Returns undefined if country is not an EU member state
 */
export function getCountryVATRate(countryCode: string): CountryTaxRate | undefined {
  return EU_VAT_RATES[countryCode.toUpperCase()];
}

/**
 * Check if a country code is an EU member state
 */
export function isEUCountry(countryCode: string): boolean {
  return countryCode.toUpperCase() in EU_VAT_RATES;
}

/**
 * Calculate VAT amount for an invoice
 * @param subtotal - Invoice subtotal before tax
 * @param countryCode - ISO country code of the organization
 * @param isVatRegistered - Whether the organization is VAT registered
 * @returns VAT amount to add to invoice
 */
export function calculateVAT(
  subtotal: number,
  countryCode: string,
  isVatRegistered: boolean
): number {
  // If not VAT registered, no VAT is charged
  if (!isVatRegistered) {
    return 0;
  }

  const vatRate = getCountryVATRate(countryCode);
  if (!vatRate) {
    return 0;
  }

  return (subtotal * vatRate.standardRate) / 100;
}

/**
 * Get VAT rate percentage for display
 */
export function getVATRatePercentage(countryCode: string): number {
  const vatRate = getCountryVATRate(countryCode);
  return vatRate?.standardRate || 0;
}

/**
 * Get currency for a country
 */
export function getCountryCurrency(countryCode: string): string {
  const vatRate = getCountryVATRate(countryCode);
  return vatRate?.currency || 'EUR';
}

/**
 * Format currency amount based on country
 * @param amount - Amount to format
 * @param countryCode - ISO country code
 * @returns Formatted currency string
 */
export function formatCurrencyByCountry(amount: number, countryCode: string): string {
  const currency = getCountryCurrency(countryCode);

  // Use Intl.NumberFormat for proper currency formatting
  try {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported
    return `${amount.toFixed(2)} ${currency}`;
  }
}
