'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface VatRulePreviewProps {
  customerId: string;
  organizationId?: string;
}

export function VatRulePreview({ customerId, organizationId }: VatRulePreviewProps) {
  const [vatRule, setVatRule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId && organizationId) {
      fetchVatRule();
    } else {
      setVatRule(null);
    }
  }, [customerId, organizationId]);

  const fetchVatRule = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/vat/rule/${organizationId}/${customerId}`);
      const data = await res.json();

      if (data.success) {
        setVatRule(data.data.vatRule);
      } else {
        setError(data.error || 'Failed to determine VAT rule');
      }
    } catch (err) {
      console.error('Error fetching VAT rule:', err);
      setError('Failed to load VAT information');
    } finally {
      setLoading(false);
    }
  };

  if (!customerId) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Loading VAT information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">VAT Information Unavailable</p>
            <p className="text-sm text-yellow-700 mt-1">{error}</p>
            <p className="text-xs text-yellow-600 mt-2">
              Ensure both your organization and customer have countries set in their profiles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!vatRule) {
    return null;
  }

  const getRuleColor = (rule: string) => {
    switch (rule) {
      case 'DOMESTIC':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'INTRA_EU_REVERSE_CHARGE':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'EXPORT_NON_EU':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'INTRA_EU_B2C':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getRuleIcon = (rule: string) => {
    if (rule === 'INTRA_EU_REVERSE_CHARGE' || rule === 'EXPORT_NON_EU') {
      return <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />;
    }
    return <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />;
  };

  const colorClass = getRuleColor(vatRule.rule);

  return (
    <div className={`p-4 border rounded-lg ${colorClass}`}>
      <div className="flex items-start gap-3">
        {getRuleIcon(vatRule.rule)}
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {vatRule.rule.replace(/_/g, ' ')} - {vatRule.scenario.replace(/_/g, ' ')}
          </p>
          <p className="text-sm mt-1">
            {vatRule.note}
          </p>

          {vatRule.warning && (
            <div className="mt-2 p-2 bg-white/50 rounded border border-current/20">
              <p className="text-xs font-medium">⚠ Warning</p>
              <p className="text-xs mt-1">{vatRule.warning}</p>
            </div>
          )}

          {/* Compliance Requirements */}
          {(vatRule.requiresVIESValidation || vatRule.requiresECSalesList || vatRule.requiresExportDocumentation) && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold">Compliance Requirements:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                {vatRule.requiresVIESValidation && (
                  <li>VIES validation required for customer VAT number</li>
                )}
                {vatRule.requiresECSalesList && (
                  <li>Must be reported in EC Sales List (Recapitulative Statement)</li>
                )}
                {vatRule.requiresExportDocumentation && (
                  <li>Export documentation (customs, CMR) must be retained</li>
                )}
              </ul>
            </div>
          )}

          {/* VAT Treatment Summary */}
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div>
              <span className="font-medium">VAT Applied: </span>
              <span className="font-semibold">{vatRule.applyVAT ? 'Yes' : 'No (0%)'}</span>
            </div>
            {vatRule.reverseCharge && (
              <div>
                <span className="font-medium">Reverse Charge: </span>
                <span className="font-semibold">Yes</span>
              </div>
            )}
            {vatRule.useCategoryRates && (
              <div>
                <span className="font-medium">Category Rates: </span>
                <span className="font-semibold">Yes</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
