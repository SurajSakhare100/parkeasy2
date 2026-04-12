const fs = require('fs');
const path = require('path');

const mappings = [
  { src: 'screens/UserHomeScreen.js', dest: 'app/(user)/user-home.js' },
  { src: 'screens/BookingScreen.js', dest: 'app/(user)/booking.js' },
  { src: 'screens/MyBookingsScreen.js', dest: 'app/(user)/my-bookings.js' },
  { src: 'screens/ParkingDetailsScreen.js', dest: 'app/(user)/parking-details.js' },
  { src: 'screens/PaymentScreen.js', dest: 'app/(user)/payment.js' },
  { src: 'screens/SavedParkingScreen.js', dest: 'app/(user)/saved.js' },
  { src: 'screens/SearchScreen.js', dest: 'app/(user)/search.js' },
  { src: 'screens/TicketScreen.js', dest: 'app/(user)/ticket.js' }
];

mappings.forEach(mapping => {
  const srcPath = path.join(__dirname, '..', mapping.src);
  const destPath = path.join(__dirname, '..', mapping.dest);
  
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf8');
    
    // Replace react-navigation with expo-router
    content = content.replace(/@react-navigation\/native/g, 'expo-router');
    content = content.replace(/useNavigation/g, 'useRouter');
    // Replace useRoute for params
    content = content.replace(/useRoute/g, 'useLocalSearchParams');
    content = content.replace(/const route = useLocalSearchParams\(\);/g, 'const params = useLocalSearchParams();');
    content = content.replace(/route\.params/g, 'params');
    
    content = content.replace(/navigation\.navigate\('([^']+)'(?:,\s*(.+))?\);/g, (match, screen, params) => {
      // Map screen names to expo-router paths
      const screenMap = {
        'Home': '/(user)',
        'UserHome': '/(user)/user-home',
        'Booking': '/(user)/booking',
        'Ticket': '/(user)/ticket',
        'Payment': '/(user)/payment',
        'ParkingDetails': '/(user)/parking-details',
        'Search': '/(user)/search',
        'Login': '/(auth)/login',
        'Register': '/(auth)/register'
      };
      const path = screenMap[screen] || `/${screen.toLowerCase()}`;
      if (params) {
        return `router.push({ pathname: '${path}', params: ${params} });`;
      }
      return `router.push('${path}');`;
    });
    
    // Fix goBack
    content = content.replace(/navigation\.goBack\(\)/g, "router.back()");
    
    // Replace const navigation = useRouter() with const router = useRouter()
    content = content.replace(/const navigation = useRouter\(\);/g, 'const router = useRouter();');
    
    // Replace navigation.reset
    content = content.replace(/navigation\.reset\([\s\S]*?\);/g, "router.replace('/(auth)/login');");
    
    // Update relative imports to be one level deeper since they are in app/(user)/
    content = content.replace(/from '\.\.\/theme'/g, "from '../../theme'");
    content = content.replace(/from '\.\.\/services/g, "from '../../services");
    content = content.replace(/from '\.\.\/components/g, "from '../../components");
    content = content.replace(/require\('\.\.\/assets/g, "require('../../assets");
    
    fs.writeFileSync(destPath, content);
    console.log(`Migrated ${mapping.src} to ${mapping.dest}`);
  }
});

// Create owner directory
if (!fs.existsSync(path.join(__dirname, '../app/(owner)'))) {
  fs.mkdirSync(path.join(__dirname, '../app/(owner)'));
}
fs.writeFileSync(path.join(__dirname, '../app/(owner)/_layout.js'), "import { Stack } from 'expo-router';\nexport default function OwnerLayout() { return <Stack />; }");

console.log("Migration script complete");
