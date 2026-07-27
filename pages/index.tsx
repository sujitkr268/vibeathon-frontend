import React, { useState, useRef, Suspense, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);
const OrbitControls = dynamic(
  () => import('@react-three/drei').then((mod) => mod.OrbitControls),
  { ssr: false }
);

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  description: string;
  image: string;
};

type Order = {
  id: number;
  tableNumber: number;
  items: { menuItemId: number; name: string; quantity: number; price: number }[];
  status: 'pending' | 'preparing' | 'served';
  total: number;
  timestamp: string;
};

type Reservation = {
  id: number;
  name: string;
  time: string;
  guests: number;
};

type QueueEntry = {
  id: number;
  name: string;
  guests: number;
  position: number;
};

type InventoryItem = {
  id: number;
  name: string;
  stock: number;
  unit: string;
  threshold: number;
};

type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
};

const initialMenuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Truffle Tikka',
    price: 24,
    category: 'Starters',
    isAvailable: true,
    description: 'Charcoal-grilled chicken tikka infused with black truffle oil, served with saffron mint chutney.',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  },
  {
    id: 2,
    name: 'Makhani Lamb',
    price: 38,
    category: 'Mains',
    isAvailable: true,
    description: 'Slow-braised lamb shank in rich tomato-butter gravy, finished with smoked fenugreek leaves.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  },
  {
    id: 3,
    name: 'Saffron Risotto',
    price: 28,
    category: 'Mains',
    isAvailable: true,
    description: 'Carnaroli rice cooked in Kashmir saffron broth with aged Parmesan and roasted cashew crumble.',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
  },
  {
    id: 4,
    name: 'Gulab Jamun Cheesecake',
    price: 16,
    category: 'Desserts',
    isAvailable: false,
    description: 'New York-style cheesecake with gulab jamun compote, cardamom foam, and pistachio brittle.',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80',
  },
  {
    id: 5,
    name: 'Mango Lassi',
    price: 9,
    category: 'Drinks',
    isAvailable: true,
    description: 'Alphonso mango blended with Greek yogurt, a hint of cardamom, and topped with saffron strands.',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80',
  },
];

const initialOrders: Order[] = [
  {
    id: 101,
    tableNumber: 7,
    items: [
      { menuItemId: 1, name: 'Truffle Tikka', quantity: 2, price: 24 },
      { menuItemId: 5, name: 'Mango Lassi', quantity: 2, price: 9 },
    ],
    status: 'pending',
    total: 66,
    timestamp: '7:12 PM',
  },
  {
    id: 102,
    tableNumber: 12,
    items: [
      { menuItemId: 2, name: 'Makhani Lamb', quantity: 1, price: 38 },
      { menuItemId: 3, name: 'Saffron Risotto', quantity: 1, price: 28 },
    ],
    status: 'preparing',
    total: 66,
    timestamp: '7:05 PM',
  },
  {
    id: 103,
    tableNumber: 3,
    items: [
      { menuItemId: 3, name: 'Saffron Risotto', quantity: 2, price: 28 },
    ],
    status: 'served',
    total: 56,
    timestamp: '6:45 PM',
  },
];

const initialReservations: Reservation[] = [
  { id: 1, name: 'Aarav Sharma', time: '8:00 PM', guests: 4 },
  { id: 2, name: 'Priya Patel', time: '8:30 PM', guests: 2 },
];

const initialQueue: QueueEntry[] = [
  { id: 1, name: 'Rahul Mehta', guests: 3, position: 1 },
  { id: 2, name: 'Ananya Singh', guests: 5, position: 2 },
  { id: 3, name: 'Kabir Joshi', guests: 2, position: 3 },
];

const initialInventory: InventoryItem[] = [
  { id: 1, name: 'Kashmir Saffron', stock: 45, unit: 'g', threshold: 20 },
  { id: 2, name: 'Black Truffle Oil', stock: 12, unit: 'bottles', threshold: 8 },
  { id: 3, name: 'Lamb Shank', stock: 8, unit: 'pieces', threshold: 10 },
  { id: 4, name: 'Alphonso Mango', stock: 24, unit: 'pieces', threshold: 15 },
  { id: 5, name: 'Carnaroli Rice', stock: 6, unit: 'kg', threshold: 5 },
];

const dailySalesData = [
  { day: 'Mon', sales: 2400 },
  { day: 'Tue', sales: 3100 },
  { day: 'Wed', sales: 2800 },
  { day: 'Thu', sales: 4200 },
  { day: 'Fri', sales: 5800 },
  { day: 'Sat', sales: 6400 },
  { day: 'Sun', sales: 5200 },
];

const categoryData = [
  { name: 'Starters', value: 25, color: '#D4AF37' },
  { name: 'Mains', value: 45, color: '#D4881C' },
  { name: 'Desserts', value: 18, color: '#C97D5B' },
  { name: 'Drinks', value: 12, color: '#6B7F5E' },
];

const staffOnDuty = [
  { id: 1, name: 'Rajesh Kumar', role: 'Head Chef', status: 'On Duty' },
  { id: 2, name: 'Sita Devi', role: 'Sous Chef', status: 'On Duty' },
  { id: 3, name: 'Amir Khan', role: 'Senior Waiter', status: 'On Duty' },
  { id: 4, name: 'Neha Kapoor', role: 'Bartender', status: 'On Duty' },
];

