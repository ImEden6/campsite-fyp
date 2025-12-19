# Equipment API Documentation

This document describes the frontend Equipment API service layer for managing equipment inventory, rentals, and availability in the Campsite Management System.

## Overview

The Equipment API service (`frontend/src/services/api/equipment.ts`) provides a type-safe interface for all equipment-related operations, including:

- Equipment catalog management (CRUD operations)
- Equipment rental management
- Availability checking
- Pricing calculations
- Category management
- Inventory tracking

All methods are fully typed with TypeScript for compile-time safety and integrate seamlessly with React Query for caching and state management.

## Type Definitions

### EquipmentFilters

Filter options for querying equipment:

```typescript
interface EquipmentFilters {
  category?: EquipmentCategory;      // Filter by equipment category
  status?: EquipmentStatus;          // Filter by status (AVAILABLE, RENTED, MAINTENANCE, etc.)
  search?: string;                   // Search by name or description
  minPrice?: number;                 // Minimum daily rate
  maxPrice?: number;                 // Maximum daily rate
  availableOnly?: boolean;           // Show only available equipment
}
```

### EquipmentAvailability

Equipment availability information for a date range:

```typescript
interface EquipmentAvailability {
  equipmentId: string;               // Equipment ID
  availableQuantity: number;         // Number of units available
  startDate: Date;                   // Start of availability period
  endDate: Date;                     // End of availability period
}
```

### CreateEquipmentRequest

Data required to create new equipment:

```typescript
interface CreateEquipmentRequest {
  name: string;                      // Equipment name
  description?: string;              // Detailed description
  category: EquipmentCategory;       // Equipment category
  quantity: number;                  // Total quantity in inventory
  dailyRate: number;                 // Daily rental rate
  weeklyRate: number;                // Weekly rental rate
  monthlyRate: number;               // Monthly rental rate
  deposit: number;                   // Security deposit amount
  images?: string[];                 // Array of image URLs
  specifications?: Record<string, any>; // Custom specifications
}
```

### UpdateEquipmentRequest

Data for updating existing equipment (all fields optional):

```typescript
interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {
  status?: EquipmentStatus;          // Update equipment status
  availableQuantity?: number;        // Update available quantity
}
```

### CreateRentalRequest

Data required to create an equipment rental:

```typescript
interface CreateRentalRequest {
  bookingId: string;                 // Associated booking ID
  equipmentId: string;               // Equipment to rent
  quantity: number;                  // Number of units to rent
  startDate: Date;                   // Rental start date
  endDate: Date;                     // Rental end date
}
```

### UpdateRentalRequest

Data for updating a rental (all fields optional):

```typescript
interface UpdateRentalRequest {
  returnedAt?: Date;                 // Date equipment was returned
  condition?: string;                // Condition upon return
  notes?: string;                    // Additional notes
}
```

## API Methods

### Equipment Catalog Management

#### getEquipment()

Retrieve equipment with optional filtering and pagination.

```typescript
getEquipment(
  filters?: EquipmentFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Equipment>>
```

**Parameters:**
- `filters` - Optional filter criteria
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Returns:** Paginated list of equipment

**Example:**
```typescript
import { getEquipment } from '@services/api/equipment';

// Get all available tents
const response = await getEquipment({
  category: 'TENT',
  availableOnly: true,
  maxPrice: 50
}, 1, 10);

console.log(response.data); // Equipment[]
console.log(response.pagination); // { page, limit, total, pages }
```

#### getEquipmentById()

Retrieve a single equipment item by ID.

```typescript
getEquipmentById(id: string): Promise<ApiResponse<Equipment>>
```

**Parameters:**
- `id` - Equipment ID

**Returns:** Equipment details

**Example:**
```typescript
const response = await getEquipmentById('eq_123');
console.log(response.data); // Equipment object
```

#### createEquipment()

Create new equipment (Admin only).

```typescript
createEquipment(
  data: CreateEquipmentRequest
): Promise<ApiResponse<Equipment>>
```

**Parameters:**
- `data` - Equipment creation data

**Returns:** Created equipment

**Example:**
```typescript
const newEquipment = await createEquipment({
  name: 'Coleman 4-Person Tent',
  description: 'Spacious family tent with rain fly',
  category: 'TENT',
  quantity: 10,
  dailyRate: 25.00,
  weeklyRate: 150.00,
  monthlyRate: 500.00,
  deposit: 50.00,
  images: ['https://example.com/tent1.jpg'],
  specifications: {
    capacity: 4,
    weight: '12 lbs',
    dimensions: '9ft x 7ft'
  }
});
```

