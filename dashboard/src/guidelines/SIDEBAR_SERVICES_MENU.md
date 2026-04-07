# Sidebar - Services Menu Dropdown

## 📋 Overview

Los menús **Service Types**, **Areas & Checklist** y **Add-ons** han sido agrupados bajo un menú desplegable llamado **"Services"**, siguiendo el mismo patrón del menú **"Settings"**.

---

## 🎯 Estructura del Sidebar

### Menús Principales (Top Level)
1. 🏠 **Dashboard** - Página de inicio
2. 📋 **Orders** - Gestión de órdenes
3. 👥 **Team Member** - Gestión de equipo
4. 💼 **Services** - Menú desplegable (nuevo)
5. ⚙️ **Settings** - Menú desplegable

### Submenús de Services 💼
Cuando se hace clic en "Services", se expande para mostrar:
- 💼 **Service Types** - Tipos de servicios de limpieza
- ✅ **Areas & Checklist** - Áreas y checklist personalizados
- ➕ **Add-ons** - Add-ons complementarios

### Submenús de Settings ⚙️
- 👤 **Account** - Información de cuenta
- 🏢 **General** - Configuración general
- 💳 **Renewal Center** - Centro de renovación

---

## 🔧 Implementation Details

### Estados de Dropdown

```typescript
// Auto-open services dropdown if on a service-related page
const servicePages = ['service-types', 'checklist', 'addons'];
const [isServicesOpen, setIsServicesOpen] = useState(servicePages.includes(currentPage));
const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(servicePages.includes(currentPage));
```

### Auto-Expansion Logic

El menú **Services** se abre automáticamente cuando:
- El usuario está en la página **Service Types**
- El usuario está en la página **Areas & Checklist**
- El usuario está en la página **Add-ons**

```typescript
if (servicePages.includes(currentPage) && !isServicesOpen) {
  setIsServicesOpen(true);
}
```

---

## 🎨 Visual Design

### Main Menu Button
```tsx
<button
  onClick={() => setIsServicesOpen(!isServicesOpen)}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-50 hover:shadow-sm"
>
  <BriefcaseIcon className="w-5 h-5" />
  <span className="flex-1 text-left">Services</span>
  {isServicesOpen ? (
    <ChevronUpIcon className="w-4 h-4" />
  ) : (
    <ChevronDownIcon className="w-4 h-4" />
  )}
</button>
```

### Submenu Items
```tsx
<div className="ml-4 mt-1 space-y-1">
  {servicesSubMenu.map((subItem) => {
    const SubIcon = subItem.icon;
    const isSubActive = currentPage === subItem.id;
    
    return (
      <button
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
```

---

## 📱 Responsive Behavior

### Desktop Sidebar
- Dropdown expandible en lugar fijo
- Estado separado: `isServicesOpen`
- Icono chevron animado

### Mobile Sidebar
- Mismo comportamiento que desktop
- Estado separado: `isMobileServicesOpen`
- Auto-cierra sidebar al seleccionar submenu

---

## 🎯 Icon Mapping

| Menu Item | Icon | Type |
|-----------|------|------|
| **Services** (main) | `BriefcaseIcon` | Solid |
| Service Types | `BriefcaseIcon` | Solid |
| Areas & Checklist | `ClipboardDocumentCheckIcon` | Solid |
| Add-ons | `PlusCircleIcon` | Solid |

---

## 📊 Menu Order

```
1. Dashboard
2. Orders
3. Team Member
4. Services ▼
   ├── Service Types
   ├── Areas & Checklist
   └── Add-ons
5. Settings ▼
   ├── Account
   ├── General
   └── Renewal Center
```

---

## 💡 Benefits

### 1. **Better Organization**
- Agrupa funcionalidades relacionadas
- Reduce clutter en el sidebar
- Jerarquía visual clara

### 2. **Consistency**
- Mismo patrón que Settings menu
- User experience familiar
- Código reutilizable

### 3. **Scalability**
- Fácil agregar más servicios
- Estructura extensible
- Mantiene sidebar limpio

### 4. **UX Improvements**
- Auto-expansion cuando usuario está en página de servicio
- Visual feedback con chevron animado
- Estados activos claros

---

## 🔑 Key Code Locations

### Main Logic
**File:** `/components/Sidebar.tsx`

### Service Pages Array
```typescript
const servicePages = ['service-types', 'checklist', 'addons'];
```

### Services Submenu Definition
```typescript
const servicesSubMenu = [
  { id: 'service-types' as PageType, label: 'Service Types', icon: BriefcaseIcon },
  { id: 'checklist' as PageType, label: 'Areas & Checklist', icon: ClipboardDocumentCheckIcon },
  { id: 'addons' as PageType, label: 'Add-ons', icon: PlusCircleIcon },
];
```

### Auto-Expansion Logic
**Lines ~50-56:**
```typescript
if (servicePages.includes(currentPage) && !isServicesOpen) {
  setIsServicesOpen(true);
}
if (servicePages.includes(currentPage) && !isMobileServicesOpen) {
  setIsMobileServicesOpen(true);
}
```

---

## 🎨 Color Scheme

