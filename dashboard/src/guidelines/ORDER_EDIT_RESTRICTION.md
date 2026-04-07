# Order Edit Restriction - Scheduled Only

## 📋 Overview

Las órdenes en SparkTask **solo pueden editarse cuando están en estado "Scheduled"**. Cuando una orden cambia a cualquier otro estado (In Progress, Completed, Canceled), todas las opciones de edición se ocultan automáticamente.

## 🔒 Estados de Orden

### ✅ Scheduled (Editable)
- **Todas las opciones de edición disponibles**
- Puede modificar: Customer details, Service details, Schedule, Team, Notes, Access instructions
- Puede eliminar la orden
- Puede cambiar el estado

### 🚫 In Progress (Read-Only)
- **Todas las opciones de edición ocultas**
- Solo muestra el progreso del checklist
- No se puede modificar ningún dato
- No se puede eliminar
- Muestra advertencia al intentar cambiar estado

### 🚫 Completed (Read-Only)
- **Todas las opciones de edición ocultas**
- Orden completada, solo lectura
- No se puede modificar ningún dato
- No se puede eliminar

### 🚫 Canceled (Read-Only)
- **Todas las opciones de edición ocultas**
- Orden cancelada, solo lectura
- No se puede modificar ningún dato
- ✅ **SE PUEDE ELIMINAR** (para limpieza de órdenes canceladas)

---

## 🔧 Implementation Details

### Variables de Control

```typescript
// En OrderDetailPage.tsx
const canEdit = currentOrder.status === 'scheduled';
const canDelete = currentOrder.status === 'scheduled' || currentOrder.status === 'canceled';
```

- **`canEdit`**: Controla **todas** las opciones de edición en el componente
- **`canDelete`**: Controla la disponibilidad del botón Delete Order

### Elementos Controlados

#### 1. **Customer Information - Edit Button**
```typescript
{!isEditingCustomer && canEdit && (
  <Button onClick={() => setIsEditingCustomer(true)}>
    <PencilIcon />
  </Button>
)}
```

#### 2. **Schedule - Edit Button**
```typescript
{canEdit && (
  <Button onClick={() => setIsEditingSchedule(true)}>
    <PencilIcon />
  </Button>
)}
```

#### 3. **Notes - Edit Button**
```typescript
{!isEditingNotes && canEdit && (
  <Button onClick={() => setIsEditingNotes(true)}>
    <PencilIcon />
  </Button>
)}
```

#### 4. **Assigned Team - Add Members Dropdown**
```typescript
{canEdit && (
  <Popover open={openMembers}>
    {/* Search team members dropdown */}
  </Popover>
)}
```

#### 5. **Assigned Team - Remove Member Button**
```typescript
{canEdit && (
  <Button onClick={handleRemoveEmployee}>
    <XMarkIcon />
  </Button>
)}
```

#### 6. **Access Instructions - Edit Button**
```typescript
{!isEditingAccessInstructions && canEdit && (
  <Button onClick={() => setIsEditingAccessInstructions(true)}>
    <PencilIcon />
  </Button>
)}
```

#### 7. **Delete Order Button**
```typescript
<Button
  onClick={() => setIsDeleteDialogOpen(true)}
  disabled={!canDelete}
  className={!canDelete 
    ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
    : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
  }
>
  <TrashIcon />
  Delete Order
</Button>
```

---

## 🎯 User Experience

### When Scheduled (Editable)
✅ All edit buttons visible  
✅ Can add/remove team members  
✅ Can modify all order details  
✅ Can delete order  
✅ Green color scheme for actions  

### When Not Scheduled (Read-Only)
❌ Edit buttons hidden  
❌ Cannot add/remove team members  
❌ Cannot modify any details  
❌ Delete button disabled (grayed out)  
📖 Clean read-only view  

### Special Case: In Progress Orders
- Shows **Order Progress** card with collapsible task checklist
- Progress bar with percentage
- All edit options hidden
- Status change shows warning dialog about:
  - Loss of progress tracking
  - Confusion for team members
  - Sync issues with mobile app

---

## 🔄 Status Change Behavior

