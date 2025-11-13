import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * VAT Service - Automatic VAT Rule Detection and Calculation
 * Based on EU VAT Directive and cross-border rules
 */

export interface VATRule {
  rule: string;
  scenario: string;
  applyVAT: boolean;
  useCategoryRates: boolean;
  rateCountry?: string;
  vatRate?: number;
  reverseCharge: boolean;
  isExport?: boolean;
  requiresVIESValidation?: boolean;
  requiresECSalesList?: boolean;
  requiresExportDocumentation?: boolean;
  thresholdExceeded?: boolean;
  note: string;
  warning?: string;
}

export interface VATRateInfo {
  rate: number;
  type: string;
}

/**
 * Get the VAT rate for a specific country and product category
 * @param countryCode - ISO 2-letter country code (e.g., 'BG')
 * @param categoryCode - VAT category code (e.g., 'BOOKS', 'ELECTRONICS')
 * @param invoiceDate - Date of the invoice
 * @returns VAT rate information
 */
export async function getVATRateForCategory(
  countryCode: string,
  categoryCode: string,
  invoiceDate: Date = new Date()
): Promise<VATRateInfo> {
  // Get the category ID
  const category = await prisma.vatCategory.findUnique({
    where: { code: categoryCode },
  });

  if (!category) {
    throw new Error(`VAT category not found: ${categoryCode}`);
  }

  // Find the applicable rate
  const rate = await prisma.countryVatRate.findFirst({
    where: {
      countryId: countryCode,
      vatCategoryId: category.id,
      effectiveFrom: { lte: invoiceDate },
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gte: invoiceDate } },
      ],
    },
    orderBy: {
      effectiveFrom: 'desc',
    },
  });

  if (!rate) {
    // Fallback to standard rate
    const standardCategory = await prisma.vatCategory.findUnique({
      where: { code: 'STANDARD' },
    });

    if (standardCategory) {
      return getVATRateForCategory(countryCode, 'STANDARD', invoiceDate);
    }

    throw new Error(`No VAT rate found for ${countryCode} and category ${categoryCode}`);
  }

  return {
    rate: rate.vatRate,
    type: rate.rateType,
  };
}

/**
 * Determine which VAT rule applies based on supplier and customer
 * @param supplier - Organization/Company object with country_id
 * @param customer - Customer object with country, vatNumber, isBusiness, etc.
 * @returns VAT rule object
 */
