'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WizardStep } from './wizard-step';
import {
  FileText,
  Users,
  Receipt,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';

interface WelcomeWizardProps {
  organizationName: string;
  userEmail: string;
  userName?: string;
}

export function WelcomeWizard({ organizationName, userEmail, userName }: WelcomeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch('/api/users/complete-welcome', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Failed to mark welcome as completed');
      }
    } catch (error) {
      console.error('Error completing welcome:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch('/api/users/complete-welcome', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Failed to mark welcome as completed');
      }
    } catch (error) {
      console.error('Error completing welcome:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <button
                  onClick={handleSkip}
                  disabled={isCompleting}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  Skip tutorial
                </button>
              </div>
              <Progress value={(currentStep + 1) / totalSteps * 100} variant="default" />
            </div>

            {/* Step Content */}
            <div className="min-h-[400px] flex flex-col justify-between">
              {/* Step 1: Welcome */}
              {currentStep === 0 && (
                <WizardStep>
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-blue-700" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      Welcome to {organizationName}!
                    </h1>
                    <p className="text-xl text-gray-600 mb-6">
                      {userName ? `Hi ${userName}` : `Hi there`}, we're excited to have you on board.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                      <p className="text-gray-900 mb-2">
                        <strong>Your account:</strong> {userEmail}
                      </p>
                      <p className="text-gray-900">
                        <strong>Organization:</strong> {organizationName}
                      </p>
                    </div>
                    <p className="text-gray-600">
                      Let's take a quick tour to help you get started with managing your invoices,
                      customers, and expenses.
                    </p>
                  </div>
                </WizardStep>
              )}

              {/* Step 2: Profile Completion */}
              {currentStep === 1 && (
                <WizardStep>
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-purple-700" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Complete Your Profile
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                      You can personalize your account anytime from the Settings page.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <div className="bg-gray-50 rounded-lg p-6 text-left">
                        <Shield className="w-8 h-8 text-blue-700 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Profile Information</h3>
                        <p className="text-sm text-gray-600">
                          Add your photo, phone number, and other details to personalize your account.
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6 text-left">
                        <Clock className="w-8 h-8 text-blue-700 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Preferences</h3>
                        <p className="text-sm text-gray-600">
                          Set your timezone, language, and notification preferences.
                        </p>
                      </div>
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 3: Feature Highlights */}
              {currentStep === 2 && (
                <WizardStep>
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <TrendingUp className="w-10 h-10 text-green-700" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Key Features
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                      Here's what you can do with your new account:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                      <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-6 h-6 text-blue-700" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Invoices</h3>
                        <p className="text-sm text-gray-600">
                          Create, send, and track professional invoices with ease. Export as PDF.
                        </p>
                      </div>
                      <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Users className="w-6 h-6 text-purple-700" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Customers</h3>
                        <p className="text-sm text-gray-600">
                          Manage your customer database and track all related transactions.
                        </p>
                      </div>
                      <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Receipt className="w-6 h-6 text-green-700" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Expenses</h3>
                        <p className="text-sm text-gray-600">
                          Track expenses, set budgets, and monitor spending by category.
                        </p>
                      </div>
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 4: Completion */}
              {currentStep === 3 && (
                <WizardStep>
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-700" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      You're All Set!
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                      Ready to start managing your invoices and expenses?
                    </p>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 max-w-2xl mx-auto mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4 text-lg">Quick Start Guide</h3>
                      <div className="space-y-3 text-left">
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 text-sm">
                            1
                          </div>
                          <p className="text-gray-900">
                            <strong>Add your first customer</strong> - Go to the Customers page and create a new customer profile.
                          </p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 text-sm">
                            2
                          </div>
                          <p className="text-gray-900">
                            <strong>Create an invoice</strong> - Click "Create Invoice" from the dashboard to get started.
                          </p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 text-sm">
                            3
                          </div>
                          <p className="text-gray-900">
                            <strong>Track expenses</strong> - Start logging your business expenses to monitor spending.
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      Need help? Visit the Settings page or contact your administrator.
                    </p>
                  </div>
                </WizardStep>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="flex items-center"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="flex items-center"
                >
                  {isCompleting ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
