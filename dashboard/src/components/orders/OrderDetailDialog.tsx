import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { IconClock, IconMapPin, IconUsers, IconCalendar, IconFlag, IconMessageCircle, IconKey, IconCircleCheck } from '@tabler/icons-react';
import { Progress } from '../ui/progress';
import { Order, getOrderProgress } from '../../data/mockOrders';

interface OrderDetailDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  const progress = getOrderProgress(order);
  const skippedSections = order.sections.filter(s => s.skipReason);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { label: 'Scheduled', className: 'bg-gray-200 text-gray-700 shadow-sm' },
      'in-progress': { label: 'In Progress', className: 'bg-gray-700 text-white shadow-sm' },
      'completed': { label: 'Completed', className: 'bg-[#033620] text-white shadow-sm' },
      'canceled': { label: 'Canceled', className: 'bg-red-100 text-red-700 shadow-sm' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Order {order.orderNumber}</DialogTitle>
            {getStatusBadge(order.status)}
          </div>
          <DialogDescription>
            View detailed information about this cleaning order including customer details, service information, assigned employees, and progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar for In-Progress Orders */}
          {order.status === 'in-progress' && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">Real-Time Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="text-indigo-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-gray-900">{order.clientName}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <IconMapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">{order.address}</span>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2 text-sm">
                  <IconCalendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Scheduled date</p>
                    <p className="text-gray-900">{new Date(order.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {order.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <IconClock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="text-gray-900">{order.duration}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-500">Service type:</span>
                <span className="text-gray-900">{order.serviceType}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Employees */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Assigned Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap">
                {order.assignedEmployees.map((employee: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700 shadow-sm">
                    {employee}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Checklist (for in-progress orders) */}
          {order.status === 'in-progress' && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">Live Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.sections.map((section) => (
                  <div key={section.id}>
                    <h4 className="text-sm text-gray-900 mb-2">{section.name}</h4>
                    <div className="space-y-2">
                      {section.todos.map((todo) => (
                        <div key={todo.id} className="flex items-center gap-2 text-sm">
                          <IconCircleCheck className={`w-4 h-4 ${todo.completed ? 'text-[#033620]' : 'text-gray-400'}`} />
                          <span className={todo.completed ? 'text-gray-600 line-through' : 'text-gray-900'}>
                            {todo.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary (for completed orders) */}
          {order.status === 'completed' && (
            <>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm">Work Completed Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.sections.map((section) => (
                    <div key={section.id}>
                      <h4 className="text-sm text-gray-900 mb-2 font-medium">{section.name}</h4>
                      <div className="space-y-2">
                        {section.todos.map((todo) => (
                          <div key={todo.id} className="flex items-center gap-2 text-sm">
                            <IconCircleCheck className="w-4 h-4 text-[#033620]" />
                            <span className="text-gray-600">{todo.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {skippedSections.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-sm">Skipped Areas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {skippedSections.map((section) => (
                      <div key={section.id} className="p-3 bg-yellow-50 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-900">{section.name}</p>
                        <p className="text-sm text-gray-600 mt-1">Reason: {section.skipReason}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 gap-4">
            {order.goal && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconFlag className="w-4 h-4" />
                    Order Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.goal}</p>
                </CardContent>
              </Card>
            )}

            {order.specialInstructions && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconMessageCircle className="w-4 h-4" />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.specialInstructions}</p>
                </CardContent>
              </Card>
            )}

            {order.accessInfo && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IconKey className="w-4 h-4" />
                    Access Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.accessInfo}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}