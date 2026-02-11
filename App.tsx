import React, { useState, useEffect, useMemo } from 'react';
import { Tab, MenuItem, Order, OrderItem, POSession, Recipe, Ingredient } from './types';
import { Card, Button, Input, Badge } from './components/ui';
import { generateMarketingCopy } from './services/geminiService';
import { 
  ClipboardDocumentListIcon, 
  ShoppingBagIcon, 
  PlusCircleIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  TrashIcon, 
  ArchiveBoxXMarkIcon, 
  UserPlusIcon, 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  BanknotesIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  PlusIcon, 
  CalendarDaysIcon, 
  FunnelIcon, 
  WalletIcon, 
  CreditCardIcon,
  PencilSquareIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
  Bars3Icon,
  ExclamationCircleIcon,
  CircleStackIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

const LOCAL_STORAGE_KEY = 'frozen-food-app-v2';

// Custom Logo Component based on "BekuAlitas" Egg Logo
interface LogoIconProps {
  className?: string;
}

const LogoIcon = ({ className = "w-10 h-10" }: LogoIconProps) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background Circle */}
    <circle cx="50" cy="50" r="48" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="4" />
    
    {/* Inner Orange Circle Background for eggs */}
    <circle cx="50" cy="50" r="40" fill="#FDBA74" />

    {/* Egg 1 (Left, tilted) */}
    <ellipse cx="38" cy="55" rx="16" ry="22" transform="rotate(-15 38 55)" fill="white" stroke="#333" strokeWidth="2" />
    <circle cx="38" cy="58" r="7" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0" />
    
    {/* Egg 2 (Right, tilted) */}
    <ellipse cx="62" cy="55" rx="16" ry="22" transform="rotate(15 62 55)" fill="white" stroke="#333" strokeWidth="2" />
    <circle cx="62" cy="58" r="7" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0" />
  </svg>
);

// Initial Mock Data
const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Ekkado (Pack isi 10)', price: 35000, stock: 20, isActive: true },
  { id: '2', name: 'Lumpia Ayam (Pack isi 8)', price: 25000, stock: 15, isActive: true },
  { id: '3', name: 'Nugget Homemade (500g)', price: 40000, stock: 10, isActive: true },
];

const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'default-1',
    title: 'Adonan Dasar (Ekkado/Nugget)',
    yieldInfo: 'Adonan Jadi: ± 7.8 kg (± 50 pack)',
    lastUpdated: Date.now(),
    ingredients: `Daging & Gilingan:
- Dada Polos 3 kg (Giling halus)
- Paha Polos 1 kg (Giling halus)
- Kulit Ayam 0.5 kg (Giling halus)
- Paha Polos 1 kg (Giling sedang)
> Aduk Rata semua daging

Campuran Bumbu (Larutkan + Aduk):
- Minyak Wijen 90 ml
- Kecap Ikan 30 ml
- Kecap Asin 75 ml
- Saori 30 ml
- Minyak Bawang 90 ml
- Air Es 150 ml
- Kaldu Jamur 30 g
- Garam 15 g
- Lada 60 g
- Sasa 45 g
- Royco Ayam 2 sachet
- Masako Sapi 2 sachet
- Gula 30 g
- Bawang Putih Goreng 75 g

Tepung & Pengikat:
- Baking Powder 30 g
- Tepung Sagutani 500 g
- Tepung Maizena 200 g
- Telur Putih 300 g (kocok) (+ telur ayam 1/2 kg)

Tumisan (Campuran):
- Daun Bawang 1/4 kg (10rb)
- Wortel 1/2 kg
- Bombay 1 buah (besar)
- Daun Kucai (4 ikat - khusus ekado)

Lain-lain:
- Telur Puyuh
- Tepung Roti (cooper)
- Minyak 1 L
- Terigu Segitiga`
  }
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Dada Ayam Polos', stock: 5, unit: 'kg', lastUpdated: Date.now() },
  { id: 'i2', name: 'Tepung Sagutani', stock: 2, unit: 'kg', lastUpdated: Date.now() },
  { id: 'i3', name: 'Minyak Wijen', stock: 500, unit: 'ml', lastUpdated: Date.now() },
  { id: 'i4', name: 'Kulit Tahu', stock: 50, unit: 'lembar', lastUpdated: Date.now() },
];

const CUSTOMER_SOURCES = [
  "GURU SLBN 9", 
  "ORTU SLBN 9", 
  "MURID SLBN 9", 
  "KELUARGA", 
  "TEMAN", 
  "LAINNYA"
];

// Navigation Component
interface NavItemProps {
  tab: Tab;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onTabSelect: (tab: Tab) => void;
}

