import { Avatar, AvatarFallback } from './ui/avatar';
import { useState, useEffect } from 'react';
import {
  IconHome,
  IconClipboardList,
  IconClipboardCheck,
  IconUsers,
  IconCirclePlus,
  IconCreditCard,
  IconSettings,
  IconSparkles,
  IconLogout,
  IconX,
  IconBriefcase,
  IconChevronDown,
  IconChevronUp,
  IconUser,
  IconBuilding,
} from '@tabler/icons-react';
import { PageType } from './Dashboard';
import { InProgressOrdersCarousel } from './InProgressOrdersCarousel';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  user: any;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  onViewOrder?: (orderId: string) => void;
  orders?: any[];
}

export function Sidebar({ currentPage, onPageChange, user, onLogout, isOpen, onClose, onViewOrder, orders }: SidebarProps) {
  // Auto-open settings dropdown if on a settings page
  const [isSettingsOpen, setIsSettingsOpen] = useState(currentPage.startsWith('settings'));
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(currentPage.startsWith('settings'));
  
  // Auto-open services dropdown if on a service-related page
  const servicePages = ['service-types', 'checklist', 'addons'];
  const [isServicesOpen, setIsServicesOpen] = useState(servicePages.includes(currentPage));
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(servicePages.includes(currentPage));

  // Update dropdown state when page changes
  useEffect(() => {
    if (currentPage.startsWith('settings')) {
      setIsSettingsOpen(true);
      setIsMobileSettingsOpen(true);
    }
    if (servicePages.includes(currentPage)) {
      setIsServicesOpen(true);
      setIsMobileServicesOpen(true);
    }
  }, [currentPage]);

  const menuItems = [
    { id: 'overview' as PageType, label: 'Dashboard', icon: IconHome },
    { id: 'orders' as PageType, label: 'Orders', icon: IconClipboardList },
    ...(user?.role !== 'supervisor' ? [{ id: 'team' as PageType, label: 'Team Member', icon: IconUsers }] : []),
  ];

  const isSupervisor = user?.role === 'supervisor';

  const servicesSubMenu = [
    { id: 'service-types' as PageType, label: 'Service Types', icon: IconBriefcase },
    { id: 'checklist' as PageType, label: 'Areas & Checklist', icon: IconClipboardCheck },
    { id: 'addons' as PageType, label: 'Add-ons', icon: IconCirclePlus },
  ];

  const settingsSubMenu = isSupervisor
    ? [{ id: 'settings-account' as PageType, label: 'Account', icon: IconUser }]
    : [
        { id: 'settings-account' as PageType, label: 'Account', icon: IconUser },
        { id: 'settings-general' as PageType, label: 'General', icon: IconBuilding },
        { id: 'settings-renewal' as PageType, label: 'Renewal Center', icon: IconCreditCard },
      ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col shadow-lg">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-md">
              <IconSparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#033620] font-semibold text-xl">SparkTask</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Mark Orders as active when on order-detail page
            const isActive = currentPage === item.id || 
                           (item.id === 'orders' && currentPage === 'order-detail');
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#033620] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Services Dropdown */}
          {!isSupervisor && (
          <div>
            <button
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            >
              <IconBriefcase className="w-5 h-5" />
              <span className="flex-1 text-left">Services</span>
              {isServicesOpen ? (
                <IconChevronUp className="w-4 h-4" />
              ) : (
                <IconChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Submenu */}
            {isServicesOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {servicesSubMenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = currentPage === subItem.id;
                  
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => onPageChange(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        isSubActive
                          ? 'bg-[#033620] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <SubIcon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Settings Dropdown */}
          <div>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            >
              <IconSettings className="w-5 h-5" />
              <span className="flex-1 text-left">Settings</span>
              {isSettingsOpen ? (
                <IconChevronUp className="w-4 h-4" />
              ) : (
                <IconChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Submenu */}
            {isSettingsOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {settingsSubMenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = currentPage === subItem.id;
                  
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => onPageChange(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        isSubActive
                          ? 'bg-[#033620] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <SubIcon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* In Progress Orders Carousel */}
        <div className="border-t border-gray-200 pt-4">
          <InProgressOrdersCarousel onViewOrder={onViewOrder} orders={orders} />
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm">
            <Avatar>
              <AvatarFallback className="bg-[#033620] text-white shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.company}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-sm"
          >
            <IconLogout className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo with Close Button */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-md">
              <IconSparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#033620] font-semibold text-xl">SparkTask</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IconX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Mark Orders as active when on order-detail page
            const isActive = currentPage === item.id || 
                           (item.id === 'orders' && currentPage === 'order-detail');
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#033620] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Services Dropdown */}
          {!isSupervisor && (
          <div>
            <button
              onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            >
              <IconBriefcase className="w-5 h-5" />
              <span className="flex-1 text-left">Services</span>
              {isMobileServicesOpen ? (
                <IconChevronUp className="w-4 h-4" />
              ) : (
                <IconChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Submenu */}
            {isMobileServicesOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {servicesSubMenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = currentPage === subItem.id;
                  
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => onPageChange(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        isSubActive
                          ? 'bg-[#033620] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <SubIcon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Settings Dropdown */}
          <div>
            <button
              onClick={() => setIsMobileSettingsOpen(!isMobileSettingsOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            >
              <IconSettings className="w-5 h-5" />
              <span className="flex-1 text-left">Settings</span>
              {isMobileSettingsOpen ? (
                <IconChevronUp className="w-4 h-4" />
              ) : (
                <IconChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Submenu */}
            {isMobileSettingsOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {settingsSubMenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = currentPage === subItem.id;
                  
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => onPageChange(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                        isSubActive
                          ? 'bg-[#033620] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <SubIcon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* In Progress Orders Carousel */}
        <div className="border-t border-gray-200 pt-4">
          <InProgressOrdersCarousel onViewOrder={onViewOrder} orders={orders} />
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm">
            <Avatar>
              <AvatarFallback className="bg-[#033620] text-white shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.company}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-sm"
          >
            <IconLogout className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}