const customerHistory = [
  { id: 1, name: 'Vikram Rao', visits: 12, lastVisit: '2 days ago', totalSpent: 1450 },
  { id: 2, name: 'Ishita Verma', visits: 8, lastVisit: '1 week ago', totalSpent: 920 },
  { id: 3, name: 'Arjun Malhotra', visits: 15, lastVisit: 'Yesterday', totalSpent: 2100 },
];

function LotusScene({ hovered, setHovered }: { hovered: boolean; setHovered: (v: boolean) => void }) {
  const meshRef = useRef<any>(null);
  return (
    <group>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#D4AF37" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#C97D5B" />
      <mesh
        ref={meshRef}
        scale={hovered ? 1.3 : 1}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <torusKnotGeometry args={[1, 0.35, 128, 32]} />
        <meshStandardMaterial
          color={hovered ? '#D4AF37' : '#C97D5B'}
          metalness={0.95}
          roughness={0.15}
          emissive={hovered ? '#D4881C' : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
    </group>
  );
}

type View = 'customer' | 'kitchen' | 'manager';

const AUTHORIZED_STAFF_EMAILS = [
  'manager@vibeathon.com',
  'chef@vibeathon.com',
  'waiter@vibeathon.com', // <-- Put YOUR email here!
]

export default function HomePage() {
  const [view, setView] = useState<View>('customer');
  const [role, setRole] = useState<'customer' | 'staff'>('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Fetch menu from Supabase
  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) console.error("Error fetching menu:", error);
      else if (data) setMenuItems(data as MenuItem[]);
    };
    fetchMenu();
  }, []);

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [queue] = useState<QueueEntry[]>(initialQueue);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [managerTab, setManagerTab] = useState<'orders' | 'inventory' | 'staff' | 'analytics' | 'ai'>('orders');
  const [notifications, setNotifications] = useState<string[]>(['Your order is preparing!']);
  const [notifOpen, setNotifOpen] = useState(false);
  const [threeHovered, setThreeHovered] = useState(false);
  const [reservationForm, setReservationForm] = useState({ name: '', time: '', guests: 2 });
  const [hasBookedTable, setHasBookedTable] = useState(false);
  const [reserveMsg, setReserveMsg] = useState('');
  const [orderMsg, setOrderMsg] = useState('');
  const [bookingToast, setBookingToast] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category)))];
  const filteredMenu = categoryFilter === 'All'
    ? menuItems
    : menuItems.filter((m) => m.category === categoryFilter);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const placeOrder = () => {
    if (cart.length === 0) return;
    const newOrder: Order = {
      id: Date.now(),
      tableNumber: Math.floor(Math.random() * 15) + 1,
      items: cart.map((c) => ({
        menuItemId: c.menuItemId,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
      })),
      status: 'pending',
      total: cartTotal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setOrders((prev) => [...prev, newOrder]);
    setCart([]);
    setCartOpen(false);
    setNotifications((prev) => [`Order #${newOrder.id} placed successfully!`, ...prev].slice(0, 5));
    setOrderMsg('Order placed! Check the kitchen for status.');
    setTimeout(() => setOrderMsg(''), 4000);
  };

  const updateOrderStatus = (orderId: number, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (newStatus === 'preparing') {
      setNotifications((prev) => [`Order #${orderId} is now preparing!`, ...prev].slice(0, 5));
    } else if (newStatus === 'served') {
      setNotifications((prev) => [`Order #${orderId} has been served!`, ...prev].slice(0, 5));
    }
  };

  const toggleAvailability = (menuItemId: number) => {
    setMenuItems((prev) =>
      prev.map((m) => (m.id === menuItemId ? { ...m, isAvailable: !m.isAvailable } : m))
    );
  };

  const submitReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationForm.name || !reservationForm.time) return;
    const newRes: Reservation = {
      id: Date.now(),
      name: reservationForm.name,
      time: reservationForm.time,
      guests: reservationForm.guests,
    };
    setReservations((prev) => [...prev, newRes]);
    setReservationForm({ name: '', time: '', guests: 2 });
    setHasBookedTable(true);
    setReserveMsg(`Table booked for ${newRes.name} at ${newRes.time}!`);
    setBookingToast(true);
    setTimeout(() => setReserveMsg(''), 4000);
    setTimeout(() => setBookingToast(false), 3000);
  };

  const statusStyles = {
    pending: 'bg-antiqueBronze text-warmwhite',
    preparing: 'bg-deepSaffron text-charcoal',
    served: 'bg-oliveGreen text-warmwhite',
  };

  const statusNext: Record<Order['status'], Order['status'] | null> = {
    pending: 'preparing',
    preparing: 'served',
    served: null,
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handler = () => setNotifOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [notifOpen]);

  return (
    <div className="min-h-screen bg-charcoal text-warmwhite font-inter relative">
      {/* Royal Gold Booking Toast */}
      {bookingToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-luxury-lg bg-gradient-to-r from-royalGold via-deepSaffron to-royalGold text-charcoal font-semibold shadow-luxury-lg border-2 border-royalGold animate-[slideIn_0.3s_ease]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <span className="font-playfair text-lg">
              Table Booked Successfully!
            </span>
            <span className="text-2xl">✓</span>
          </div>
        </div>
      )}
      {/* Three.js Hero */}
      <div className="relative w-full h-32 md:h-40 overflow-hidden bg-gradient-to-b from-darkWalnut via-charcoal to-charcoal">
        <div className="absolute inset-0">
          <Suspense fallback={<div className="w-full h-full" />}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <LotusScene hovered={threeHovered} setHovered={setThreeHovered} />
            </Canvas>
          </Suspense>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-royalGold text-sm tracking-[0.4em] uppercase mb-1">
            Welcome to
          </p>
          <h1
            className="font-playfair text-2xl md:text-3xl text-warmwhite drop-shadow-lg"
            style={{ textShadow: '0 2px 12px rgba(212,175,55,0.4)' }}
          >
            Vibeathon Restro
          </h1>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-charcoal/95 backdrop-blur-md border-b border-softBeige/10 shadow-luxury">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royalGold to-terracotta flex items-center justify-center">
              <span className="font-playfair text-charcoal font-bold text-lg">
                V
              </span>
            </div>
            <span className="font-playfair text-xl md:text-2xl text-royalGold hidden sm:block">
              Vibeathon Restro
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {(role === 'staff'
              ? (['customer', 'kitchen', 'manager'] as View[])
              : (['customer'] as View[])
            ).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-luxury text-sm font-medium capitalize transition-all duration-300 ${
                  view === v
                    ? 'bg-gradient-to-r from-royalGold to-deepSaffron text-charcoal shadow-luxury-lg scale-105'
                    : 'bg-smokyGray/40 text-warmwhite hover:bg-smokyGray/70 hover:text-royalGold border border-softBeige/10'
                }`}
              >
                {v === 'customer' ? 'Customer Portal' : v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {/* Role Selector */}
            <div className="relative">
              <select
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as 'customer' | 'staff'
                  setRole(newRole)
                  if (newRole === 'customer') setView('customer')
                }}
                className="appearance-none px-4 py-2 pr-10 rounded-luxury text-sm font-semibold bg-darkWalnut text-warmwhite bg-darkWalnut cursor-pointer focus:outline-none border-2 border-royalGold focus:border-royalGold transition-all"
                style={{
                  backgroundColor: '#3E2723',
                  color: '#F5F0EB',
                  border: '1px solid #D4AF37',
                }}
              >
                <option
                  value="customer"
                  style={{ backgroundColor: '#3E2723', color: '#F5F0EB' }}
                >
                  👤 Customer
                </option>
                {/* Only show Staff option if they are logged in AND authorized */}
                {isLoggedIn &&
                  currentUserEmail &&
                  AUTHORIZED_STAFF_EMAILS.includes(currentUserEmail) && (
                    <option
                      value="staff"
                      style={{ backgroundColor: '#3E2723', color: '#F5F0EB' }}
                    >
                      👨‍🍳 Staff
                    </option>
                  )}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-royalGold text-xs">
                ▼
              </span>
            </div>
            {view === 'customer' && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setNotifOpen((o) => !o)
                  }}
                  className="relative w-10 h-10 rounded-full bg-smokyGray/40 hover:bg-smokyGray/70 flex items-center justify-center border border-softBeige/10 transition-all"
                >
                  🔔
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-terracotta text-warmwhite rounded-full text-xs flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 border-2 rounded-luxury shadow-luxury-lg overflow-hidden z-50"
                    style={{
                      backgroundColor: '#3E2723',
                      borderColor: '#E6D5C3',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="p-3 bg-smokyGray/60 border-b"
                      style={{ borderBottomColor: 'rgba(230, 213, 195, 0.15)' }}
                    >
                      <p className="font-playfair text-royalGold">
                        Notifications
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <div
                          key={i}
                          className="p-3 border-b text-sm hover:bg-smokyGray/30"
                          style={{
                            borderBottomColor: 'rgba(230, 213, 195, 0.15)',
                            color: '#F5F0EB',
                          }}
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setCartOpen(true)}
                  className="ml-2 relative w-10 h-10 rounded-full bg-gradient-to-br from-royalGold to-deepSaffron text-charcoal flex items-center justify-center hover:scale-110 transition-transform"
                >
                  🛒
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-terracotta text-warmwhite rounded-full text-xs flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            )}
            <button
              onClick={async () => {
                if (isLoggedIn) {
                  // If already logged in, clicking it logs them out
                  await supabase.auth.signOut()
                  setIsLoggedIn(false)
                  setCurrentUserEmail(null)
                  setRole('customer')
                  setView('customer')
                  return
                }

                const email = prompt('Enter your email to login:')
                const password = prompt(
                  'Enter a password (at least 6 characters):',
                )

                if (email && password) {
                  // Try to sign in first
                  const { data: signInData, error: signInError } =
                    await supabase.auth.signInWithPassword({
                      email: email,
                      password: password,
                    })

                  if (signInError) {
                    // If they don't exist, sign them up
                    const { data: signUpData, error: signUpError } =
                      await supabase.auth.signUp({
                        email: email,
                        password: password,
                      })

                    if (signUpError) {
                      alert(signUpError.message)
                      return
                    } else {
                      setIsLoggedIn(true)
                      setCurrentUserEmail(email)
                      // Check if they are staff
                      if (AUTHORIZED_STAFF_EMAILS.includes(email)) {
                        setRole('staff')
                        setView('manager')
                      } else {
                        setRole('customer')
                        setView('customer')
                      }
                    }
                  } else {
                    // They signed in successfully
                    setIsLoggedIn(true)
                    setCurrentUserEmail(email)
                    // Check if they are staff
                    if (AUTHORIZED_STAFF_EMAILS.includes(email)) {
                      setRole('staff')
                      setView('manager')
                    } else {
                      setRole('customer')
                      setView('customer')
                    }
                  }
                }
              }}
              className={`px-4 py-2 rounded-luxury text-sm font-semibold transition-all duration-300 ${
                isLoggedIn
                  ? 'bg-oliveGreen text-warmwhite hover:bg-oliveGreen/80'
                  : 'bg-gradient-to-r from-royalGold to-deepSaffron text-charcoal hover:shadow-luxury-lg hover:scale-105'
              }`}
            >
              {isLoggedIn ? '✓ Logged In' : 'Login'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {orderMsg && (
          <div className="mb-6 p-4 rounded-luxury bg-oliveGreen/20 border border-oliveGreen text-warmwhite">
            {orderMsg}
          </div>
        )}

        {/* CUSTOMER VIEW */}
        {view === 'customer' && (
          <div className="space-y-12">
            {/* Digital Menu */}
            <section>
              <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="font-playfair text-3xl md:text-4xl text-royalGold mb-2">
                    The Menu
                  </h2>
                  <p className="text-softBeige/70 text-sm">
                    A curated journey of modern Indian luxury
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        categoryFilter === cat
                          ? 'bg-royalGold text-charcoal'
                          : 'bg-smokyGray/50 text-softBeige hover:bg-smokyGray/80 border border-softBeige/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              {/* Ordering Locked Banner */}
              {!hasBookedTable && (
                <div className="mb-8 p-6 rounded-luxury-lg bg-gradient-to-r from-deepSaffron/25 via-darkWalnut/80 to-antiqueBronze/25 border-2 border-deepSaffron/60 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-deepSaffron/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative flex items-center gap-4 flex-wrap">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-deepSaffron via-royalGold to-terracotta flex items-center justify-center text-charcoal text-3xl shadow-luxury-lg flex-shrink-0">
                      📅
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-playfair text-xl md:text-2xl text-royalGold mb-1">
                        Please book a table first to start ordering.
                      </h3>
                      <p className="text-warmwhite text-sm">
                        Once you confirm your reservation below, the order
                        buttons will unlock instantly.
                      </p>
                    </div>
                    <div className="px-4 py-2 rounded-luxury bg-deepSaffron text-charcoal font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                      🔒 Ordering Locked
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenu.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative bg-gradient-to-br from-darkWalnut to-smokyGray/60 rounded-luxury-lg overflow-hidden border border-softBeige/10 shadow-luxury hover:shadow-luxury-lg transition-all duration-500 hover:-translate-y-1 ${
                      !item.isAvailable || !hasBookedTable ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-darkWalnut via-transparent to-transparent" />
                      {!item.isAvailable && (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-antiqueBronze text-warmwhite text-xs font-bold uppercase tracking-wider">
                          86&apos;d
                        </div>
                      )}
                      {!hasBookedTable && item.isAvailable && (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-charcoal/90 backdrop-blur-sm text-softBeige text-xs font-semibold uppercase tracking-wider border border-deepSaffron/60">
                          🔒 Need Table
                        </div>
                      )}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-charcoal/80 backdrop-blur-sm text-royalGold text-xs font-semibold border border-royalGold/30">
                        {item.category}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-playfair text-xl text-warmwhite">
                          {item.name}
                        </h3>
                        <span className="font-playfair text-xl text-royalGold">
                          ${item.price}
                        </span>
                      </div>
                      <p className="text-softBeige/60 text-sm leading-relaxed mb-4 min-h-[60px]">
                        {item.description}
                      </p>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.isAvailable || !hasBookedTable}
                        className={`w-full py-3 rounded-luxury font-semibold text-sm transition-all duration-300 ${
                          item.isAvailable && hasBookedTable
                            ? 'bg-gradient-to-r from-royalGold to-deepSaffron text-charcoal hover:shadow-luxury-lg hover:scale-[1.02]'
                            : 'bg-smokyGray/50 text-antiqueBronze cursor-not-allowed border border-antiqueBronze/30'
                        }`}
                      >
                        {!hasBookedTable
                          ? '🔒 Book Table First'
                          : item.isAvailable
                            ? 'Add to Cart'
                            : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reservations + Queue */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Smart Reservations */}
              <div className="bg-gradient-to-br from-darkWalnut/80 to-smokyGray/40 rounded-luxury-lg p-6 md:p-8 border border-softBeige/10 shadow-luxury">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-royalGold to-deepSaffron flex items-center justify-center text-charcoal text-xl">
                    📅
                  </div>
                  <div>
                    <h3 className="font-playfair text-2xl text-royalGold">
                      Book a Table
                    </h3>
                    <p className="text-softBeige/60 text-xs">
                      Reserve your luxury experience
                    </p>
                  </div>
                </div>
                <form onSubmit={submitReservation} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-warmwhite mb-2 font-semibold">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={reservationForm.name}
                      onChange={(e) =>
                        setReservationForm({
                          ...reservationForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Aisha Khan"
                      className="w-full px-4 py-3 rounded-luxury bg-charcoal/60 border border-softBeige/30 text-warmwhite focus:border-royalGold focus:outline-none transition-colors placeholder-softBeige"
                      style={{ color: '#F5F0EB' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-warmwhite mb-2 font-semibold">
                      Time
                    </label>
                    <input
                      type="time"
                      value={reservationForm.time}
                      onChange={(e) =>
                        setReservationForm({
                          ...reservationForm,
                          time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-luxury bg-charcoal/60 border border-softBeige/30 text-warmwhite focus:border-royalGold focus:outline-none transition-colors"
                      style={{ color: '#F5F0EB', colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-warmwhite mb-2 font-semibold">
                      Guests: {reservationForm.guests}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={reservationForm.guests}
                      onChange={(e) =>
                        setReservationForm({
                          ...reservationForm,
                          guests: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-royalGold"
                    />
                  </div>
                  {reserveMsg && (
                    <div className="p-3 rounded-luxury bg-oliveGreen/20 border border-oliveGreen text-warmwhite text-sm">
                      {reserveMsg}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-luxury font-semibold bg-gradient-to-r from-royalGold via-deepSaffron to-terracotta text-charcoal hover:shadow-luxury-lg hover:scale-[1.01] transition-all duration-300"
                  >
                    Confirm Reservation
                  </button>
                </form>
              </div>

              {/* Queue Status */}
              <div className="bg-gradient-to-br from-smokyGray/40 to-darkWalnut/80 rounded-luxury-lg p-6 md:p-8 border border-softBeige/10 shadow-luxury">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta to-deepSaffron flex items-center justify-center text-warmwhite text-xl">
                    📊
                  </div>
                  <div>
                    <h3 className="font-playfair text-2xl text-royalGold">
                      Live Queue
                    </h3>
                    <p className="text-softBeige/60 text-xs">
                      Current waiting status
                    </p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {queue.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-4 rounded-luxury transition-all ${
                        idx === 0
                          ? 'bg-royalGold/15 border border-royalGold/40'
                          : 'bg-charcoal/40 border border-softBeige/10'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          idx === 0
                            ? 'bg-royalGold text-charcoal'
                            : 'bg-smokyGray text-warmwhite'
                        }`}
                      >
                        {entry.position}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-warmwhite">
                          {entry.name}
                        </p>
                        <p className="text-xs text-softBeige/60">
                          {entry.guests} guests
                        </p>
                      </div>
                      {idx === 0 && (
                        <span className="text-xs px-3 py-1 rounded-full bg-royalGold text-charcoal font-semibold animate-pulse">
                          Next Up
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-luxury bg-charcoal/40 border border-dashed border-softBeige/20 text-center">
                  <p className="text-xs uppercase tracking-wider text-softBeige/60 mb-1">
                    Your Position
                  </p>
                  <p className="font-playfair text-4xl text-royalGold">#4</p>
                  <p className="text-xs text-softBeige/60 mt-1">~20 min wait</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* KITCHEN VIEW */}
        {view === 'kitchen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Management */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-deepSaffron to-terracotta flex items-center justify-center text-warmwhite text-xl">
                  🍳
                </div>
                <div>
                  <h2 className="font-playfair text-3xl text-royalGold">
                    Kitchen Display
                  </h2>
                  <p className="text-softBeige/60 text-sm">
                    Manage orders in real-time
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-gradient-to-br from-darkWalnut to-smokyGray/70 rounded-luxury-lg p-5 border shadow-luxury transition-all ${
                      order.status === 'pending'
                        ? 'border-antiqueBronze/60'
                        : order.status === 'preparing'
                          ? 'border-deepSaffron/60'
                          : 'border-oliveGreen/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-playfair text-2xl text-warmwhite">
                          Table {order.tableNumber}
                        </p>
                        <p className="text-xs text-softBeige/50">
                          #{order.id} · {order.timestamp}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-2 mb-5 border-y border-softBeige/10 py-3">
                      {order.items.map((it, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-warmwhite">
                            <span className="text-royalGold font-bold mr-2">
                              ×{it.quantity}
                            </span>
                            {it.name}
                          </span>
                          <span className="text-softBeige/60">
                            ${it.price * it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs uppercase tracking-wider text-softBeige/60">
                        Total
                      </span>
                      <span className="font-playfair text-xl text-royalGold">
                        ${order.total}
                      </span>
                    </div>
                    {statusNext[order.status] ? (
                      <button
                        onClick={() =>
                          updateOrderStatus(order.id, statusNext[order.status]!)
                        }
                        className="w-full py-3 rounded-luxury font-semibold text-sm capitalize bg-gradient-to-r from-royalGold to-deepSaffron text-charcoal hover:shadow-luxury-lg transition-all"
                      >
                        Mark as {statusNext[order.status]}
                      </button>
                    ) : (
                      <div className="w-full py-3 rounded-luxury text-center text-sm bg-oliveGreen/20 text-oliveGreen border border-oliveGreen/30 font-semibold">
                        ✓ Completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Sidebar */}
            <aside className="bg-gradient-to-br from-darkWalnut/80 to-smokyGray/50 rounded-luxury-lg p-5 border border-softBeige/10 shadow-luxury h-fit sticky top-28">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royalGold to-deepSaffron flex items-center justify-center text-charcoal text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="font-playfair text-xl text-royalGold">
                    Live Availability
                  </h3>
                  <p className="text-softBeige/60 text-xs">
                    Toggle menu items instantly
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-luxury bg-charcoal/40 border border-softBeige/10 hover:border-royalGold/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-warmwhite text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p
                        className={`text-xs ${item.isAvailable ? 'text-oliveGreen' : 'text-antiqueBronze'}`}
                      >
                        {item.isAvailable ? '● Available' : "● 86'd"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-all duration-300 ${
                        item.isAvailable ? 'bg-royalGold' : 'bg-antiqueBronze'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-warmwhite rounded-full transition-all duration-300 ${
                          item.isAvailable ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {/* MANAGER VIEW */}
        {view === 'manager' && (
          <div>
            {!isLoggedIn ? (
              <div className="max-w-lg mx-auto text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-antiqueBronze to-smokyGray flex items-center justify-center text-5xl">
                  🔒
                </div>
                <h2 className="font-playfair text-3xl text-royalGold mb-3">
                  Manager Access Required
                </h2>
                <p className="text-softBeige/70 mb-8">
                  Please login using the button above to access the Manager
                  Dashboard.
                </p>
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="px-8 py-3.5 rounded-luxury font-semibold bg-gradient-to-r from-royalGold to-deepSaffron text-charcoal hover:shadow-luxury-lg hover:scale-105 transition-all duration-300"
                >
                  Login with Google
                </button>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="mb-8 overflow-x-auto border-b border-softBeige/10">
                  <div className="flex gap-2 min-w-max pb-2">
                    {(
                      [
                        { key: 'orders', label: '📋 Orders', gold: false },
                        {
                          key: 'inventory',
                          label: '📦 Inventory',
                          gold: false,
                        },
                        { key: 'staff', label: '👥 Staff', gold: false },
                        {
                          key: 'analytics',
                          label: '📊 Analytics',
                          gold: false,
                        },
                        { key: 'ai', label: '🤖 AI Insights', gold: true },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setManagerTab(tab.key)}
                        className={`px-5 py-3 rounded-luxury text-sm font-semibold transition-all whitespace-nowrap ${
                          managerTab === tab.key
                            ? tab.gold
                              ? 'bg-deepSaffron text-charcoal shadow-lg'
                              : 'bg-gradient-to-r from-royalGold to-deepSaffron text-charcoal shadow-luxury'
                            : tab.gold
                              ? 'bg-darkWalnut/60 text-deepSaffron border border-deepSaffron/40 hover:bg-deepSaffron/20'
                              : 'bg-smokyGray/40 text-softBeige hover:bg-smokyGray/70 border border-softBeige/10'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders/Tables Tab */}
                {managerTab === 'orders' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-playfair text-2xl text-royalGold mb-5">
                        Live Orders
                      </h3>
                      <div className="space-y-3">
                        {orders.map((o) => (
                          <div
                            key={o.id}
                            className="p-4 rounded-luxury bg-darkWalnut/60 border border-softBeige/10 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-warmwhite">
                                Table {o.tableNumber} · #{o.id}
                              </p>
                              <p className="text-xs text-softBeige/60">
                                {o.items.length} items · {o.timestamp}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-playfair text-lg text-royalGold">
                                ${o.total}
                              </p>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full uppercase font-semibold ${statusStyles[o.status]}`}
                              >
                                {o.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-playfair text-2xl text-royalGold mb-5">
                        Reservations
                      </h3>
                      <div className="space-y-3">
                        {reservations.map((r) => (
                          <div
                            key={r.id}
                            className="p-4 rounded-luxury bg-gradient-to-r from-darkWalnut/60 to-smokyGray/40 border border-softBeige/10 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-royalGold/30 to-terracotta/30 flex items-center justify-center font-playfair text-xl text-royalGold border border-royalGold/30">
                                {r.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-warmwhite">
                                  {r.name}
                                </p>
                                <p className="text-xs text-softBeige/60">
                                  {r.guests} guests
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-playfair text-lg text-royalGold">
                                {r.time}
                              </p>
                              <p className="text-xs text-oliveGreen">
                                ✓ Confirmed
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Inventory Tab */}
                {managerTab === 'inventory' && (
                  <div>
                    <h3 className="font-playfair text-2xl text-royalGold mb-5">
                      Inventory Stock
                    </h3>
                    <div className="bg-darkWalnut/60 rounded-luxury-lg overflow-hidden border border-softBeige/10">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-smokyGray/70 border-b border-softBeige/15">
                            <tr>
                              <th className="text-left px-6 py-4 text-sm uppercase tracking-wider text-royalGold font-semibold">
                                Ingredient
                              </th>
                              <th className="text-left px-6 py-4 text-sm uppercase tracking-wider text-royalGold font-semibold">
                                Stock
                              </th>
                              <th className="text-left px-6 py-4 text-sm uppercase tracking-wider text-royalGold font-semibold">
                                Threshold
                              </th>
                              <th className="text-left px-6 py-4 text-sm uppercase tracking-wider text-royalGold font-semibold">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventory.map((inv, i) => {
                              const low = inv.stock <= inv.threshold
                              return (
                                <tr
                                  key={inv.id}
                                  className={`border-b border-softBeige/5 ${i % 2 ? 'bg-charcoal/20' : ''}`}
                                >
                                  <td className="px-6 py-4 text-warmwhite font-medium">
                                    {inv.name}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`font-playfair text-lg ${low ? 'text-terracotta' : 'text-royalGold'}`}
                                    >
                                      {inv.stock} {inv.unit}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-softBeige/70 text-sm">
                                    {inv.threshold} {inv.unit}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        low
                                          ? 'bg-terracotta/20 text-terracotta border border-terracotta/40'
                                          : 'bg-oliveGreen/20 text-oliveGreen border border-oliveGreen/40'
                                      }`}
                                    >
                                      {low ? '⚠ Reorder Soon' : '✓ Healthy'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staff/Customers Tab */}
                {managerTab === 'staff' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-playfair text-2xl text-royalGold mb-5">
                        Staff on Duty
                      </h3>
                      <div className="space-y-3">
                        {staffOnDuty.map((s) => (
                          <div
                            key={s.id}
                            className="p-4 rounded-luxury bg-darkWalnut/60 border border-softBeige/10 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-smokyGray to-charcoal flex items-center justify-center font-playfair text-xl text-royalGold border border-royalGold/30">
                                {s.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </div>
                              <div>
                                <p className="font-medium text-warmwhite">
                                  {s.name}
                                </p>
                                <p className="text-xs text-softBeige/60">
                                  {s.role}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-oliveGreen/20 text-oliveGreen border border-oliveGreen/40 font-semibold">
                              ● {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-playfair text-2xl text-royalGold mb-5">
                        VIP Customer History
                      </h3>
                      <div className="space-y-3">
                        {customerHistory.map((c) => (
                          <div
                            key={c.id}
                            className="p-4 rounded-luxury bg-gradient-to-r from-darkWalnut/60 to-smokyGray/40 border border-royalGold/15"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-warmwhite">
                                {c.name}
                              </p>
                              <span className="font-playfair text-royalGold">
                                ${c.totalSpent}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-softBeige/60">
                              <span>🔥 {c.visits} visits</span>
                              <span>Last: {c.lastVisit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {managerTab === 'analytics' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-darkWalnut/60 rounded-luxury-lg p-6 border border-softBeige/10 shadow-luxury">
                      <h3 className="font-playfair text-xl text-royalGold mb-6">
                        Daily Sales ($)
                      </h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailySalesData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#4A4A4A"
                            />
                            <XAxis
                              dataKey="day"
                              stroke="#E6D5C3"
                              fontSize={12}
                            />
                            <YAxis stroke="#E6D5C3" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#3E2723',
                                border: '1px solid #D4AF37',
                                borderRadius: '12px',
                                color: '#F5F0EB',
                              }}
                              cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
                            />
                            <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                              {dailySalesData.map((_, idx) => (
                                <Cell
                                  key={idx}
                                  fill={idx % 2 === 0 ? '#D4AF37' : '#C97D5B'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-darkWalnut/60 rounded-luxury-lg p-6 border border-softBeige/10 shadow-luxury">
                      <h3 className="font-playfair text-xl text-royalGold mb-6">
                        Popular Categories
                      </h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="#1A1A1A"
                              strokeWidth={2}
                            >
                              {categoryData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#3E2723',
                                border: '1px solid #D4AF37',
                                borderRadius: '12px',
                                color: '#F5F0EB',
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                color: '#F5F0EB',
                                fontSize: '12px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Insights Tab */}
                {managerTab === 'ai' && (
                  <div>
                    <div className="bg-darkWalnut/40 rounded-luxury-lg p-8 border-2 border-deepSaffron/60 glow-border shadow-luxury-lg relative overflow-hidden">
                      <div className="absolute -top-20 -right-20 w-64 h-64 bg-deepSaffron/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-royalGold/15 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-deepSaffron via-royalGold to-terracotta flex items-center justify-center text-charcoal text-2xl shadow-lg">
                            🤖
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-playfair text-2xl text-royalGold">
                                AI Insights · Platinum Tier
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-full bg-deepSaffron text-charcoal text-xs font-bold uppercase tracking-wider">
                                Pro
                              </span>
                            </div>
                            <p className="text-softBeige/70 text-sm">
                              Powered by VibeAI Engine v3.0
                            </p>
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div className="p-5 rounded-luxury bg-charcoal/60 border border-deepSaffron/30 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-deepSaffron text-lg">
                                📈
                              </span>
                              <h4 className="font-playfair text-lg text-warmwhite">
                                Demand Forecast
                              </h4>
                            </div>
                            <p className="text-softBeige/80 leading-relaxed">
                              <strong className="text-terracotta">
                                Saffron Risotto
                              </strong>{' '}
                              stock is depleting fast. Based on weekend trends,{' '}
                              <strong className="text-royalGold">
                                86 incidents
                              </strong>{' '}
                              will occur by{' '}
                              <strong className="text-royalGold">8 PM</strong>.
                              Recommend{' '}
                              <span className="bg-oliveGreen/30 px-2 py-0.5 rounded text-oliveGreen border border-oliveGreen/40">
                                increasing prep by 30%
                              </span>
                              .
                            </p>
                          </div>
                          <div className="p-5 rounded-luxury bg-charcoal/60 border border-royalGold/30 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-royalGold text-lg">💡</span>
                              <h4 className="font-playfair text-lg text-warmwhite">
                                Personalized Recommendation
                              </h4>
                            </div>
                            <p className="text-softBeige/80 leading-relaxed">
                              Customers who order{' '}
                              <strong className="text-terracotta">
                                Makhani Lamb
                              </strong>{' '}
                              have a{' '}
                              <strong className="text-royalGold text-xl">
                                80%
                              </strong>{' '}
                              chance of ordering{' '}
                              <strong className="text-terracotta">
                                Mango Lassi
                              </strong>
                              . Suggest{' '}
                              <span className="bg-deepSaffron/30 px-2 py-0.5 rounded text-deepSaffron border border-deepSaffron/40">
                                bundling them
                              </span>{' '}
                              to increase average order value by an estimated
                              18%.
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="p-4 rounded-luxury bg-gradient-to-br from-royalGold/20 to-transparent border border-royalGold/30 text-center">
                              <p className="text-3xl mb-1">⚡</p>
                              <p className="font-playfair text-2xl text-royalGold">
                                +18%
                              </p>
                              <p className="text-xs text-softBeige/60">
                                Projected Revenue Lift
                              </p>
                            </div>
                            <div className="p-4 rounded-luxury bg-gradient-to-br from-terracotta/20 to-transparent border border-terracotta/30 text-center">
                              <p className="text-3xl mb-1">🎯</p>
                              <p className="font-playfair text-2xl text-terracotta">
                                96%
                              </p>
                              <p className="text-xs text-softBeige/60">
                                Model Confidence
                              </p>
                            </div>
                            <div className="p-4 rounded-luxury bg-gradient-to-br from-oliveGreen/20 to-transparent border border-oliveGreen/30 text-center">
                              <p className="text-3xl mb-1">💎</p>
                              <p className="font-playfair text-2xl text-oliveGreen">
                                Platinum
                              </p>
                              <p className="text-xs text-softBeige/60">
                                Your Tier
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-md h-full bg-gradient-to-b from-darkWalnut to-charcoal border-l border-softBeige/15 shadow-2xl flex flex-col animate-[slideIn_0.3s_ease]">
            <div className="p-6 border-b border-softBeige/10 flex items-center justify-between">
              <div>
                <h3 className="font-playfair text-2xl text-royalGold">
                  Your Cart
                </h3>
                <p className="text-xs text-softBeige/60">{cartCount} items</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-10 h-10 rounded-full bg-smokyGray/60 hover:bg-smokyGray flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-softBeige/60">Your cart is empty</p>
                  <p className="text-xs text-softBeige/40 mt-1">
                    Add some luxury delights from the menu
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center gap-4 p-4 rounded-luxury bg-smokyGray/40 border border-softBeige/10"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-warmwhite">{item.name}</p>
                      <p className="text-xs text-softBeige/60">
                        ${item.price} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-playfair text-lg text-royalGold">
                      ${item.price * item.quantity}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="w-8 h-8 rounded-full bg-antiqueBronze/30 hover:bg-antiqueBronze/60 text-warmwhite text-xs flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-softBeige/10 space-y-4 bg-darkWalnut/80">
                <div className="flex items-center justify-between">
                  <span className="text-sm uppercase tracking-wider text-softBeige/70">
                    Subtotal
                  </span>
                  <span className="font-playfair text-2xl text-royalGold">
                    ${cartTotal}
                  </span>
                </div>
                <button
                  onClick={placeOrder}
                  className="w-full py-4 rounded-luxury font-semibold bg-gradient-to-r from-royalGold via-deepSaffron to-terracotta text-charcoal hover:shadow-luxury-lg hover:scale-[1.01] transition-all duration-300 text-base"
                >
                  Place Order · ${cartTotal}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-softBeige/10 py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <p className="font-playfair text-xl text-royalGold mb-2">
            Vibeathon Restro
          </p>
          <p className="text-xs text-softBeige/50">
            Modern Indian Luxury · Crafted for the Hackathon
          </p>
        </div>
      </footer>
    </div>
  )
}