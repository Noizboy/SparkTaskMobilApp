import { useState, useEffect, useCallback } from 'react';
import { useSSE } from '../hooks/useSSE';
import { Sidebar } from './Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { OrdersPage } from './pages/OrdersPage';
import { CreateOrderPage } from './pages/CreateOrderPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { TeamMembersPage } from './pages/TeamMembersPage';
import { ChecklistManagementPage } from './pages/ChecklistManagementPage';
import { ServiceTypesPage } from './pages/ServiceTypesPage';
import { AddonsPage } from './pages/AddonsPage';
import { SettingsAccountPage } from './pages/SettingsAccountPage';
import { SettingsGeneralPage } from './pages/SettingsGeneralPage';
import { SettingsRenewalPage } from './pages/SettingsRenewalPage';
import { CompanySettingsPage } from './pages/CompanySettingsPage';
import { IconMenu2 } from '@tabler/icons-react';
import { Button } from './ui/button';
import { Order } from '../data/mockOrders';
import * as api from '../services/api';
import { OverviewSkeleton, OrdersSkeleton, OrderDetailSkeleton } from './skeletons';

interface DashboardProps {
  user: any;
  onLogout: () => void;
  onUserUpdate: (updated: any) => void;
}

export type PageType = 'overview' | 'orders' | 'create-order' | 'order-detail' | 'team' | 'checklist' | 'service-types' | 'addons' | 'settings' | 'settings-account' | 'settings-general' | 'settings-renewal';

export function Dashboard({ user, onLogout, onUserUpdate }: DashboardProps) {
  const [currentPage, setCurrentPageState] = useState<PageType>(() => {
    const saved = localStorage.getItem('dashboard_currentPage') as PageType | null;
    // order-detail depends on transient state that won't survive a refresh
    if (saved && saved !== 'order-detail') return saved;
    return 'overview';
  });
  const setCurrentPage = (page: PageType) => {
    setCurrentPageState(page);
    localStorage.setItem('dashboard_currentPage', page);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [services, setServices] = useState<api.ServiceAPI[]>([]);

  // Check API health and load orders
  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const data = await api.fetchOrders();
      setOrders(data);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      console.warn('API offline — using empty state');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const data = await api.fetchServices(user?.id);
      setServices(data);
    } catch {
      console.warn('Failed to load services');
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
    loadServices();
  }, [loadOrders, loadServices]);

  // Real-time updates via SSE — no polling, no F5 needed
  useSSE({
    onOrderCreated: (order) => {
      setOrders(prev => [order, ...prev]);
    },
    onOrderUpdated: (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
      // If this order is currently open in the detail view, update it too
      setSelectedOrder(prev => prev?.id === order.id ? order : prev);
    },
    onOrderDeleted: ({ id }) => {
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedOrder(prev => prev?.id === id ? null : prev);
    },
  });

  const handleNavigateToOrderDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedOrder(null);
    setCurrentPage('order-detail');
    try {
      const order = await api.fetchOrder(orderId);
      setSelectedOrder(order);
    } catch {
      // Fallback: find in local state
      setSelectedOrder(orders.find(o => o.id === orderId) || null);
    }
  };

  const handleBackFromOrderDetail = () => {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setCurrentPage('orders');
    loadOrders(); // Refresh list
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      const saved = await api.updateOrder(updatedOrder.id, updatedOrder);
      setSelectedOrder(saved);
      setOrders(prev => prev.map(o => o.id === saved.id ? saved : o));
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setCurrentPage('orders');
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  // Guard: if order-detail is active but selectedOrder was cleared and no order is being fetched, navigate back
  useEffect(() => {
    if (currentPage === 'order-detail' && !selectedOrder && !selectedOrderId) {
      setCurrentPage('orders');
    }
  }, [currentPage, selectedOrder, selectedOrderId]);

  // Restrict supervisor access to allowed pages only
  const supervisorAllowedPages: PageType[] = ['overview', 'orders', 'order-detail', 'create-order', 'settings-account'];

  useEffect(() => {
    if (user?.role === 'supervisor' && !supervisorAllowedPages.includes(currentPage)) {
      setCurrentPage('overview');
    }
  }, [currentPage, user?.role]);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        if (ordersLoading) return <OverviewSkeleton />;
        return <OverviewPage user={user} onNavigate={setCurrentPage} onViewOrder={handleNavigateToOrderDetail} orders={orders} />;
      case 'orders':
        if (ordersLoading) return <OrdersSkeleton />;
        return <OrdersPage user={user} onViewOrder={handleNavigateToOrderDetail} onNavigate={setCurrentPage} orders={orders} />;
      case 'create-order':
        return <CreateOrderPage onBack={() => setCurrentPage('orders')} onOrderCreated={() => console.log('Order created!')} />;
      case 'order-detail':
        if (!selectedOrder) {
          return <OrderDetailSkeleton />;
        }
        return <OrderDetailPage order={selectedOrder} onBack={handleBackFromOrderDetail} onUpdateOrder={handleUpdateOrder} onDeleteOrder={handleDeleteOrder} />;
      case 'team':
        return <TeamMembersPage user={user} />;
      case 'checklist':
        return <ChecklistManagementPage user={user} />;
      case 'service-types':
        return <ServiceTypesPage
          user={user}
          serviceTypes={services.map(s => ({ id: s.id, name: s.name, description: s.description || '' }))}
          onCreateService={async (data) => {
            await api.createService({ name: data.name, description: data.description, businessId: user.id });
            await loadServices();
          }}
          onUpdateService={async (id, data) => {
            await api.updateService(id, { name: data.name, description: data.description });
            await loadServices();
          }}
          onDeleteService={async (id) => {
            await api.deleteService(id);
            await loadServices();
          }}
        />;
      case 'addons':
        return <AddonsPage user={user} />;
      case 'settings':
        return <CompanySettingsPage user={user} />;
      case 'settings-account':
        return <SettingsAccountPage user={user} onUserUpdate={onUserUpdate} />;
      case 'settings-general':
        return <SettingsGeneralPage user={user} />;
      case 'settings-renewal':
        return <SettingsRenewalPage user={user} />;
      default:
        if (ordersLoading) return <OverviewSkeleton />;
        return <OverviewPage user={user} onNavigate={setCurrentPage} onViewOrder={handleNavigateToOrderDetail} orders={orders} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        user={user}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onViewOrder={handleNavigateToOrderDetail}
        orders={orders}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-700"
          >
            <IconMenu2 className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#033620] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm">✨</span>
            </div>
            <span className="text-[#033620] font-semibold">SparkTask</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}