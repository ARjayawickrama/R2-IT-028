# Features Directory - Professional Page Structure

This directory contains all the professional page components for the Maldive Fish Processing System. Each component is designed as a standalone, reusable page with modern React patterns and enterprise-grade UI/UX.

## 📁 Directory Structure

```
features/
├── index.js              # Clean exports for all components
├── README.md             # This documentation file
├── UploadPage.jsx        # File upload functionality
├── WebcamPage.jsx        # Live camera capture
├── ChartPage.jsx         # Analytics and charts
├── SensorPage.jsx        # Environmental monitoring
└── MechanicalPage.jsx    # Mechanical system controls
```

## 🎯 Page Components

### 📤 UploadPage.jsx
**Purpose**: Professional file upload interface with drag-and-drop support

**Features**:
- Drag & drop file upload
- File information display
- Multiple format support (JPG, PNG, GIF)
- File size validation (Max 10MB)
- Error handling and user feedback
- Professional hover effects and transitions

**Props**:
- `onFileSelect(file)` - Callback when file is selected
- `selectedFile` - Currently selected file object
- `onRemoveFile()` - Callback to remove selected file

### 📷 WebcamPage.jsx
**Purpose**: Live camera integration for real-time fish detection

**Features**:
- Live webcam feed
- Frame capture functionality
- Camera permission handling
- Real-time status indicators
- Device information display
- Professional camera controls

**Props**:
- `onCapture(file)` - Callback when frame is captured
- `webcamActive` - Boolean indicating camera status
- `onStartWebcam()` - Callback to start camera
- `onStopWebcam()` - Callback to stop camera

### 📊 ChartPage.jsx
**Purpose**: Comprehensive analytics and data visualization

**Features**:
- Real-time data updates
- Multiple chart types (Line, Bar, Pie, Doughnut)
- Tabbed interface (Overview, Trends, Distribution)
- Auto-refresh functionality
- AI-powered insights
- Performance metrics

**Dependencies**: `chart.js`, `react-chartjs-2`

### 🌡️ SensorPage.jsx
**Purpose**: Environmental monitoring and sensor data management

**Features**:
- Real-time sensor monitoring
- Multiple sensor types (Temperature, Humidity, pH, Oxygen, Salinity, Turbidity)
- System overview dashboard
- Alert management system
- Performance metrics
- Historical data tracking

### ⚙️ MechanicalPage.jsx
**Purpose**: Mechanical system control and monitoring

**Features**:
- Real-time system controls
- Performance monitoring
- Alert management
- System overview dashboard
- Control panels for each system
- Professional gradient design

## 🎨 Design System

All components follow a consistent design system:

### Colors
- Primary: `#0d6efd` (Blue)
- Success: `#198754` (Green)
- Warning: `#ffc107` (Yellow)
- Danger: `#dc3545` (Red)
- Secondary: `#6c757d` (Gray)

### Typography
- Font Family: IBM Plex Sans
- Weights: 300, 400, 500, 600
- Sizes: 12px, 14px, 16px, 18px, 24px, 32px

### Spacing
- Base unit: 8px
- Scale: 8px, 12px, 16px, 20px, 24px, 32px, 40px

### Borders & Shadows
- Border Radius: 6px, 8px, 12px
- Box Shadow: `0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1)`

## 🔄 State Management

Each component manages its own local state using React hooks:

```javascript
const [state, setState] = useState(initialValue);
const [autoRefresh, setAutoRefresh] = useState(true);
```

## 📡 Real-time Features

All analytics pages support real-time data updates:

- Auto-refresh functionality (configurable intervals)
- Live status indicators
- Real-time data simulation
- Performance monitoring

## 🎯 Best Practices

### Component Structure
- Single responsibility principle
- Clean separation of concerns
- Reusable components
- Proper prop validation

### Performance
- Efficient state management
- Proper cleanup in useEffect
- Optimized re-renders
- Memory leak prevention

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions
- Adaptive breakpoints

## 🚀 Usage Examples

### Basic Import
```javascript
import { UploadPage, ChartPage, SensorPage, MechanicalPage, WebcamPage } from './features';
```

### Component Usage
```javascript
<UploadPage 
  onFileSelect={handleFileSelect}
  selectedFile={selectedFile}
  onRemoveFile={handleRemoveFile}
/>
```

## 🔧 Development Notes

### Dependencies
- React 18+
- Chart.js (for ChartPage)
- Modern CSS features
- ES6+ JavaScript

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Testing
- Each component is self-contained
- Mock data for development
- Error boundaries implemented
- Performance optimized

## 📈 Future Enhancements

- Additional chart types
- Advanced filtering options
- Export functionality
- Data persistence
- Advanced analytics
- Mobile app integration

---

**Note**: This directory represents a professional, enterprise-grade approach to React component architecture with modern best practices and scalable design patterns.