const NavItem = ({ tab, label, icon: Icon, isActive, onTabSelect }: NavItemProps) => (
  <button
    onClick={() => onTabSelect(tab)}
    className={`flex flex-col items-center justify-center w-full py-3 text-[10px] sm:text-xs font-medium transition-colors border-t-2 ${
      isActive 
        ? 'border-brand-600 text-brand-600 bg-brand-50' 
        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
    <span className="truncate max-w-[60px]">{label}</span>
  </button>
);

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessions, setSessions] = useState<POSession[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Marketing Generation State
  const [marketingText, setMarketingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // New Menu Item State
  const [newItem, setNewItem] = useState({ name: '', price: '', stock: '' });
  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  // Recipe State
  const [isRecipeFormVisible, setIsRecipeFormVisible] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState({ title: '', yieldInfo: '', ingredients: '' });

  // Ingredient State
  const [isIngredientFormVisible, setIsIngredientFormVisible] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [ingredientForm, setIngredientForm] = useState({ name: '', stock: '', unit: '' });

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Order Entry State
  const [currentOrderCustomer, setCurrentOrderCustomer] = useState('');
  const [currentOrderSource, setCurrentOrderSource] = useState('');
  const [currentOrderItems, setCurrentOrderItems] = useState<{ [key: string]: number }>({});
  
  // Temporary state for adding items in Order Entry form
  const [entryMenuId, setEntryMenuId] = useState('');
  const [entryQty, setEntryQty] = useState(1);
  const [entryError, setEntryError] = useState('');
  
  // New Order Entry States for Note and Adjustment
  const [currentOrderNote, setCurrentOrderNote] = useState('');
  const [isNoteActive, setIsNoteActive] = useState(false); 
  const [isPriceAdjustmentActive, setIsPriceAdjustmentActive] = useState(false);
  const [currentAdjustmentAmount, setCurrentAdjustmentAmount] = useState('');

  // Session Management State
  const [newSessionName, setNewSessionName] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  
  // Filter State for Order List
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  // --- Derived State ---
  const activeSession = useMemo(() => sessions.find(s => s.status === 'OPEN'), [sessions]);
  const isPOOpen = !!activeSession;

  // --- Navigation Items ---
  const navItems = [
    { t: Tab.DASHBOARD, l: 'Dashboard', i: ChartBarIcon },
    { t: Tab.MENU, l: 'Menu & Stok', i: ClipboardDocumentListIcon },
    { t: Tab.ORDER_ENTRY, l: 'Catat Pesanan', i: UserPlusIcon },
    { t: Tab.ORDER_LIST, l: 'Riwayat Order', i: ShoppingBagIcon },
    { t: Tab.BALANCE, l: 'Balance', i: WalletIcon },
    { t: Tab.RECIPES, l: 'Buku Resep', i: BookOpenIcon },
    { t: Tab.INGREDIENTS, l: 'Stok Bahan', i: CircleStackIcon },
    { t: Tab.MARKETING, l: 'Marketing AI', i: SparklesIcon },
  ];

  // --- Effects ---
  useEffect(() => {
    let savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    // Fallback migration from v1
    if (!savedData) {
      const v1Data = localStorage.getItem('frozen-food-app-v1');
      if (v1Data) {
        try {
          const parsedV1 = JSON.parse(v1Data);
          const legacySessionId = 'legacy-session';
          const legacySession: POSession = {
            id: legacySessionId,
            name: 'Riwayat Lama (Migrasi)',
            startDate: Date.now(),
            endDate: Date.now(),
            status: parsedV1.isPOOpen ? 'OPEN' : 'CLOSED'
          };

          const migratedOrders = (parsedV1.orders || []).map((o: any) => ({
             ...o,
             sessionId: legacySessionId,
             isPaid: o.isPaid !== undefined ? o.isPaid : false,
             adjustmentAmount: o.adjustmentAmount || 0
          }));

          setMenu(parsedV1.menu || INITIAL_MENU);
          setOrders(migratedOrders);
          setSessions([legacySession]);
          setRecipes(INITIAL_RECIPES);
          setIngredients(INITIAL_INGREDIENTS);
          return;
        } catch (e) {
          console.error("Migration failed", e);
        }
      }
    }

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setMenu(parsed.menu || INITIAL_MENU);
        setOrders(parsed.orders || []);
        setSessions(parsed.sessions || []);
        setRecipes(parsed.recipes && parsed.recipes.length > 0 ? parsed.recipes : INITIAL_RECIPES);
        setIngredients(parsed.ingredients || INITIAL_INGREDIENTS);
      } catch (e) {
        console.error("Failed to parse local storage", e);
        setMenu(INITIAL_MENU);
        setRecipes(INITIAL_RECIPES);
        setIngredients(INITIAL_INGREDIENTS);
      }
    } else {
      setMenu(INITIAL_MENU);
      setRecipes(INITIAL_RECIPES);
      setIngredients(INITIAL_INGREDIENTS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ menu, orders, sessions, recipes, ingredients }));
  }, [menu, orders, sessions, recipes, ingredients]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // --- Handlers ---

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSession) return;

    const newSession: POSession = {
      id: Date.now().toString(),
      name: newSessionName.trim() || `PO #${sessions.length + 1} (${new Date().toLocaleDateString('id-ID')})`,
      startDate: Date.now(),
      status: 'OPEN'
    };

    setSessions([newSession, ...sessions]);
    setNewSessionName('');
    setIsStartingSession(false);
    window.alert('PO Baru berhasil dibuka!');
  };

  const handleCloseSession = () => {
    setSessions(prevSessions => prevSessions.map(session => {
      if (session.status === 'OPEN') {
        return { 
          ...session, 
          status: 'CLOSED' as const, 
          endDate: Date.now() 
        };
      }
      return session;
    }));
    setIsConfirmingClose(false);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.price || !newItem.stock) {
      window.alert("Mohon lengkapi Nama Menu, Harga, dan Stok!");
      return;
    }

    if (editingMenuId) {
       setMenu(prev => prev.map(item => {
         if (item.id === editingMenuId) {
             return {
                 ...item,
                 name: newItem.name,
                 price: parseInt(newItem.price),
                 stock: parseInt(newItem.stock)
             };
         }
         return item;
       }));
       window.alert("Menu berhasil diperbarui!");
       setIsAddMenuVisible(false);
       setEditingMenuId(null);
    } else {
       const item: MenuItem = {
         id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
         name: newItem.name,
         price: parseInt(newItem.price),
         stock: parseInt(newItem.stock),
         isActive: true,
       };
       setMenu(prev => [...prev, item]);
       window.alert("Menu berhasil ditambahkan!");
       setIsAddMenuVisible(false);
    }
    setNewItem({ name: '', price: '', stock: '' });
  };

  const toggleAddMenu = () => {
     if (isAddMenuVisible) {
         setIsAddMenuVisible(false);
         setEditingMenuId(null);
         setNewItem({ name: '', price: '', stock: '' });
     } else {
         setIsAddMenuVisible(true);
         setEditingMenuId(null);
         setNewItem({ name: '', price: '', stock: '' });
     }
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingMenuId(item.id);
    setNewItem({
        name: item.name,
        price: item.price.toString(),
        stock: item.stock.toString()
    });
    setIsAddMenuVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClickDelete = (id: string) => {
    if (confirmDeleteId === id) {
      setMenu(prev => prev.filter(m => String(m.id) !== String(id)));
      setConfirmDeleteId(null);
      if (editingMenuId === id) {
          setIsAddMenuVisible(false);
          setEditingMenuId(null);
          setNewItem({ name: '', price: '', stock: '' });
      }
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const handleToggleActive = (id: string) => {
    setMenu(menu.map(m => String(m.id) === String(id) ? { ...m, isActive: !m.isActive } : m));
  };

  const handleUpdateStock = (id: string, newStock: number) => {
     setMenu(menu.map(m => String(m.id) === String(id) ? { ...m, stock: newStock } : m));
  };

  const handleTogglePaymentStatus = (orderId: string) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const newIsPaid = !order.isPaid;
        return { 
          ...order, 
          isPaid: newIsPaid,
          paymentDate: newIsPaid && !order.paymentDate ? Date.now() : order.paymentDate
        };
      }
      return order;
    }));
  };

  const handleUpdatePaymentMethod = (orderId: string, method: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, paymentMethod: method } : order
    ));
  };

  const handleUpdatePaymentDate = (orderId: string, dateString: string) => {
    if (!dateString) return;
    const timestamp = new Date(dateString).getTime();
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, paymentDate: timestamp } : order
    ));
  };

  // Recipe Handlers
  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeForm.title.trim()) {
      window.alert("Nama Resep wajib diisi!");
      return;
    }

    if (editingRecipeId) {
      setRecipes(prev => prev.map(r => r.id === editingRecipeId ? {
        ...r,
        title: recipeForm.title,
        yieldInfo: recipeForm.yieldInfo,
        ingredients: recipeForm.ingredients,
        lastUpdated: Date.now()
      } : r));
      window.alert("Resep berhasil disimpan!");
    } else {
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: recipeForm.title,
        yieldInfo: recipeForm.yieldInfo,
        ingredients: recipeForm.ingredients,
        lastUpdated: Date.now()
      };
      setRecipes(prev => [...prev, newRecipe]);
      window.alert("Resep baru berhasil dibuat!");
    }
    
    setIsRecipeFormVisible(false);
    setEditingRecipeId(null);
    setRecipeForm({ title: '', yieldInfo: '', ingredients: '' });
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRecipeForm({
      title: recipe.title,
      yieldInfo: recipe.yieldInfo,
      ingredients: recipe.ingredients
    });
    setIsRecipeFormVisible(true);
    window.scrollTo(0,0);
  };

  const handleDeleteRecipe = (id: string) => {
    if (window.confirm("Yakin ingin menghapus resep ini?")) {
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

  // Ingredient Handlers
  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientForm.name.trim()) {
      window.alert("Nama bahan wajib diisi!");
      return;
    }
    if (!ingredientForm.stock || !ingredientForm.unit) {
      window.alert("Stok dan Satuan wajib diisi!");
      return;
    }

    const stockVal = parseFloat(ingredientForm.stock);

    if (editingIngredientId) {
      setIngredients(prev => prev.map(i => i.id === editingIngredientId ? {
        ...i,
        name: ingredientForm.name,
        stock: stockVal,
        unit: ingredientForm.unit,
        lastUpdated: Date.now()
      } : i));
      window.alert("Stok bahan diperbarui!");
    } else {
      const newIng: Ingredient = {
        id: Date.now().toString(),
        name: ingredientForm.name,
        stock: stockVal,
        unit: ingredientForm.unit,
        lastUpdated: Date.now()
      };
      setIngredients(prev => [...prev, newIng]);
      window.alert("Bahan baru ditambahkan!");
    }

    setIsIngredientFormVisible(false);
    setEditingIngredientId(null);
    setIngredientForm({ name: '', stock: '', unit: '' });
  };

  const handleEditIngredient = (ing: Ingredient) => {
    setEditingIngredientId(ing.id);
    setIngredientForm({
      name: ing.name,
      stock: ing.stock.toString(),
      unit: ing.unit
    });
    setIsIngredientFormVisible(true);
    window.scrollTo(0,0);
  };

  const handleDeleteIngredient = (id: string) => {
    if (window.confirm("Hapus bahan ini dari daftar stok?")) {
      setIngredients(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleQuickUpdateStock = (id: string, delta: number) => {
    setIngredients(prev => prev.map(i => {
      if (i.id === id) {
        const newStock = Math.max(0, i.stock + delta);
        return { ...i, stock: newStock, lastUpdated: Date.now() };
      }
      return i;
    }));
  };

  const handleGenerateMarketing = async () => {
    setIsGenerating(true);
    const text = await generateMarketingCopy(menu);
    setMarketingText(text);
    setIsGenerating(false);
  };

  const handleCopyMarketingText = async () => {
    await navigator.clipboard.writeText(marketingText);
    window.alert('Teks disalin!');
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === Tab.ORDER_LIST) {
        setSelectedSessionFilter('ALL');
        setPaymentStatusFilter('ALL');
    }
  };

  // Order Entry Logic
  const deleteFromCart = (menuId: string) => {
    const newItems = { ...currentOrderItems };
    delete newItems[menuId];
    setCurrentOrderItems(newItems);
  };

  const handleManualAddItem = () => {
    setEntryError('');
    if (!entryMenuId) {
      setEntryError("Pilih menu terlebih dahulu!");
      return;
    }
    
    const item = menu.find(m => String(m.id) === String(entryMenuId));
    if (!item) return;

    if (entryQty < 1) {
      setEntryError("Jumlah minimal 1");
      return;
    }

    const currentQty = currentOrderItems[entryMenuId] || 0;
    if (currentQty + entryQty > item.stock) {
       setEntryError(`Stok tidak mencukupi! Sisa stok: ${item.stock}, sudah di keranjang: ${currentQty}`);
       return;
    }

    setCurrentOrderItems({ ...currentOrderItems, [entryMenuId]: currentQty + entryQty });
    setEntryMenuId('');
    setEntryQty(1);
    setEntryError('');
  };

  const handleSubmitOrder = () => {
    if (!activeSession) {
      window.alert("Tidak ada PO yang sedang buka!");
      return;
    }

    if (!currentOrderCustomer.trim()) {
      window.alert('Nama pembeli wajib diisi!');
      return;
    }

    const itemEntries = Object.entries(currentOrderItems) as [string, number][];
    if (itemEntries.length === 0) {
      window.alert('Belum ada menu dipilih!');
      return;
    }

    const orderItems: OrderItem[] = [];
    let menuTotal = 0;
    
    const newMenuState = [...menu];
    
    for (const [id, qty] of itemEntries) {
      const menuIndex = newMenuState.findIndex(m => String(m.id) === String(id));
      if (menuIndex === -1) continue;

      if (newMenuState[menuIndex].stock < qty) {
        window.alert(`Stok ${newMenuState[menuIndex].name} tidak cukup.`);
        return;
      }

      newMenuState[menuIndex].stock -= qty;
      
      orderItems.push({
        menuId: id,
        menuName: newMenuState[menuIndex].name,
        quantity: qty,
        priceAtOrder: newMenuState[menuIndex].price
      });
      menuTotal += newMenuState[menuIndex].price * qty;
    }

    const adjustment = isPriceAdjustmentActive ? (parseInt(currentAdjustmentAmount) || 0) : 0;
    const finalTotal = menuTotal + adjustment;
    const finalNote = isNoteActive ? currentOrderNote : '';

    const newOrder: Order = {
      id: Date.now().toString(),
      sessionId: activeSession.id,
      customerName: currentOrderCustomer,
      source: currentOrderSource || undefined,
      items: orderItems,
      totalPrice: finalTotal,
      adjustmentAmount: adjustment,
      note: finalNote,
      timestamp: Date.now(),
      isPaid: false,
    };

    setMenu(newMenuState);
    setOrders([newOrder, ...orders]);
    
    setCurrentOrderCustomer('');
    setCurrentOrderItems({});
    setCurrentOrderSource('');
    setCurrentOrderNote('');
    setIsNoteActive(false);
    setIsPriceAdjustmentActive(false);
    setCurrentAdjustmentAmount('');
    window.alert('Pesanan berhasil dicatat!');
    
    setSelectedSessionFilter('ALL');
    setPaymentStatusFilter('ALL');
    setActiveTab(Tab.ORDER_LIST);
  };

  // --- Render Helpers ---

  const renderDashboard = () => {
    const displaySession = activeSession || sessions[0];
    const sessionOrders = displaySession 
        ? orders.filter(o => o.sessionId === displaySession.id) 
        : [];

    const paidOrders = sessionOrders.filter(o => o.isPaid);
    const unpaidOrders = sessionOrders.filter(o => !o.isPaid);
    
    const revenueReceived = paidOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const revenuePending = unpaidOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const revenuePotential = revenueReceived + revenuePending;

    const itemSalesMap = new Map<string, { name: string; qty: number; subtotal: number }>();

    sessionOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemSalesMap.get(item.menuId) || { name: item.menuName, qty: 0, subtotal: 0 };
        itemSalesMap.set(item.menuId, {
          name: item.menuName,
          qty: existing.qty + item.quantity,
          subtotal: existing.subtotal + (item.priceAtOrder * item.quantity)
        });
      });
    });

    const sortedItems = Array.from(itemSalesMap.values()).sort((a, b) => b.qty - a.qty);
    const totalItemsSold = sortedItems.reduce((acc, item) => acc + item.qty, 0);
    
    const activeMenus = menu.filter(m => m.isActive);
    const lowStockItems = activeMenus.filter(m => m.stock < 5 && m.stock > 0);
    const outOfStockItems = activeMenus.filter(m => m.stock === 0);

    const handleFilterRedirect = (status: 'PAID' | 'UNPAID') => {
      if (displaySession) {
        setSelectedSessionFilter(displaySession.id);
      }
      setPaymentStatusFilter(status);
      setActiveTab(Tab.ORDER_LIST);
    };

    return (
      <div className="space-y-6">
        <Card className={`text-white border-none shadow-md transition-colors ${activeSession ? 'bg-gradient-to-br from-brand-500 to-brand-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-white/80 font-medium text-sm uppercase tracking-wider">Status PO</h3>
                    <div className="mt-2">
                        {activeSession ? (
                            <>
                                <span className="text-2xl font-bold block">{activeSession.name}</span>
                                <span className="text-xs bg-white/20 px-2 py-1 rounded-full mt-1 inline-block">Buka sejak: {new Date(activeSession.startDate).toLocaleDateString('id-ID')}</span>
                            </>
                        ) : (
                            <span className="text-2xl font-bold">PO TUTUP</span>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-full ${activeSession ? 'bg-white/20' : 'bg-black/20'}`}>
                    <ShoppingBagIcon className="w-8 h-8" />
                </div>
            </div>

            <div className="mt-6">
                {activeSession ? (
                  isConfirmingClose ? (
                     <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => handleCloseSession()}
                          className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 shadow transition-colors"
                        >
                          Ya, Tutup Sekarang
                        </button>
                         <button 
                          type="button"
                          onClick={() => setIsConfirmingClose(false)}
                          className="px-4 bg-white/20 text-white py-2.5 rounded-lg font-bold hover:bg-white/30 transition-colors"
                        >
                          Batal
                        </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setIsConfirmingClose(true)}
                      className="w-full text-sm bg-white text-red-600 py-2.5 rounded-lg font-bold hover:bg-red-50 shadow transition-colors"
                    >
                      Tutup Periode PO Ini
                    </button>
                  )
                ) : (
                    isStartingSession ? (
                        <form onSubmit={handleStartSession} className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20">
                            <label className="text-xs text-white/80 block mb-1">Nama Periode PO (Opsional)</label>
                            <input 
                                type="text" 
                                autoFocus
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                placeholder="Contoh: PO Batch #5"
                                className="w-full px-3 py-2 rounded text-gray-900 text-sm mb-3 focus:outline-none bg-[#E2E2E2]"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-white text-brand-700 py-2 rounded text-xs font-bold hover:bg-brand-50">Mulai PO</button>
                                <button type="button" onClick={() => setIsStartingSession(false)} className="px-3 bg-transparent border border-white/40 text-white py-2 rounded text-xs hover:bg-white/10">Batal</button>
                            </div>
                        </form>
                    ) : (
                        <button 
                          onClick={() => setIsStartingSession(true)}
                          className="w-full text-sm bg-white text-brand-600 py-2.5 rounded-lg font-bold hover:bg-brand-50 shadow transition-colors"
                        >
                          Buka PO Baru
                        </button>
                    )
                )}
            </div>
        </Card>

        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <ChartBarIcon className="w-5 h-5 text-gray-500"/>
            <h3 className="font-semibold text-gray-700">
                Statistik {displaySession ? `"${displaySession.name}"` : ''}
            </h3>
        </div>

        <Card className="border-none shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 mb-4 gap-4">
            <div>
               <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400"/>
                  Total Penjualan
               </h3>
               <div className="mt-1">
                 <span className="text-2xl font-bold text-gray-900">Rp {revenuePotential.toLocaleString('id-ID')}</span>
                 <span className="text-xs text-gray-400 ml-2">(Estimasi)</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
             <div className="pr-0 md:pr-6 py-2 md:py-0">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-orange-100 rounded-md">
                        <ClockIcon className="w-4 h-4 text-orange-600"/>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Belum Dibayar</span>
                </div>
                <div className="flex justify-between items-end">
                    <p className="text-xl font-bold text-orange-600">Rp {revenuePending.toLocaleString('id-ID')}</p>
                    <button 
                      onClick={() => handleFilterRedirect('UNPAID')}
                      className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full hover:bg-orange-200 cursor-pointer transition-colors flex items-center"
                    >
                      {unpaidOrders.length} Transaksi &rarr;
                    </button>
                </div>
             </div>

             <div className="pl-0 md:pl-6 pt-4 md:pt-0">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-md">
                        <BanknotesIcon className="w-4 h-4 text-green-600"/>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Sudah Dibayar</span>
                </div>
                <div className="flex justify-between items-end">
                    <p className="text-xl font-bold text-green-700">Rp {revenueReceived.toLocaleString('id-ID')}</p>
                    <button
                      onClick={() => handleFilterRedirect('PAID')}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 cursor-pointer transition-colors flex items-center"
                    >
                      {paidOrders.length} Transaksi &rarr;
                    </button>
                </div>
             </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-1 md:col-span-2 bg-white border border-gray-200">
                 <h3 className="text-gray-500 font-medium text-xs uppercase mb-3 flex items-center gap-2">
                    <ShoppingBagIcon className="w-4 h-4"/> Detail Item Terjual
                 </h3>
                 {sortedItems.length === 0 ? (
                     <p className="text-gray-400 text-sm italic">Belum ada item terjual.</p>
                 ) : (
                     <div className="space-y-3">
                        {sortedItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="bg-brand-50 text-brand-700 font-bold text-xs w-8 h-8 flex items-center justify-center rounded-lg">
                                        {item.qty}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                </div>
                                <span className="text-sm text-gray-500">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100 bg-gray-50 p-2 rounded-lg">
                             <span className="font-bold text-xs text-gray-600 uppercase">Total Items: {totalItemsSold}</span>
                             <span className="font-bold text-sm text-brand-700">Rp {sortedItems.reduce((a,b)=>a+b.subtotal,0).toLocaleString('id-ID')}</span>
                        </div>
                     </div>
                 )}
            </Card>

            <Card className="bg-white border border-gray-200 h-fit">
                 <h3 className="text-gray-500 font-medium text-xs uppercase">Menu Aktif</h3>
                 <p className="text-3xl font-bold mt-2 text-gray-800">{activeMenus.length}</p>
                 <span className="text-xs text-gray-400">dari {menu.length} total menu</span>
                 <div className="mt-4 pt-4 border-t border-gray-100">
                     <button onClick={() => handleTabChange(Tab.MENU)} className="text-xs text-brand-600 font-medium hover:underline">Kelola Menu &rarr;</button>
                 </div>
            </Card>
        </div>

        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <ArchiveBoxXMarkIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-bold">Perhatian Stok:</span>
                  {outOfStockItems.length > 0 && ` ${outOfStockItems.map(i => i.name).join(', ')} habis.`}
                  {lowStockItems.length > 0 && ` ${lowStockItems.map(i => i.name).join(', ')} menipis.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <button 
            onClick={() => handleTabChange(Tab.ORDER_ENTRY)}
            disabled={!isPOOpen}
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group bg-white"
           >
              <div className="text-center">
                <UserPlusIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-brand-500" />
                <span className="mt-2 block text-sm font-medium text-gray-900">Catat Pesanan Baru</span>
              </div>
           </button>
           <button 
            onClick={() => handleTabChange(Tab.MARKETING)}
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group bg-white"
           >
              <div className="text-center">
                <SparklesIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500" />
                <span className="mt-2 block text-sm font-medium text-gray-900">Buat Iklan Otomatis (AI)</span>
              </div>
           </button>
        </div>
      </div>
    );
  };

  const renderRecipes = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Buku Resep Digital</h2>
          <Button 
            onClick={() => {
              setEditingRecipeId(null);
              setRecipeForm({ title: '', yieldInfo: '', ingredients: '' });
              setIsRecipeFormVisible(!isRecipeFormVisible);
            }} 
            variant={isRecipeFormVisible ? "secondary" : "primary"}
            className="flex items-center"
          >
            {isRecipeFormVisible ? (
               <>
                 <XMarkIcon className="w-5 h-5 mr-1" />
                 Batal
               </>
            ) : (
               <>
                 <PlusCircleIcon className="w-5 h-5 mr-1" />
                 Resep Baru
               </>
            )}
          </Button>
        </div>

        {isRecipeFormVisible && (
          <Card className="bg-white border-gray-200">
             <h3 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
               {editingRecipeId ? <PencilSquareIcon className="w-5 h-5"/> : <BookOpenIcon className="w-5 h-5"/>}
               {editingRecipeId ? "Edit Resep" : "Tulis Resep Baru"}
             </h3>
             <form onSubmit={handleSaveRecipe} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Nama Resep" 
                    placeholder="Contoh: Adonan Nugget" 
                    value={recipeForm.title}
                    onChange={(e) => setRecipeForm({...recipeForm, title: e.target.value})}
                  />
                  <Input 
                    label="Hasil Jadi (Yield)" 
                    placeholder="Contoh: 7.8 kg / 50 pack" 
                    value={recipeForm.yieldInfo}
                    onChange={(e) => setRecipeForm({...recipeForm, yieldInfo: e.target.value})}
                  />
                </div>
                <div>
                   <label className="text-sm font-medium text-gray-700 block mb-1">Bahan & Cara Membuat</label>
                   <textarea
                     className="w-full h-64 border border-gray-300 rounded-lg px-3 py-2 bg-[#E2E2E2] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-mono whitespace-pre"
                     placeholder="Tulis bahan-bahan dan langkah di sini..."
                     value={recipeForm.ingredients}
                     onChange={(e) => setRecipeForm({...recipeForm, ingredients: e.target.value})}
                   />
                   <p className="text-xs text-gray-500 mt-1">*Tips: Gunakan enter untuk baris baru agar rapi.</p>
                </div>
                <div className="flex justify-end gap-2">
                   <Button type="submit">{editingRecipeId ? "Simpan Perubahan" : "Simpan Resep"}</Button>
                </div>
             </form>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
           {recipes.length === 0 ? (
             <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <BookOpenIcon className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
                <p className="text-gray-500">Belum ada resep tersimpan.</p>
             </div>
           ) : (
             recipes.map(recipe => (
               <Card key={recipe.id} className="border-l-4 border-l-brand-500">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                     <div>
                        <h3 className="text-lg font-bold text-gray-800">{recipe.title}</h3>
                        {recipe.yieldInfo && (
                          <Badge color="blue">{recipe.yieldInfo}</Badge>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Terakhir update: {new Date(recipe.lastUpdated).toLocaleDateString('id-ID')}</p>
                     </div>
                     <div className="flex gap-2">
                        <Button 
                          type="button"
                          variant="secondary" 
                          className="h-8 w-8 !p-0 flex items-center justify-center shrink-0" 
                          title="Salin Resep"
                          onClick={() => {
                            const text = `${recipe.title}\n(${recipe.yieldInfo})\n\n${recipe.ingredients}`;
                            navigator.clipboard.writeText(text)
                              .then(() => window.alert("Resep disalin ke clipboard!"))
                              .catch(err => {
                                console.error('Gagal menyalin: ', err);
                                // Fallback for older browsers or non-secure contexts if needed, 
                                // but alert is sufficient for now.
                                window.alert("Gagal menyalin resep (Browser block).");
                              });
                          }}
                        >
                           <DocumentDuplicateIcon className="w-4 h-4"/>
                        </Button>
                        <Button 
                          type="button"
                          variant="secondary" 
                          className="h-8 w-8 !p-0 flex items-center justify-center shrink-0" 
                          onClick={() => handleEditRecipe(recipe)}
                          title="Edit Resep"
                        >
                           <PencilSquareIcon className="w-4 h-4 text-blue-600"/>
                        </Button>
                        <Button 
                          type="button"
                          variant="secondary" 
                          className="h-8 w-8 !p-0 flex items-center justify-center shrink-0" 
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          title="Hapus Resep"
                        >
                           <TrashIcon className="w-4 h-4 text-red-600"/>
                        </Button>
                     </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{recipe.ingredients}</pre>
                  </div>
               </Card>
             ))
           )}
        </div>
      </div>
    );
  };

  const renderIngredients = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Stok Bahan Baku</h2>
          <Button 
            onClick={() => {
              setEditingIngredientId(null);
              setIngredientForm({ name: '', stock: '', unit: '' });
              setIsIngredientFormVisible(!isIngredientFormVisible);
            }} 
            variant={isIngredientFormVisible ? "secondary" : "primary"}
            className="flex items-center"
          >
            {isIngredientFormVisible ? (
               <>
                 <XMarkIcon className="w-5 h-5 mr-1" />
                 Batal
               </>
            ) : (
               <>
                 <PlusCircleIcon className="w-5 h-5 mr-1" />
                 Tambah Bahan
               </>
            )}
          </Button>
        </div>

        {isIngredientFormVisible && (
          <Card className="bg-white border-gray-200">
             <h3 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
               {editingIngredientId ? <PencilSquareIcon className="w-5 h-5"/> : <CircleStackIcon className="w-5 h-5"/>}
               {editingIngredientId ? "Edit Bahan" : "Input Bahan Baru"}
             </h3>
             <form onSubmit={handleSaveIngredient} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input 
                  label="Nama Bahan" 
                  placeholder="Contoh: Tepung Terigu" 
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({...ingredientForm, name: e.target.value})}
                />
                <Input 
                  label="Stok Saat Ini" 
                  type="number"
                  placeholder="0"
                  value={ingredientForm.stock}
                  onChange={(e) => setIngredientForm({...ingredientForm, stock: e.target.value})}
                />
                <Input 
                  label="Satuan (Unit)" 
                  placeholder="kg, gr, liter, pcs..." 
                  value={ingredientForm.unit}
                  onChange={(e) => setIngredientForm({...ingredientForm, unit: e.target.value})}
                />
                <div className="md:col-span-3 flex justify-end">
                   <Button type="submit">{editingIngredientId ? "Simpan Perubahan" : "Simpan"}</Button>
                </div>
             </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {ingredients.length === 0 ? (
             <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <CircleStackIcon className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
                <p className="text-gray-500">Belum ada data stok bahan.</p>
             </div>
           ) : (
             ingredients.map(ing => (
               <div key={ing.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                     <div>
                        <h4 className="font-bold text-gray-800">{ing.name}</h4>
                        <p className="text-xs text-gray-400">Update: {new Date(ing.lastUpdated).toLocaleDateString('id-ID')}</p>
                     </div>
                     <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditIngredient(ing)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                        >
                           <PencilSquareIcon className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={() => handleDeleteIngredient(ing.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                        >
                           <TrashIcon className="w-4 h-4"/>
                        </button>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleQuickUpdateStock(ing.id, -1)}
                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                          >
                             <MinusIcon className="w-4 h-4"/>
                          </button>
                          <span className={`text-xl font-bold ${ing.stock < 1 ? 'text-red-600' : 'text-gray-800'}`}>
                             {ing.stock} <span className="text-sm font-normal text-gray-500">{ing.unit}</span>
                          </span>
                          <button 
                            onClick={() => handleQuickUpdateStock(ing.id, 1)}
                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                          >
                             <PlusIcon className="w-4 h-4"/>
                          </button>
                      </div>
                      {ing.stock < 1 && (
                          <div title="Stok Menipis" className="text-red-500 animate-pulse">
                              <ExclamationCircleIcon className="w-6 h-6"/>
                          </div>
                      )}
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    );
  };

  const renderMenu = () => {
    const sortedMenu = [...menu].sort((a, b) => {
      if (a.isActive === b.isActive) return 0;
      return a.isActive ? -1 : 1;
    });

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Manajemen Menu & Stok</h2>
        <Button 
          onClick={() => toggleAddMenu()} 
          variant={isAddMenuVisible ? "secondary" : "primary"}
          className="flex items-center"
        >
          {isAddMenuVisible ? (
             <>
               <XMarkIcon className="w-5 h-5 mr-1" />
               Batal
             </>
          ) : (
             <>
               <PlusCircleIcon className="w-5 h-5 mr-1" />
               Tambah Menu
             </>
          )}
        </Button>
      </div>

      {isAddMenuVisible && (
        <Card className="bg-white border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
            {editingMenuId ? (
                <>
                    <PencilSquareIcon className="w-5 h-5"/> Edit Menu
                </>
            ) : (
                <>
                    <PlusCircleIcon className="w-5 h-5"/> Input Menu Baru
                </>
            )}
          </h3>
          <form onSubmit={handleSaveMenu} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input 
              label="Nama Menu" 
              placeholder="Contoh: Risol Mayo" 
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            />
            <Input 
              label="Harga (Rp)" 
              type="number" 
              placeholder="15000" 
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: e.target.value})}
            />
            <Input 
              label="Stok Awal" 
              type="number" 
              placeholder="20" 
              value={newItem.stock}
              onChange={(e) => setNewItem({...newItem, stock: e.target.value})}
            />
            <Button type="submit">{editingMenuId ? "Simpan Perubahan" : "Simpan"}</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {sortedMenu.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Belum ada menu. Tambahkan menu di atas.</p>
        ) : (
          sortedMenu.map((item) => (
            <div key={item.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-opacity ${!item.isActive ? 'opacity-60 grayscale bg-gray-50' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>
                  {!item.isActive && <Badge color="gray">Non-aktif</Badge>}
                </div>
                <p className="text-gray-500 text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="w-20">
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg px-2 h-9 text-center bg-[#E2E2E2] text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={item.stock}
                      onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                      disabled={!item.isActive}
                      title="Stok"
                    />
                 </div>

                 <div>
                    <Button
                        variant="secondary"
                        onClick={() => handleEditClick(item)}
                        title="Edit Menu"
                        className="h-9 w-10 px-0 flex items-center justify-center"
                    >
                        <PencilSquareIcon className="w-5 h-5 text-gray-600" />
                    </Button>
                 </div>

                 <div>
                   <Button 
                     variant="secondary"
                     onClick={() => handleToggleActive(item.id)}
                     title={item.isActive ? "Non-aktifkan Menu" : "Aktifkan Menu"}
                     className="h-9 w-10 px-0 flex items-center justify-center"
                   >
                      {item.isActive ? <EyeIcon className="w-5 h-5 text-gray-600" /> : <EyeSlashIcon className="w-5 h-5 text-gray-400" />}
                   </Button>
                 </div>
                 
                 <div className="relative">
                   {confirmDeleteId === item.id ? (
                     <div className="flex items-center gap-1">
                       <Button 
                         type="button"
                         variant="danger" 
                         onClick={() => handleClickDelete(item.id)}
                         className="h-9 px-3 text-xs"
                         title="Yakin hapus?"
                       >
                         Yakin
                       </Button>
                       <Button 
                          type="button"
                          variant="secondary"
                          onClick={() => handleCancelDelete()}
                          className="h-9 w-9 px-0 flex items-center justify-center"
                          title="Batal"
                       >
                          <XMarkIcon className="w-4 h-4" />
                       </Button>
                     </div>
                   ) : (
                     <Button 
                       type="button" 
                       variant="danger" 
                       onClick={() => handleClickDelete(item.id)}
                       title="Hapus Menu"
                       className="h-9 w-10 px-0 flex items-center justify-center"
                     >
                       <TrashIcon className="w-4 h-4" />
                     </Button>
                   )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  };

  const renderOrderEntry = () => {
    if (!activeSession) {
      return (
        <div className="text-center py-20">
          <ArchiveBoxXMarkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">PO Sedang Tutup</h2>
          <p className="text-gray-500 mt-2">Silakan buka PO di halaman Dashboard terlebih dahulu untuk mencatat pesanan.</p>
          <Button className="mt-6" onClick={() => handleTabChange(Tab.DASHBOARD)}>Ke Dashboard</Button>
        </div>
      );
    }

    const menuTotal = (Object.entries(currentOrderItems) as [string, number][]).reduce((acc, [id, qty]) => {
      const item = menu.find(m => String(m.id) === String(id));
      return acc + (item ? item.price * qty : 0);
    }, 0);

    const adjustment = isPriceAdjustmentActive ? (parseInt(currentAdjustmentAmount) || 0) : 0;
    const currentTotal = menuTotal + adjustment;

    const activeMenu = menu.filter(m => m.isActive);

    return (
      <div className="max-w-2xl mx-auto pb-48 md:pb-32">
        <Card className="shadow-lg border-gray-200">
          <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-center">
             <h3 className="text-xl font-bold text-gray-900">Formulir Pemesanan</h3>
             <Badge color="green">{activeSession.name}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input 
              label="Nama Pembeli" 
              placeholder="Masukkan nama..." 
              value={currentOrderCustomer}
              onChange={(e) => setCurrentOrderCustomer(e.target.value)}
            />
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Dari</label>
              <select
                value={currentOrderSource}
                onChange={(e) => setCurrentOrderSource(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-[#E2E2E2] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all h-[42px]"
              >
                <option value="" disabled className="text-gray-400">Pilih...</option>
                {CUSTOMER_SOURCES.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 transition-all">
             <div className="flex gap-2">
                <div className="flex-1">
                  <select
                    value={entryMenuId}
                    onChange={(e) => { 
                        setEntryMenuId(e.target.value); 
                        setEntryError('');
                    }}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white h-[40px] ${entryError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">+ Pilih Menu...</option>
                    {activeMenu.map(m => (
                      <option key={m.id} value={m.id} disabled={m.stock === 0}>
                         {m.name} (Sisa: {m.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                   <input 
                     type="number"
                     min="1"
                     placeholder="Qty"
                     value={entryQty}
                     onChange={(e) => {
                        setEntryQty(parseInt(e.target.value) || 1);
                        setEntryError('');
                     }}
                     className={`w-full border rounded-md px-2 py-2 text-sm text-center focus:ring-2 focus:ring-brand-500 outline-none bg-white h-[40px] ${entryError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                   />
                </div>
                <Button 
                    onClick={() => handleManualAddItem()} 
                    disabled={!entryMenuId} 
                    className="h-[40px] px-3 !rounded-md"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                </Button>
             </div>
             {entryError && (
                <div className="mt-2 text-red-600 text-xs flex items-center gap-1 font-medium animate-pulse">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {entryError}
                </div>
             )}
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-2">Daftar Belanja</h4>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {Object.keys(currentOrderItems).length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm italic bg-gray-50">
                     Belum ada menu yang ditambahkan.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {(Object.entries(currentOrderItems) as [string, number][]).map(([id, qty]) => {
                      const item = menu.find(m => String(m.id) === String(id));
                      if (!item) return null;
                      return (
                        <div key={id} className="flex justify-between items-center p-3 hover:bg-gray-50">
                          <div className="flex-1">
                             <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                             <p className="text-xs text-gray-500">
                                {qty} x Rp {item.price.toLocaleString('id-ID')}
                             </p>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="font-bold text-gray-700 text-sm">
                                Rp {(item.price * qty).toLocaleString('id-ID')}
                             </span>
                             <button 
                               onClick={() => deleteFromCart(id)}
                               className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                               title="Hapus"
                             >
                                <TrashIcon className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <div className="flex items-center gap-2 mb-2 h-[24px]">
                 <input 
                    type="checkbox" 
                    id="addNote"
                    checked={isNoteActive}
                    onChange={(e) => setIsNoteActive(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                 />
                 <label htmlFor="addNote" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Tambah Keterangan (Opsional)</label>
               </div>
               
               <div className={`transition-all duration-300 overflow-hidden ${isNoteActive ? 'opacity-100 max-h-32' : 'opacity-50 max-h-0'}`}>
                   <textarea
                    value={currentOrderNote}
                    onChange={(e) => setCurrentOrderNote(e.target.value)}
                    placeholder="Catatan tambahan (opsional)..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-[#E2E2E2] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm h-24 resize-none"
                  />
               </div>
            </div>

            <div>
               <div className="flex items-center gap-2 mb-2 h-[24px]">
                 <input 
                    type="checkbox" 
                    id="priceAdjustment"
                    checked={isPriceAdjustmentActive}
                    onChange={(e) => setIsPriceAdjustmentActive(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                 />
                 <label htmlFor="priceAdjustment" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Sesuaikan Harga (Opsional)</label>
               </div>
               
               <div className={`transition-all duration-300 overflow-hidden ${isPriceAdjustmentActive ? 'opacity-100 max-h-20' : 'opacity-50 max-h-0'}`}>
                  <Input 
                    label="Nominal Tambahan (Rp)" 
                    type="number"
                    placeholder="0"
                    value={currentAdjustmentAmount}
                    onChange={(e) => setCurrentAdjustmentAmount(e.target.value)}
                    className="text-right"
                    disabled={!isPriceAdjustmentActive}
                  />
               </div>
            </div>
          </div>
        </Card>

        <div className="fixed bottom-[56px] md:bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 p-4">
           <div className="max-w-2xl mx-auto">
              <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-end">
                    <div className="text-sm text-gray-600 flex flex-col gap-1">
                        <div className="flex gap-2">
                           <span>Subtotal:</span>
                           <span className="font-medium text-gray-900">Rp {menuTotal.toLocaleString('id-ID')}</span>
                        </div>
                        {isPriceAdjustmentActive && (
                           <div className="flex gap-2 text-brand-600 text-xs">
                              <span>Adj:</span>
                              <span>+ Rp {adjustment.toLocaleString('id-ID')}</span>
                           </div>
                        )}
                    </div>
                    <div className="text-right">
                       <span className="text-xs text-gray-500 block">Total Bayar</span>
                       <span className="text-xl font-bold text-brand-700">Rp {currentTotal.toLocaleString('id-ID')}</span>
                    </div>
                 </div>

                 <Button 
                    fullWidth 
                    onClick={() => handleSubmitOrder()}
                    disabled={Object.keys(currentOrderItems).length === 0}
                    className="py-3 text-lg font-bold shadow-md"
                 >
                    Simpan Pesanan
                 </Button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderOrderList = () => {
    const filteredOrders = orders.filter(o => {
      const sessionMatch = selectedSessionFilter === 'ALL' || o.sessionId === selectedSessionFilter;
      const paymentMatch = paymentStatusFilter === 'ALL' 
        ? true 
        : paymentStatusFilter === 'PAID' ? o.isPaid : !o.isPaid;
      
      return sessionMatch && paymentMatch;
    });

    return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Riwayat Pesanan</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <FunnelIcon className="w-5 h-5 text-gray-500 hidden md:block" />
              <select
                  value={selectedSessionFilter}
                  onChange={(e) => setSelectedSessionFilter(e.target.value)}
                  className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-[#E2E2E2]"
              >
                  <option value="ALL">Semua Sesi</option>
                  {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                          {s.name} ({s.status === 'OPEN' ? 'Buka' : 'Tutup'})
                      </option>
                  ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
               <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                  className="w-full md:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-[#E2E2E2]"
               >
                  <option value="ALL">Semua Status</option>
                  <option value="UNPAID">Belum Bayar</option>
                  <option value="PAID">Lunas</option>
               </select>
            </div>

            {orders.length > 0 && (
                <Button variant="outline" onClick={() => { if(window.confirm('Hapus semua data?')) setOrders([]) }}>Reset</Button>
            )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Pembeli</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dari</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Penyesuaian</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Bayar</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PEMBAYARAN</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TANGGAL BAYAR</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
               <tr>
                <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                    {orders.length === 0 
                      ? "Belum ada pesanan." 
                      : "Tidak ada pesanan dengan filter ini."}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{new Date(order.timestamp).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
                      <span className="text-[10px] text-gray-400">{new Date(order.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.source || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      {order.items.map((i, idx) => (
                        <li key={idx}>{i.menuName} (x{i.quantity})</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">
                    {order.note || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {order.adjustmentAmount ? `+ Rp ${order.adjustmentAmount.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-brand-600">
                    Rp {order.totalPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => handleTogglePaymentStatus(order.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        order.isPaid 
                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                        : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
                      }`}
                    >
                       {order.isPaid ? 'LUNAS' : 'BELUM BAYAR'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {order.isPaid ? (
                        <select
                        value={order.paymentMethod || ''}
                        onChange={(e) => handleUpdatePaymentMethod(order.id, e.target.value)}
                        className="block w-full text-xs border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 rounded-md border bg-white py-1.5 pl-2 pr-8"
                        style={{ minWidth: '110px' }}
                        >
                        <option value="" disabled className="text-gray-400">Pilih...</option>
                        <option value="CASH">CASH</option>
                        <option value="TF BNI">TF BNI</option>
                        <option value="TF BSI">TF BSI</option>
                        <option value="TF DKI">TF DKI</option>
                        <option value="TF JAGO">TF JAGO</option>
                        <option value="TF MANDIRI">TF MANDIRI</option>
                        </select>
                    ) : (
                        <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {order.isPaid ? (
                        <input 
                          type="datetime-local"
                          value={order.paymentDate ? new Date(order.paymentDate - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleUpdatePaymentDate(order.id, e.target.value)}
                          className="block w-full text-xs border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 rounded-md border bg-white py-1.5 px-2"
                        />
                    ) : (
                        <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

  const renderBalance = () => {
    const filteredOrders = orders.filter(o => 
      selectedSessionFilter === 'ALL' || o.sessionId === selectedSessionFilter
    );

    const paidOrders = filteredOrders.filter(o => o.isPaid);

    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const totalTransactions = paidOrders.length;

    const cashOrders = paidOrders.filter(o => o.paymentMethod === 'CASH');
    const cashTotal = cashOrders.reduce((acc, o) => acc + o.totalPrice, 0);

    const transferOrders = paidOrders.filter(o => o.paymentMethod && o.paymentMethod !== 'CASH');
    const transferTotal = transferOrders.reduce((acc, o) => acc + o.totalPrice, 0);

    const transferBreakdown = transferOrders.reduce((acc, o) => {
       const method = o.paymentMethod || 'Unknown';
       if (!acc[method]) acc[method] = 0;
       acc[method] += o.totalPrice;
       return acc;
    }, {} as {[key: string]: number});

    return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Rekap Keuangan (Balance)</h2>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
              <FunnelIcon className="w-5 h-5 text-gray-500 hidden md:block" />
              <select
                  value={selectedSessionFilter}
                  onChange={(e) => setSelectedSessionFilter(e.target.value)}
                  className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-[#E2E2E2]"
              >
                  <option value="ALL">Semua Riwayat</option>
                  {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                          {s.name} ({s.status === 'OPEN' ? 'Buka' : 'Tutup'})
                      </option>
                  ))}
              </select>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-brand-600 to-brand-700 text-white border-none">
           <div className="flex items-center justify-between">
              <div>
                 <p className="text-white/80 font-medium mb-1">Total Pendapatan Bersih (Lunas)</p>
                 <h3 className="text-4xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
                 <p className="mt-2 text-sm bg-white/20 inline-block px-3 py-1 rounded-full">{totalTransactions} Transaksi Lunas</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                 <BanknotesIcon className="w-10 h-10 text-white" />
              </div>
           </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="bg-white border-l-4 border-orange-400">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-orange-100 rounded-lg">
                    <WalletIcon className="w-6 h-6 text-orange-600" />
                 </div>
                 <Badge color="gray">{cashOrders.length} Transaksi</Badge>
              </div>
              <h4 className="text-gray-500 font-medium text-sm uppercase">Pembayaran Tunai (CASH)</h4>
              <p className="text-2xl font-bold text-gray-900 mt-1">Rp {cashTotal.toLocaleString('id-ID')}</p>
           </Card>

           <Card className="bg-white border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCardIcon className="w-6 h-6 text-blue-600" />
                 </div>
                 <Badge color="gray">{transferOrders.length} Transaksi</Badge>
              </div>
              <h4 className="text-gray-500 font-medium text-sm uppercase">Pembayaran Transfer</h4>
              <p className="text-2xl font-bold text-gray-900 mt-1">Rp {transferTotal.toLocaleString('id-ID')}</p>
           </Card>
        </div>

        {Object.keys(transferBreakdown).length > 0 && (
          <div className="mt-4">
             <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Rincian Transfer Bank</h3>
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                   <tbody className="divide-y divide-gray-100">
                      {Object.entries(transferBreakdown).map(([bank, amount]) => (
                         <tr key={bank} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{bank}</td>
                            <td className="px-6 py-4 text-sm text-right text-gray-600">Rp {amount.toLocaleString('id-ID')}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderMarketing = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <SparklesIcon className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Asisten Marketing AI</h2>
        <p className="text-gray-500">Buat caption promosi otomatis berdasarkan menu dan stok Anda saat ini.</p>
      </div>

      <Card className="text-center p-8 bg-indigo-50 border-indigo-100">
        {menu.filter(m => m.isActive).length === 0 ? (
          <p className="text-red-500">Tidak ada menu aktif. Silakan aktifkan menu terlebih dahulu.</p>
        ) : (
          <div className="space-y-4">
             <p className="text-sm text-gray-600">AI akan membaca {menu.filter(m => m.isActive).length} menu aktif Anda dan membuatkan broadcast message WhatsApp.</p>
             <Button 
              onClick={() => handleGenerateMarketing()} 
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
            >
              {isGenerating ? 'Sedang Berpikir...' : 'Buat Caption Sekarang'}
            </Button>
          </div>
        )}
      </Card>

      {marketingText && (
        <Card className="relative group">
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => handleCopyMarketingText()}
              className="p-2 text-gray-400 hover:text-brand-600 bg-white rounded-full shadow-sm border border-gray-200"
              title="Salin Teks"
            >
              <ClipboardDocumentListIcon className="w-5 h-5" />
            </button>
          </div>
          <h3 className="font-bold text-gray-700 mb-2">Hasil:</h3>
          <div className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-800 font-mono border border-gray-200">
            {marketingText}
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-20">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LogoIcon />
            <h1 className="text-lg font-bold text-gray-900">BekuAlitas PO</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.t}
              onClick={() => handleTabChange(item.t)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.t 
                  ? 'bg-brand-50 text-brand-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.i className={`w-5 h-5 mr-3 ${activeTab === item.t ? 'text-brand-600' : 'text-gray-400'}`} />
              {item.l}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Status PO:</p>
            <div className="flex items-center mt-1">
              <span className={`w-2 h-2 rounded-full mr-2 ${isPOOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-semibold text-sm">{isPOOpen ? 'Sedang Buka' : 'Tutup'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-30">
           <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1 -ml-1 text-gray-500 hover:text-brand-600 focus:outline-none"
            >
                <Bars3Icon className="w-8 h-8" />
            </button>
            
            <div className="flex items-center gap-2">
                <LogoIcon />
                <h1 className="text-lg font-bold text-gray-900">BekuAlitas PO</h1>
            </div>
          </div>
           <Badge color={isPOOpen ? 'green' : 'red'}>{isPOOpen ? 'BUKA' : 'TUTUP'}</Badge>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
                
                {/* Sidebar Drawer */}
                <div className="relative bg-white w-64 max-w-xs h-full shadow-2xl flex flex-col transform transition-transform animate-slide-in-left">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <LogoIcon />
                            <h1 className="text-lg font-bold text-gray-900">BekuAlitas</h1>
                        </div>
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map(item => (
                            <button
                                key={item.t}
                                onClick={() => { 
                                    handleTabChange(item.t); 
                                    setIsMobileMenuOpen(false); 
                                }}
                                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                    activeTab === item.t 
                                    ? 'bg-brand-50 text-brand-700' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <item.i className={`w-5 h-5 mr-3 ${activeTab === item.t ? 'text-brand-600' : 'text-gray-400'}`} />
                                {item.l}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Status PO:</p>
                            <div className="flex items-center mt-1">
                            <span className={`w-2 h-2 rounded-full mr-2 ${isPOOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="font-semibold text-sm">{isPOOpen ? 'Sedang Buka' : 'Tutup'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === Tab.DASHBOARD && renderDashboard()}
        {activeTab === Tab.MENU && renderMenu()}
        {activeTab === Tab.RECIPES && renderRecipes()}
        {activeTab === Tab.INGREDIENTS && renderIngredients()}
        {activeTab === Tab.ORDER_ENTRY && renderOrderEntry()}
        {activeTab === Tab.ORDER_LIST && renderOrderList()}
        {activeTab === Tab.BALANCE && renderBalance()}
        {activeTab === Tab.MARKETING && renderMarketing()}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-40 flex justify-between shadow-lg">
        <NavItem tab={Tab.DASHBOARD} label="Home" icon={ChartBarIcon} isActive={activeTab === Tab.DASHBOARD} onTabSelect={handleTabChange} />
        <NavItem tab={Tab.MENU} label="Menu" icon={ClipboardDocumentListIcon} isActive={activeTab === Tab.MENU} onTabSelect={handleTabChange} />
        <NavItem tab={Tab.ORDER_ENTRY} label="Catat" icon={PlusCircleIcon} isActive={activeTab === Tab.ORDER_ENTRY} onTabSelect={handleTabChange} />
        <NavItem tab={Tab.ORDER_LIST} label="Order" icon={ShoppingBagIcon} isActive={activeTab === Tab.ORDER_LIST} onTabSelect={handleTabChange} />
        <NavItem tab={Tab.BALANCE} label="Balance" icon={WalletIcon} isActive={activeTab === Tab.BALANCE} onTabSelect={handleTabChange} />
        <NavItem tab={Tab.RECIPES} label="Resep" icon={BookOpenIcon} isActive={activeTab === Tab.RECIPES} onTabSelect={handleTabChange} />
      </div>
    </div>
  );
}