export async function determineVATRule(
  supplier: { country: string | null; isVatRegistered: boolean },
  customer: {
    country: string | null;
    vatNumber: string | null;
    vatNumberValidated: boolean;
    isBusiness: boolean;
  }
): Promise<VATRule> {
  // Validate inputs
  if (!supplier.country) {
    throw new Error('Supplier country is required');
  }
  if (!customer.country) {
    throw new Error('Customer country is required');
  }

  // Get country information
  const supplierCountry = await prisma.country.findUnique({
    where: { id: supplier.country },
  });

  const customerCountry = await prisma.country.findUnique({
    where: { id: customer.country },
  });

  if (!supplierCountry) {
    throw new Error(`Supplier country not found: ${supplier.country}`);
  }

  if (!customerCountry) {
    throw new Error(`Customer country not found: ${customer.country}`);
  }

  // RULE 1: DOMESTIC (Same country)
  if (supplier.country === customer.country) {
    // If supplier is NOT VAT registered, they cannot charge VAT (0% VAT)
    if (!supplier.isVatRegistered) {
      return {
        rule: 'DOMESTIC',
        scenario: customer.isBusiness ? 'DOMESTIC_B2B_NON_VAT' : 'DOMESTIC_B2C_NON_VAT',
        applyVAT: false,
        useCategoryRates: false,
        vatRate: 0.0,
        reverseCharge: false,
        note: 'Domestic transaction - Supplier not VAT registered, 0% VAT applies',
        explanation: 'Supplier and customer in same country (Bulgaria). Supplier is not VAT registered, so no VAT is charged.',
      };
    }

    // Supplier IS VAT registered - apply normal VAT rates
    return {
      rule: 'DOMESTIC',
      scenario: customer.isBusiness ? 'DOMESTIC_B2B' : 'DOMESTIC_B2C',
      applyVAT: true,
      useCategoryRates: true,
      rateCountry: supplier.country,
      reverseCharge: false,
      note: 'Domestic transaction - Apply supplier country VAT rates by category',
      explanation: `Supplier and customer in same country (${supplier.country}). Standard VAT rates apply.`,
    };
  }

  // RULE 2: INTRA-EU B2B with VAT (Reverse Charge)
  if (
    supplierCountry.isEuMember &&
    customerCountry.isEuMember &&
    customer.isBusiness &&
    customer.vatNumberValidated
  ) {
    return {
      rule: 'INTRA_EU_REVERSE_CHARGE',
      scenario: 'INTRA_EU_B2B_REVERSE_CHARGE',
      applyVAT: false,
      useCategoryRates: false,
      vatRate: 0.0,
      reverseCharge: true,
      requiresVIESValidation: true,
      requiresECSalesList: true,
      note: 'Intra-EU B2B with valid VAT - Reverse charge mechanism applies (0% VAT)',
    };
  }

  // RULE 3: INTRA-EU B2B without VAT
  if (
    supplierCountry.isEuMember &&
    customerCountry.isEuMember &&
    customer.isBusiness &&
    !customer.vatNumberValidated
  ) {
    return {
      rule: 'INTRA_EU_NO_VAT',
      scenario: 'INTRA_EU_B2B_NO_VAT',
      applyVAT: true,
      useCategoryRates: true,
      rateCountry: supplier.country,
      reverseCharge: false,
      warning: 'Customer not VAT registered - Supplier country VAT applies',
      note: 'Intra-EU B2B without valid VAT number - Apply supplier country rates',
    };
  }

  // RULE 4: INTRA-EU B2C (Distance Selling)
  if (
    supplierCountry.isEuMember &&
    customerCountry.isEuMember &&
    !customer.isBusiness
  ) {
    // TODO: Implement distance selling threshold check
    const overThreshold = await checkDistanceSellingThreshold(customer.country);

    return {
      rule: 'INTRA_EU_B2C',
      scenario: 'INTRA_EU_B2C_DISTANCE_SELLING',
      applyVAT: true,
      useCategoryRates: true,
      rateCountry: overThreshold ? customer.country : supplier.country,
      reverseCharge: false,
      thresholdExceeded: overThreshold,
      note: overThreshold
        ? 'Distance selling over €10,000 threshold - Apply destination country VAT rates'
        : 'Distance selling under threshold - Apply supplier country VAT rates',
    };
  }

  // RULE 5: EXPORT to Non-EU
  if (supplierCountry.isEuMember && !customerCountry.isEuMember) {
    return {
      rule: 'EXPORT_NON_EU',
      scenario: customer.isBusiness ? 'EXPORT_B2B' : 'EXPORT_B2C',
      applyVAT: false,
      useCategoryRates: false,
      vatRate: 0.0,
      reverseCharge: false,
      isExport: true,
      requiresExportDocumentation: true,
      note: 'Export to non-EU country - Zero-rated (0% VAT)',
    };
  }

  // RULE 6: IMPORT from Non-EU to EU
  if (!supplierCountry.isEuMember && customerCountry.isEuMember) {
    return {
      rule: 'IMPORT_TO_EU',
      scenario: 'IMPORT_FROM_NON_EU',
      applyVAT: false,
      useCategoryRates: false,
      reverseCharge: false,
      note: 'Import from non-EU - VAT typically handled at customs/border',
      warning: 'Customer may need to pay import VAT and duties in their country',
    };
  }

  // RULE 7: Both Non-EU (International)
  return {
    rule: 'INTERNATIONAL',
    scenario: 'NON_EU_INTERNATIONAL',
    applyVAT: false,
    useCategoryRates: false,
    reverseCharge: false,
    note: 'International transaction outside EU - No EU VAT applies',
    warning: 'Check local tax requirements in supplier and customer countries',
  };
}