#### updateEquipment()

Update existing equipment (Admin only).

```typescript
updateEquipment(
  id: string,
  data: UpdateEquipmentRequest
): Promise<ApiResponse<Equipment>>
```

**Parameters:**
- `id` - Equipment ID
- `data` - Fields to update

**Returns:** Updated equipment

**Example:**
```typescript
const updated = await updateEquipment('eq_123', {
  dailyRate: 30.00,
  status: 'AVAILABLE',
  availableQuantity: 8
});
```

#### deleteEquipment()

Delete equipment (Admin only).

```typescript
deleteEquipment(id: string): Promise<ApiResponse<void>>
```

**Parameters:**
- `id` - Equipment ID

**Returns:** Success response

**Example:**
```typescript
await deleteEquipment('eq_123');
```

### Availability Management

#### checkEquipmentAvailability()

Check equipment availability for a specific date range.

```typescript
checkEquipmentAvailability(
  equipmentId: string,
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<EquipmentAvailability>>
```

**Parameters:**
- `equipmentId` - Equipment ID
- `startDate` - Start of rental period
- `endDate` - End of rental period

**Returns:** Availability information

**Example:**
```typescript
const availability = await checkEquipmentAvailability(
  'eq_123',
  new Date('2024-07-01'),
  new Date('2024-07-07')
);

console.log(availability.data.availableQuantity); // 5
```

### Rental Management

#### getBookingRentals()

Get all equipment rentals for a specific booking.

```typescript
getBookingRentals(
  bookingId: string
): Promise<ApiResponse<EquipmentRental[]>>
```

**Parameters:**
- `bookingId` - Booking ID

**Returns:** Array of equipment rentals

**Example:**
```typescript
const rentals = await getBookingRentals('booking_123');
console.log(rentals.data); // EquipmentRental[]
```

#### createRental()

Create a new equipment rental.

```typescript
createRental(
  data: CreateRentalRequest
): Promise<ApiResponse<EquipmentRental>>
```

**Parameters:**
- `data` - Rental creation data

**Returns:** Created rental

**Example:**
```typescript
const rental = await createRental({
  bookingId: 'booking_123',
  equipmentId: 'eq_123',
  quantity: 2,
  startDate: new Date('2024-07-01'),
  endDate: new Date('2024-07-07')
});
```

#### updateRental()

Update an existing rental (e.g., mark as returned).

```typescript
updateRental(
  id: string,
  data: UpdateRentalRequest
): Promise<ApiResponse<EquipmentRental>>
```

**Parameters:**
- `id` - Rental ID
- `data` - Fields to update

**Returns:** Updated rental

**Example:**
```typescript
const updated = await updateRental('rental_123', {
  returnedAt: new Date(),
  condition: 'Good - minor wear',
  notes: 'All items accounted for'
});
```

#### deleteRental()

Delete a rental (cancel before pickup).

```typescript
deleteRental(id: string): Promise<ApiResponse<void>>
```

**Parameters:**
- `id` - Rental ID

**Returns:** Success response

**Example:**
```typescript
await deleteRental('rental_123');
```

### Category Management

#### getEquipmentCategories()

Get all available equipment categories.

```typescript
getEquipmentCategories(): Promise<ApiResponse<EquipmentCategory[]>>
```

**Returns:** Array of equipment categories

**Example:**
```typescript
const categories = await getEquipmentCategories();
console.log(categories.data); // ['TENT', 'SLEEPING_BAG', 'COOLER', ...]
```

### Pricing

#### calculateRentalPrice()

Calculate the total price for an equipment rental.

```typescript
calculateRentalPrice(
  equipmentId: string,
  quantity: number,
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<{
  totalAmount: number;
  depositAmount: number;
  days: number;
}>>
```

**Parameters:**
- `equipmentId` - Equipment ID
- `quantity` - Number of units
- `startDate` - Rental start date
- `endDate` - Rental end date

**Returns:** Pricing breakdown

**Example:**
```typescript
const pricing = await calculateRentalPrice(
  'eq_123',
  2,
  new Date('2024-07-01'),
  new Date('2024-07-07')
);

console.log(pricing.data);
// {
//   totalAmount: 300.00,  // 2 units × $25/day × 6 days
//   depositAmount: 100.00, // 2 units × $50 deposit
//   days: 6
// }
```

## React Query Integration

### Custom Hooks Examples

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as equipmentApi from '@services/api/equipment';

