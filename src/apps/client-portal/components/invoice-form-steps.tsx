'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { calculateVAT, getVATRatePercentage } from '@invoice-app/database';

interface Customer {
  id: string;
  name: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceFormProps {
  invoice?: any;
}

const STEPS = [
  { id: 1, title: 'Invoice Details', description: 'Basic invoice information' },
  { id: 2, title: 'Customer', description: 'Select a customer' },
  { id: 3, title: 'Line Items', description: 'Add products or services' },
  { id: 4, title: 'Review', description: 'Review and submit' },
];

export function InvoiceFormSteps({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customerId: invoice?.customerId || '',
    invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    date: invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: invoice?.status || 'draft',
    notes: invoice?.notes || '',
  });

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
  );

  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
    fetchCompany();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(data);
  };

  const fetchCompany = async () => {
    const res = await fetch('/api/company');
    const data = await res.json();
    setCompany(data);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];

    if (field === 'quantity' || field === 'unitPrice') {
      const numValue = value === '' ? 0 : parseFloat(value);
      newItems[index] = { ...newItems[index], [field]: isNaN(numValue) ? 0 : numValue };
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Use country-specific VAT calculation
    // If company has country and isVatRegistered, calculate VAT automatically
    const tax = company?.country && company?.isVatRegistered
      ? calculateVAT(subtotal, company.country, company.isVatRegistered)
      : 0;

    const total = subtotal + tax;
    return {
      subtotal,
      tax,
      total,
      taxRate: company?.country ? getVATRatePercentage(company.country) : 0
    };
  };

  const { subtotal, tax, total } = calculateTotals();

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.invoiceNumber && formData.date && formData.dueDate;
      case 2:
        return formData.customerId;
      case 3:
        return items.length > 0 && items.every(item => item.description && item.quantity > 0 && item.unitPrice >= 0);
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    const invoiceData = {
      ...formData,
      subtotal,
      tax,
      total,
      items: items.map(({ description, quantity, unitPrice, total }) => ({
        description,
        quantity,
        unitPrice,
        total,
      })),
    };

    const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices';
    const method = invoice ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });

    router.push('/invoices');
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <div className="space-y-6">
      {/* Progress Steps - Mobile Friendly */}
      <Card className="lg:block">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-semibold transition-colors ${
                      currentStep > step.id
                        ? 'bg-green-600 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : step.id}
                  </div>
                  <div className="text-center mt-2 hidden md:block">
                    <p className="text-xs font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                  <div className="text-center mt-1 md:hidden">
                    <p className="text-xs font-medium text-gray-900">{step.title}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-1 w-full mx-2 rounded ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <p className="text-sm text-gray-600 mt-1">{STEPS[currentStep - 1].description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Invoice Details */}
          {currentStep === 1 && (
            <>
              <Input
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                required
              />
              <Input
                label="Invoice Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'overdue', label: 'Overdue' },
                ]}
              />
            </>
          )}

          {/* Step 2: Customer Selection */}
          {currentStep === 2 && (
            <>
              <Select
                label="Select Customer"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                options={[
                  { value: '', label: 'Choose a customer...' },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
                required
              />
              {selectedCustomer && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm font-semibold text-gray-900">Selected Customer:</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedCustomer.name}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Step 3: Line Items */}
          {currentStep === 3 && (
            <>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <Card key={index} className="border-2 border-gray-200">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-900">Item {index + 1}</h4>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        label="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="e.g., Web Design Services"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Quantity"
                          type="number"
                          step="0.01"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          required
                        />
                        <Input
                          label="Unit Price"
                          type="number"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          required
                        />
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">Item Total:</p>
                        <p className="text-lg font-bold text-gray-900">${item.total.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button type="button" onClick={addItem} variant="secondary" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Item
              </Button>
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({company?.taxRate || 0}%):</span>
                      <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <>
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice #:</span>
                    <span className="font-medium text-gray-900">{formData.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium text-gray-900">{formData.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-gray-900 capitalize">{formData.status}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-gray-900">{selectedCustomer?.name}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">Line Items ({items.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="pb-3 border-b last:border-b-0">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Subtotal:</span>
                      <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Tax ({company?.taxRate || 0}%):</span>
                      <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="font-bold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Textarea
                label="Notes (Optional)"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes or payment terms..."
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        {currentStep > 1 ? (
          <Button type="button" variant="secondary" onClick={prevStep} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => router.push('/invoices')} className="flex-1">
            Cancel
          </Button>
        )}

        {currentStep < STEPS.length ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex-1"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            {invoice ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        )}
      </div>
    </div>
  );
}