### Active Submenu Item
```css
bg-[#033620] text-white shadow-sm
```
- Background: Verde oscuro #033620
- Text: Blanco
- Shadow: Suave

### Inactive Submenu Item
```css
text-gray-600 hover:bg-gray-50 hover:shadow-sm
```
- Text: Gris 600
- Hover background: Gris 50
- Hover shadow: Suave

### Main Menu Button
```css
text-gray-700 hover:bg-gray-50 hover:shadow-sm
```
- Text: Gris 700
- Hover background: Gris 50
- No active state (solo submenus)

---

## 🧪 Testing Checklist

### Desktop Sidebar
- [ ] Click on "Services" expands submenu
- [ ] Click again collapses submenu
- [ ] Chevron icon rotates on expand/collapse
- [ ] Auto-expands when on Service Types page
- [ ] Auto-expands when on Areas & Checklist page
- [ ] Auto-expands when on Add-ons page
- [ ] Active submenu highlighted in green
- [ ] Hover effects work on all items

### Mobile Sidebar
- [ ] Same functionality as desktop
- [ ] Submenu items are clickable
- [ ] Active states work correctly
- [ ] Auto-expansion works
- [ ] Independent state from desktop

### Navigation
- [ ] Click Service Types navigates correctly
- [ ] Click Areas & Checklist navigates correctly
- [ ] Click Add-ons navigates correctly
- [ ] Back button navigation maintains dropdown state
- [ ] Direct URL navigation opens correct dropdown

---

## 🚀 Future Enhancements

Possible improvements:
1. Add animation to submenu expand/collapse
2. Add badge to show number of configured services
3. Add "quick add" button in submenu
4. Add tooltips explaining each service type
5. Add recent items indicator
6. Group by frequency of use

---

## 📝 Migration Notes

### Before
```
- Dashboard
- Orders
- Service Types (top level)
- Areas & Checklist (top level)
- Add-ons (top level)
- Team Member
- Settings ▼
```

### After
```
- Dashboard
- Orders
- Team Member
- Services ▼
  - Service Types
  - Areas & Checklist
  - Add-ons
- Settings ▼
```

**Changes:**
- ✅ Service Types moved to Services submenu
- ✅ Areas & Checklist moved to Services submenu
- ✅ Add-ons moved to Services submenu
- ✅ Team Member moved up in order
- ✅ Services dropdown added
- ✅ Auto-expansion logic implemented

---

## 🎯 User Experience Flow

### Scenario 1: Direct Navigation
1. User clicks "Services" in sidebar
2. Submenu expands with animation
3. User sees 3 options
4. User clicks "Service Types"
5. Page navigates
6. Submenu stays open
7. "Service Types" highlighted in green

### Scenario 2: Direct URL
1. User navigates to `/service-types` via URL
2. Sidebar loads
3. Services dropdown auto-opens
4. Service Types highlighted in green
5. User sees context immediately

### Scenario 3: Page Reload
1. User is on Areas & Checklist page
2. User refreshes page
3. Services dropdown opens automatically
4. Areas & Checklist remains highlighted
5. State preserved

---

## ✨ Design Consistency

### Pattern Matching with Settings
Both **Services** and **Settings** follow the same pattern:

| Feature | Services | Settings |
|---------|----------|----------|
| **Icon** | BriefcaseIcon | Cog6ToothIcon |
| **Chevron** | ✅ Yes | ✅ Yes |
| **Auto-expand** | ✅ Yes | ✅ Yes |
| **Submenu indent** | 4ml (16px) | 4ml (16px) |
| **Active color** | #033620 | #033620 |
| **Hover effect** | Gray 50 | Gray 50 |
| **Text size** | sm (14px) | sm (14px) |
| **Mobile state** | Separate | Separate |

---

## 📦 Component Structure

```tsx
Sidebar
├── Desktop Sidebar
│   ├── Logo
│   ├── Navigation
│   │   ├── Menu Items (Dashboard, Orders, Team)
│   │   ├── Services Dropdown
│   │   │   └── Submenu Items
│   │   └── Settings Dropdown
│   │       └── Submenu Items
│   ├── In Progress Carousel
│   └── User Profile
└── Mobile Sidebar
    ├── Logo + Close
    ├── Navigation (same structure)
    ├── In Progress Carousel
    └── User Profile
```

---

## 🔍 Code Review Notes

### Key Changes
1. Added `servicesSubMenu` array
2. Added `servicePages` array for auto-expansion
3. Added `isServicesOpen` and `isMobileServicesOpen` states
4. Removed service items from main `menuItems` array
5. Added Services dropdown section (2 times: desktop + mobile)
6. Implemented auto-expansion logic
7. Imported `WrenchScrewdriverIcon` (not used, can be removed)

### Code Quality
- ✅ Consistent with existing patterns
- ✅ DRY principle followed (reused submenu pattern)
- ✅ Responsive design maintained
- ✅ Accessibility preserved
- ✅ Type safety maintained

---

## 📚 Related Files

- `/components/Sidebar.tsx` - Main component
- `/components/Dashboard.tsx` - Page routing
- `/guidelines/ORDER_EDIT_RESTRICTION.md` - Related feature
- `/EXTERNAL_API_READY.md` - System overview
