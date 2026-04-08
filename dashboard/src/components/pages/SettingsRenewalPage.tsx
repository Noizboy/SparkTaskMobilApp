import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { IconCheck, IconCreditCard, IconDownload, IconCalendar } from '@tabler/icons-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    description: 'Perfect to get started',
    features: [
      'Up to 50 orders/month',
      '5 members',
      'Basic checklists',
      'Email support',
    ],
    current: true
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 19.99,
    description: 'For growing teams',
    features: [
      'Unlimited orders',
      '15 members',
      'Custom checklists',
      'Unlimited add-ons',
      'Priority support',
      'Advanced reports',
    ],
    current: false,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79.99,
    description: 'For large companies',
    features: [
      'Everything in Professional',
      'Unlimited members',
      'Multi-location',
      'API access',
      '24/7 support',
      'Dedicated manager',
    ],
    current: false
  },
];

const invoiceHistory = [
  { id: 'INV-2025-11', date: '2025-11-01', amount: 0, status: 'paid', plan: 'Starter' },
  { id: 'INV-2025-10', date: '2025-10-01', amount: 0, status: 'paid', plan: 'Starter' },
  { id: 'INV-2025-09', date: '2025-09-01', amount: 0, status: 'paid', plan: 'Starter' },
  { id: 'INV-2025-08', date: '2025-08-01', amount: 0, status: 'paid', plan: 'Starter' },
];

export function SettingsRenewalPage({ user }: { user: any }) {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1>Renewal Center</h1>
        <p className="text-gray-600">Manage your subscription and payment methods</p>
      </div>

      <div className="space-y-8">
        {/* Current Subscription */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900">Starter Plan</p>
                <p className="text-sm text-gray-500">Free • No payment required</p>
              </div>
              <Button variant="outline" className="shadow-sm">Change Plan</Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center shadow-md">
                  <IconCreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-900">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/2026</p>
                </div>
              </div>
              <Button variant="outline" className="shadow-sm">Update</Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div>
          <h2 className="mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative shadow-md hover:shadow-xl transition-shadow ${plan.popular ? 'border-[#033620] border-2' : ''} ${plan.current ? 'bg-gray-50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#033620] text-white shadow-md">Most Popular</Badge>
                  </div>
                )}
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#033620] text-white shadow-md">Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-center">
                    <span className="text-gray-900">{plan.name}</span>
                    <div className="mt-4">
                      {plan.price === 0 ? (
                        <span className="text-[#033620] font-bold text-[36px] font-[Poppins]">Free</span>
                      ) : (
                        <>
                          <span className="text-[#033620] font-bold text-[36px] font-[Poppins]">${plan.price}</span>
                          <span className="text-sm text-gray-500">/month</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2 font-normal">{plan.description}</p>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <IconCheck className="w-5 h-5 text-[#033620] shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full text-center text-sm text-[#033620] hover:text-[#022819] hover:underline mb-3 transition-colors">
                    View all features
                  </button>
                  <Button
                    className={`w-full shadow-md ${plan.current ? 'bg-gray-400' : 'bg-[#033620] hover:bg-[#022819] text-white'}`}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Invoice History */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoiceHistory.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <IconCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-900">{invoice.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-gray-900 font-medium">${invoice.amount}</p>
                      <Badge className="bg-[#033620] text-white shadow-sm">Paid</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="shadow-sm">
                      <IconDownload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
