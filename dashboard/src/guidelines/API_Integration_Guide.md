# API Integration Guide

## Overview
This guide explains how to integrate external API data with SparkTask components. All modified components support **dual mode operation**: they work with mock data by default (standalone mode) and accept external data via props (connected mode).

## Modified Components

### 1. Login.tsx

#### New Prop
- `onSubmit?: (email: string, password: string) => Promise<void>`

#### Usage Example

**Standalone Mode (Mock Data)**
```tsx
<Login 
  onLogin={handleLogin}
  onSwitchToRegister={handleRegister}
  onSwitchToForgotPassword={handleForgotPassword}
/>
```

**Connected Mode (External API)**
```tsx
const handleApiLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  
  const userData = await response.json();
  // Handle successful login
  onLogin(userData);
};

<Login 
  onLogin={handleLogin}
  onSwitchToRegister={handleRegister}
  onSwitchToForgotPassword={handleForgotPassword}
  onSubmit={handleApiLogin}
/>
```

#### Features
- Loading state with disabled button
- Error handling with visual feedback
- Maintains all existing UI and styling

---

### 2. OrdersList.tsx

#### New Props
- `orders?: Order[]`

#### Order Type Definition
```typescript
export type Order = {
  id: string;
  orderCode: string;
  customer: {
    name: string;
    address: string;
  };
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  tasks: Array<{
    items: any[];
  }>;
};
```

#### Usage Example

**Standalone Mode (Mock Data)**
```tsx
<OrdersList 
  onOrderClick={handleOrderClick}
  onCreateOrder={handleCreateOrder}
  searchQuery={searchQuery}
  filter={filter}
  fromDate={fromDate}
  toDate={toDate}
/>
```

**Connected Mode (External API)**
```tsx
const [orders, setOrders] = useState<Order[]>([]);

useEffect(() => {
  const fetchOrders = async () => {
    const response = await fetch('/api/orders');
    const data = await response.json();
    setOrders(data);
  };
  
  fetchOrders();
}, []);

<OrdersList 
  onOrderClick={handleOrderClick}
  onCreateOrder={handleCreateOrder}
  searchQuery={searchQuery}
  filter={filter}
  fromDate={fromDate}
  toDate={toDate}
  orders={orders}
/>
```

#### Features
- All filtering and search work with external data
- Pagination maintained
- Full compatibility with existing props

---

### 3. CreateOrderDialog.tsx

#### New Prop
- `onSubmit?: (orderData: any) => Promise<void>`

#### Order Data Structure
```typescript
{
  orderNumber: string;        // Auto-generated (e.g., "ORD-1234")
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceType: string;
  duration: string;
  areas: string[];
  addons: string[];
  assignedEmployees: string[];
  goal: string;
  customerNotes: string;
  accessInstructions: string;
}
```

#### Usage Example

**Standalone Mode (Mock Data)**
```tsx
<CreateOrderDialog 
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
/>
```

**Connected Mode (External API)**
```tsx
const handleCreateOrder = async (orderData: any) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create order');
  }
  
  const newOrder = await response.json();
  // Update local state or refetch orders
  setOrders(prev => [...prev, newOrder]);
};

<CreateOrderDialog 
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  onSubmit={handleCreateOrder}
/>
```

#### Features
- Loading state during submission
- Error handling with visual feedback
- Form auto-reset on success
- Auto-closes dialog on successful submission

---

## Integration Best Practices

### Error Handling
All connected components expect errors to be thrown from the async functions:

```typescript
const handleApiCall = async (...args) => {
  try {
    const response = await fetch('/api/endpoint', { ... });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Operation failed');
    }
    
    return await response.json();
  } catch (error) {
    // Component will display this error
    throw error;
  }
};
```

### Loading States
Components manage their own loading states. You don't need to track loading externally.

### Type Safety
Export the `Order` type from `OrdersList.tsx` for use in your application:

```typescript
import { Order } from './components/orders/OrdersList';
```

---

## Migration Checklist

When migrating from mock to real API:

1. ✅ **Login Component**
   - [ ] Create API endpoint for authentication
   - [ ] Implement `onSubmit` handler
   - [ ] Test error scenarios
   - [ ] Verify user data structure matches

2. ✅ **Orders List**
   - [ ] Create API endpoint for fetching orders
   - [ ] Ensure data matches `Order` type
   - [ ] Test filtering with real data
   - [ ] Verify pagination works correctly

3. ✅ **Create Order Dialog**
   - [ ] Create API endpoint for creating orders
   - [ ] Implement `onSubmit` handler
   - [ ] Update orders list after creation
   - [ ] Test validation and error handling

---

## Notes

- All components maintain backward compatibility
- Mock data is used when no external props are provided
- UI and styling remain unchanged
- All existing functionality is preserved
- Components are fully responsive