### From Scheduled → Other Status
- Order becomes read-only immediately
- All edit buttons disappear
- Delete button becomes disabled
- User can still view all information

### From In Progress → Other Status
- Shows warning dialog before confirming
- Warns about potential issues
- Requires explicit confirmation
- After confirmation, order becomes read-only

### Any Status → Scheduled
- Order becomes editable again
- All edit buttons appear
- Delete button becomes active
- Full editing capabilities restored

---

## 📱 Visual Indicators

### Edit Buttons (When canEdit = true)
```css
className="text-[#033620] hover:bg-[#033620]/5"
```
- Green color (#033620)
- Hover effect with light green background
- Visible pencil icon

### Edit Buttons (When canEdit = false)
- **Completely hidden** - Not even shown
- Clean, uncluttered interface
- No disabled buttons (removes visual noise)

### Delete Button (When !canEdit)
```css
className="border-gray-300 text-gray-400 cursor-not-allowed"
```
- Grayed out appearance
- Not clickable
- Clear visual indicator of disabled state

---

## 💡 Benefits

### 1. **Data Integrity**
- Prevents modifications to active or completed orders
- Maintains consistency with mobile app
- Protects progress tracking data

### 2. **User Experience**
- Clear distinction between editable and read-only states
- No confusing disabled buttons everywhere
- Clean interface for completed/in-progress orders

### 3. **Safety**
- Prevents accidental changes to active orders
- Protects team coordination
- Maintains audit trail integrity

### 4. **Mobile Sync**
- Ensures consistency with mobile app
- Prevents sync conflicts
- Maintains real-time progress accuracy

---

## 🧪 Testing Checklist

### Scheduled Orders
- [ ] Can edit customer information
- [ ] Can edit schedule (date/time)
- [ ] Can add/remove team members
- [ ] Can edit notes
- [ ] Can edit access instructions
- [ ] Can delete order
- [ ] Can change status

### In Progress Orders
- [ ] All edit buttons hidden
- [ ] Progress bar visible
- [ ] Task checklist accessible
- [ ] Delete button disabled
- [ ] Status change shows warning
- [ ] Read-only view clear

### Completed Orders
- [ ] All edit buttons hidden
- [ ] Delete button disabled
- [ ] All data readable
- [ ] No edit options available

### Canceled Orders
- [ ] All edit buttons hidden
- [ ] Delete button **ENABLED** (can delete canceled orders)
- [ ] All data readable
- [ ] No edit options available
- [ ] Can delete order for cleanup

### Status Transitions
- [ ] Scheduled → In Progress (edit buttons disappear)
- [ ] In Progress → Scheduled (edit buttons appear)
- [ ] In Progress → Completed (warning shown, then locked)
- [ ] Any status → Scheduled (becomes editable)

---

## 🔑 Key Code Locations

### Main Logic
**File:** `/components/pages/OrderDetailPage.tsx`

**Line ~95-96:**
```typescript
const isInProgress = currentOrder.status === 'in-progress';
const canEdit = currentOrder.status === 'scheduled';
const canDelete = currentOrder.status === 'scheduled' || currentOrder.status === 'canceled';
```

### Edit Button Conditionals
Search for: `canEdit &&` in OrderDetailPage.tsx

All edit buttons use this pattern:
```typescript
{canEdit && <Button>Edit</Button>}
```

---

## 📝 Notes

1. **Original Variable:** Previously used `!isInProgress` which allowed editing on scheduled, completed, and canceled orders
2. **New Variable:** Now uses `canEdit` which ONLY allows editing on scheduled orders
3. **Consistency:** All edit controls use the same `canEdit` variable for consistency
4. **Delete Button:** Uses `disabled={!canDelete}` instead of hiding, to show the button in all cases but disable it appropriately

---

## 🚀 Future Enhancements

Possible improvements:
1. Add "Edit History" to track changes made to orders
2. Add permissions system (admin can edit any order, employee only scheduled)
3. Add "Unlock Order" feature for admins with audit log
4. Show tooltip explaining why edit is disabled when hovering disabled buttons
5. Add visual banner indicating "Read-Only Mode" for non-scheduled orders