/**
 * Check if distance selling threshold is exceeded
 * @param customerCountry - Customer country code
 * @returns true if threshold exceeded
 */
async function checkDistanceSellingThreshold(customerCountry: string): Promise<boolean> {
  // TODO: Implement actual threshold tracking
  // For now, return false (under threshold)
  // This should query Invoice table and sum B2C sales to the target country
  const THRESHOLD = 10000; // €10,000

  // Placeholder - implement actual query
  return false;
}

/**
 * Validate invoice prerequisites before generation
 */
export function validateInvoicePrerequisites(
  vatRule: VATRule,
  customer: any,
  supplier: any
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if company is VAT registered (if required)
  // Note: For domestic transactions, non-VAT registered companies can create invoices with 0% VAT
  // Only enforce VAT registration for cross-border scenarios where VAT is required
  if (vatRule.applyVAT && !supplier.isVatRegistered && vatRule.rule !== 'DOMESTIC') {
    errors.push('Your company must be VAT registered for this type of transaction');
  }

  // Check VAT number for reverse charge
  if (vatRule.rule === 'INTRA_EU_REVERSE_CHARGE') {
    if (!customer.vatNumber) {
      errors.push('Customer must have a VAT number for intra-EU B2B transactions');
    }
    if (!customer.vatNumberValidated) {
      warnings.push('Customer VAT number has not been validated via VIES');
    }
  }

  // Check export documentation
  if (vatRule.isExport) {
    warnings.push('Export documentation (customs, CMR) must be retained');
  }

  // Check distance selling threshold
  if (vatRule.rule === 'INTRA_EU_B2C' && vatRule.thresholdExceeded) {
    warnings.push(`Distance selling threshold exceeded for ${customer.country}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate invoice totals with VAT
 */
export async function calculateInvoiceWithVAT(
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatCategoryCode: string;
  }>,
  vatRule: VATRule,
  invoiceDate: Date = new Date()
): Promise<{
  lineItems: Array<any>;
  subtotal: number;
  totalVAT: number;
  total: number;
  vatBreakdown: Record<string, number>;
  isMixedVatRates: boolean;
}> {
  const processedLineItems = [];
  const vatBreakdown: Record<string, number> = {};
  let subtotal = 0;
  let totalVAT = 0;

  for (const item of lineItems) {
    const lineSubtotal = item.quantity * item.unitPrice;
    subtotal += lineSubtotal;

    let vatRate = 0;
    let vatAmount = 0;

    if (vatRule.useCategoryRates && vatRule.rateCountry) {
      // Get category-specific rate
      const rateInfo = await getVATRateForCategory(
        vatRule.rateCountry,
        item.vatCategoryCode,
        invoiceDate
      );
      vatRate = rateInfo.rate;
      vatAmount = lineSubtotal * (vatRate / 100);

      // Track VAT by rate
      const rateKey = vatRate.toString();
      if (!vatBreakdown[rateKey]) {
        vatBreakdown[rateKey] = 0;
      }
      vatBreakdown[rateKey] += vatAmount;
    } else if (vatRule.vatRate !== undefined) {
      // Fixed rate (typically 0 for reverse charge/export)
      vatRate = vatRule.vatRate;
      vatAmount = lineSubtotal * (vatRate / 100);
    }

    totalVAT += vatAmount;

    processedLineItems.push({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatCategoryCode: item.vatCategoryCode,
      vatRateApplied: vatRate,
      vatAmount: vatAmount,
      lineSubtotal: lineSubtotal,
      lineTotal: lineSubtotal + vatAmount,
    });
  }

  return {
    lineItems: processedLineItems,
    subtotal,
    totalVAT,
    total: subtotal + totalVAT,
    vatBreakdown,
    isMixedVatRates: Object.keys(vatBreakdown).length > 1,
  };
}

export default {
  getVATRateForCategory,
  determineVATRule,
  validateInvoicePrerequisites,
  calculateInvoiceWithVAT,
};