// Fetch equipment list
export const useEquipment = (filters?: EquipmentFilters, page = 1) => {
  return useQuery({
    queryKey: ['equipment', filters, page],
    queryFn: () => equipmentApi.getEquipment(filters, page),
  });
};

// Fetch single equipment
export const useEquipmentById = (id: string) => {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentApi.getEquipmentById(id),
    enabled: !!id,
  });
};

// Check availability
export const useEquipmentAvailability = (
  equipmentId: string,
  startDate: Date,
  endDate: Date
) => {
  return useQuery({
    queryKey: ['equipment', equipmentId, 'availability', startDate, endDate],
    queryFn: () => equipmentApi.checkEquipmentAvailability(equipmentId, startDate, endDate),
    enabled: !!equipmentId && !!startDate && !!endDate,
  });
};

// Create equipment mutation
export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: equipmentApi.createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

// Create rental mutation
export const useCreateRental = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: equipmentApi.createRental,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ 
        queryKey: ['bookings', data.data.bookingId, 'rentals'] 
      });
    },
  });
};
```

### Usage in Components

```typescript
import { useEquipment, useCreateRental } from '@hooks/useEquipment';

function EquipmentCatalog() {
  const [filters, setFilters] = useState<EquipmentFilters>({
    availableOnly: true,
  });
  
  const { data, isLoading, error } = useEquipment(filters);
  const createRental = useCreateRental();
  
  const handleRent = async (equipmentId: string) => {
    try {
      await createRental.mutateAsync({
        bookingId: currentBookingId,
        equipmentId,
        quantity: 1,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-07'),
      });
      toast.success('Equipment added to booking');
    } catch (error) {
      toast.error('Failed to add equipment');
    }
  };
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {data?.data.map(equipment => (
        <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          onRent={() => handleRent(equipment.id)}
        />
      ))}
    </div>
  );
}
```

## Error Handling

All API methods throw errors that conform to the `ApiError` interface:

```typescript
interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  code?: string;
}
```

**Example error handling:**

```typescript
try {
  await createEquipment(equipmentData);
} catch (error) {
  const apiError = error as ApiError;
  
  if (apiError.statusCode === 400 && apiError.errors) {
    // Handle validation errors
    Object.entries(apiError.errors).forEach(([field, messages]) => {
      console.error(`${field}: ${messages.join(', ')}`);
    });
  } else {
    // Handle general error
    console.error(apiError.message);
  }
}
```

## Best Practices

### 1. Use React Query for Data Fetching

Always use React Query hooks instead of calling API methods directly in components:

```typescript
// ✅ Good
const { data } = useEquipment({ availableOnly: true });

// ❌ Bad
const [equipment, setEquipment] = useState([]);
useEffect(() => {
  getEquipment({ availableOnly: true }).then(setEquipment);
}, []);
```

### 2. Check Availability Before Booking

Always verify equipment availability before allowing rentals:

```typescript
const { data: availability } = useEquipmentAvailability(
  equipmentId,
  startDate,
  endDate
);

const canRent = availability?.data.availableQuantity >= requestedQuantity;
```

### 3. Calculate Pricing Upfront

Show users the total cost before they commit:

```typescript
const { data: pricing } = useQuery({
  queryKey: ['equipment', equipmentId, 'pricing', quantity, startDate, endDate],
  queryFn: () => calculateRentalPrice(equipmentId, quantity, startDate, endDate),
  enabled: !!equipmentId && quantity > 0,
});

// Display: Total: ${pricing?.data.totalAmount} + ${pricing?.data.depositAmount} deposit
```

### 4. Invalidate Queries After Mutations

Ensure UI stays in sync after creating/updating rentals:

```typescript
const createRental = useMutation({
  mutationFn: equipmentApi.createRental,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['equipment'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  },
});
```

### 5. Handle Loading and Error States

Provide feedback during async operations:

```typescript
const { data, isLoading, error } = useEquipment();

if (isLoading) return <SkeletonLoader />;
if (error) return <ErrorAlert message={error.message} />;
if (!data?.data.length) return <EmptyState />;

return <EquipmentGrid equipment={data.data} />;
```

## Related Documentation

- [API Client Types](./README.md#frontend-api-client) - Core API type definitions
- [WebSocket Events](./websocket.md) - Real-time equipment updates
- [User Guide: Equipment Management](../user-guide/equipment-management.md) - End-user documentation

## Implementation Status

This API service implements the following tasks from the implementation plan:

- ✅ Task 11.1: Equipment catalog with filtering and availability
- ✅ Task 11.2: Equipment rental interface with pricing
- ✅ Task 11.3: Inventory management for admins
