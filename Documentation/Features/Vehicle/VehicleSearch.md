# Vehicle Search Feature Documentation

## Overview
This document describes the implementation of the vehicle search functionality in the FMS (Fleet Management System) application. The search feature provides both real-time autocomplete suggestions and advanced filtering capabilities.

## Recent Updates
- **Fixed Response Format Handling**: Updated frontend to handle both camelCase (`data`) and PascalCase (`Data`) property names from backend
- **Enhanced Error Handling**: Added comprehensive error logging and fallback mechanisms
- **Improved Input Handling**: Added proper focus and input event handling for better user experience
- **Backend Validation**: Added input validation to search endpoints
- **Debug Logging**: Added console logging for debugging search issues

## Backend Implementation

### SearchVehicleQuery
**File**: `FMS.Application/Features/Vehicle/Queries/SearchVehicleQuery.cs`

#### Features:
- **Multi-criteria search**: Supports searching by multiple vehicle attributes
- **Optimized queries**: Uses Entity Framework includes for efficient data loading
- **Performance optimized**: Configurable result limits and proper indexing
- **Error handling**: Comprehensive error handling with proper logging using FMSResponse pattern
- **Validation**: Input validation for search terms and limits

#### Search Criteria:
- `SearchTerm`: Required general text search (minimum 2 characters)
- `Limit`: Maximum results to return (1-100, default: 10)
- `VehicleType`: Filter by vehicle type name
- `Manufacturer`: Filter by manufacturer name
- `Model`: Filter by vehicle model name
- `IsActive`: Filter by active status (converts bool to sbyte for MySQL compatibility)

#### Search Fields:
The search term matches against:
- VehicleCode (Company registration number)
- NumberPlate (License plate)
- VehicleModel.Name (Vehicle model name)
- VehicleManufacturer.Name (Manufacturer name)

### API Endpoints

#### 1. Advanced Search
**Endpoint**: `GET /api/vehicle/search`

**Query Parameters**:
```
?query=string
&vehicleTypeId=int
&vehicleManufacturerId=int
&workingSiteId=int
&hasGPS=bool
&isActive=bool
&yearFrom=int
&yearTo=int
&isCompanyVehicle=bool
&pageNumber=int
&pageSize=int
```

**Response Format**:
```json
{
  "success": true,
  "data": [VehicleDTO[]],
  "message": "Found X vehicles matching search criteria. Page Y of Z"
}
```

#### 2. Quick Search
**Endpoint**: `GET /api/vehicle/quick-search`

**Query Parameters**:
```
?q=string
&limit=int (default: 10, max: 100)
```

**Features**:
- Optimized for autocomplete suggestions
- Smaller response payload
- Shorter cache duration (2 minutes vs 5 minutes)

## Frontend Implementation

### VehicleSearchBar Component
**File**: `fms.frontend/src/pages/vehicles/components/VehicleSearchBar.js`

#### Features:
- **Real-time search**: Debounced API calls (300ms delay)
- **Keyboard navigation**: Arrow keys, Enter, and Escape support
- **Click outside handling**: Closes suggestions when clicking elsewhere
- **Highlighting**: Search term highlighting in results
- **Loading states**: Visual feedback during search
- **Error handling**: Graceful error handling with user feedback

#### Key Functions:
- `quickSearchVehicles()`: Calls the backend quick search API
- `highlightText()`: Highlights matching text in suggestions
- `handleSuggestionClick()`: Navigates to vehicle details page

### Redux Actions
**File**: `fms.frontend/src/redux/actions/vehicleSearchActions.js`

#### Available Actions:
- `searchVehicles()`: Full search with all filters
- `quickSearchVehicles()`: Quick search for autocomplete
- `advancedVehicleSearch()`: Advanced search with multiple criteria
- `clearSearchResults()`: Clear search state

## Styling
**File**: `fms.frontend/src/pages/vehicles/components/VehicleSearchBar.scss`

### Key Features:
- **Mobile responsive**: Adapts to different screen sizes
- **Smooth animations**: Slide-down animation for dropdown
- **Accessibility**: Proper focus states and keyboard navigation
- **Visual hierarchy**: Clear distinction between suggestion types

### Mobile Optimizations:
- Full-width suggestions on mobile
- Larger touch targets
- Improved spacing and typography

## Caching Strategy

### Backend Caching:
- **Advanced Search**: 5 minutes cache duration
- **Quick Search**: 2 minutes cache duration
- **Cache Keys**: Include all search parameters for proper invalidation

### Cache Invalidation:
Cache is automatically invalidated when:
- Vehicles are created, updated, or deleted
- Vehicle-related data changes

## Security
- **Authorization**: All search endpoints require JWT authentication
- **Input Validation**: Search parameters are validated before processing
- **SQL Injection Protection**: Uses parameterized queries through Entity Framework

## Performance Considerations

### Database Optimizations:
- Indexed search fields (VehicleCode, NumberPlate, VehicleId)
- Efficient joins with Include() statements
- Pagination to limit result sets

### Frontend Optimizations:
- Debounced search requests (300ms)
- Result limit for autocomplete (10 items)
- Proper cleanup of event listeners and timeouts

## Error Handling

### Backend Errors:
- System errors return proper HTTP status codes
- Validation errors include detailed error messages
- All errors are logged for debugging

### Frontend Errors:
- Network errors show user-friendly messages
- Invalid responses are handled gracefully
- Component state is properly reset on errors

## Usage Examples

### Basic Search:
```javascript
import { quickSearchVehicles } from '../../../redux/actions/vehicleSearchActions';

const result = await quickSearchVehicles('ABC123', 5);
if (result.success) {
  console.log('Found vehicles:', result.data);
}
```

### Advanced Search:
```javascript
import { advancedVehicleSearch } from '../../../redux/actions/vehicleSearchActions';

const criteria = {
  searchTerm: 'truck',
  vehicleType: 1,
  isActive: true,
  yearFrom: 2020
};

dispatch(advancedVehicleSearch(criteria));
```

### Integration in Components:
```javascript
<VehicleSearchBar
  placeholder="Search vehicles..."
  onSuggestionSelect={(vehicle) => {
    // Handle vehicle selection
    navigate(`/vehicles/${vehicle.vehicleId}/details`);
  }}
/>
```

## Future Enhancements

### Planned Features:
1. **Saved Searches**: Allow users to save frequently used search criteria
2. **Search History**: Track and suggest recent searches
3. **Export Results**: Export search results to CSV/Excel
4. **Advanced Filters UI**: Rich filter interface with dropdowns and date pickers
5. **Bulk Operations**: Perform actions on search results

### Performance Improvements:
1. **Search Index**: Implement full-text search indexing
2. **Client-side Caching**: Cache recent search results
3. **Infinite Scroll**: Load more results on demand
4. **Search Analytics**: Track search patterns for optimization

## Testing

### Backend Tests:
- Unit tests for SearchVehicleQuery handler
- Integration tests for API endpoints
- Performance tests for large datasets

### Frontend Tests:
- Component unit tests with React Testing Library
- User interaction tests
- Accessibility tests

## Troubleshooting

### Common Issues:
1. **"No results found"**: Check search criteria and vehicle data
2. **Slow search performance**: Review database indexes and query optimization
3. **Search not working**: Verify API endpoints and authentication
4. **UI issues**: Check console for JavaScript errors and network issues

### Debug Tools:
- Network tab in browser dev tools
- Application logs in backend
- Redux DevTools for state inspection
