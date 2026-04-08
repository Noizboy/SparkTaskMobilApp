import { useEffect, useState } from 'react';
import { IconClipboardList } from '@tabler/icons-react';
import { mockOrders, Order, getOrderProgress, getOrderTaskCounts } from '../data/mockOrders';
import { Progress } from './ui/progress';

interface InProgressOrdersCarouselProps {
  onViewOrder?: (orderId: string) => void;
  orders?: Order[]; // External orders prop
}

export function InProgressOrdersCarousel({ onViewOrder, orders }: InProgressOrdersCarouselProps) {
  const [inProgressOrders, setInProgressOrders] = useState<Order[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Use external orders if provided, otherwise use mock orders
    const sourceOrders = orders || mockOrders;
    // Filter orders with status "in-progress"
    const filtered = sourceOrders.filter(order => order.status === 'in-progress');
    setInProgressOrders(filtered);
  }, [orders]);

  useEffect(() => {
    if (inProgressOrders.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % inProgressOrders.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [inProgressOrders.length]);

  if (inProgressOrders.length === 0) {
    return null;
  }

  const order = inProgressOrders[currentIndex];
  const { completed, total } = getOrderTaskCounts(order);
  const percentage = getOrderProgress(order);

  return (
    <div className="px-3 pb-3 mb-2">
      <div className="relative">
        {/* Card */}
        <div 
          onClick={() => onViewOrder?.(order.id)}
          className="bg-white rounded-lg p-3 shadow-md border border-gray-100 cursor-pointer hover:shadow-lg hover:border-[#033620] transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="bg-[#033620] text-white px-2.5 py-0.5 rounded-full text-xs">
              In progress
            </div>
            <div className="text-xs text-gray-500">Order #{order.orderNumber.replace(/^#/, '')}</div>
          </div>

          {/* Tasks Completed */}
          <div className="mb-2">
            <p className="text-xs text-gray-600 mb-1.5">Tasks completed</p>
            <div className="flex items-center gap-2">
              <IconClipboardList className="w-7 h-7 text-[#033620]" />
              <div className="flex items-baseline gap-1">
                <span className="font-['Poppins'] font-bold text-2xl text-[#033620]">
                  {completed}
                </span>
                <span className="text-lg text-gray-400">/</span>
                <span className="font-['Poppins'] font-bold text-lg text-gray-400">
                  {total}
                </span>
              </div>
              <div className="ml-auto">
                <span className="font-['Poppins'] font-bold text-xl text-[#033620]">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <Progress value={percentage} className="h-1.5" />
          </div>

          {/* Service Type */}
          <div className="text-xs font-medium text-gray-900">
            {order.serviceType}
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      {inProgressOrders.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {inProgressOrders.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-[#033620] w-5'
                  : 'bg-gray-300 hover:bg-gray-400 w-1.5'
              }`}
              aria-label={`Go to order ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}