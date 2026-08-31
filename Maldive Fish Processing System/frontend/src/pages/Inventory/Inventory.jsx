import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Layers,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  QrCode,
  CheckCircle,
  Clock,
  Flame,
  Droplets,
  Scale,
  Sparkles,
  Printer,
  ChevronRight,
  Package,
  Fish,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import inventoryService from '../../services/inventoryService';

const CATEGORY_LABELS = {
  ALL: 'All Inventory',
  RAW_FISH: 'Raw Fish',
  SALT: 'Salt & Brine',
  FINISHED_MALDIVE_FISH: 'Finished Maldive Fish',
  PACKAGING: 'Packaging Supplies',
  BY_PRODUCT: 'By-Products (Rihaakuru)',
  CONSUMABLE: 'Consumables',
  FUEL: 'Fuel & Energy',
};

const STAGE_CONFIG = {
  RAW_RECEIVED: { label: 'Raw Fish Intake', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Fish, step: 1 },
  CLEANED: { label: 'Cleaned & Dressed', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: Scale, step: 2 },
  BOILED: { label: 'Boiled & Salted', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Flame, step: 3 },
  DRYING: { label: 'Drying Chamber', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Droplets, step: 4 },
  QUALITY_GRADED: { label: 'AI Graded', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Sparkles, step: 5 },
  PACKAGED: { label: 'Packaged & Ready', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, step: 6 },
  COMPLETED: { label: 'Archived / Dispatched', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Package, step: 7 },
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'batches' | 'transactions' | 'analytics'
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);

  // Form States
  const [transactionForm, setTransactionForm] = useState({
    itemSku: '',
    transactionType: 'STOCK_IN',
    quantity: '',
    reason: '',
    referenceInvoice: '',
    performedBy: 'Production Supervisor',
  });

  const [batchForm, setBatchForm] = useState({
    batchCode: `MF-BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    fishType: 'Skipjack Tuna (Balaya)',
    supplier: 'Local Harbor Catch',
    initialRawWeightKg: '150',
    saltUsedKg: '18',
    rawSku: 'RAW-TUNA-01',
    saltSku: 'SALT-SEA-01',
    performedBy: 'Production Supervisor',
    notes: '',
  });

  const [advanceForm, setAdvanceForm] = useState({
    nextStatus: 'BOILED',
    currentMoisture: 45,
    gradeA_Kg: '28',
    gradeB_Kg: '8',
    gradeC_Kg: '4',
    rihaakuruLiters: '5',
    creditFinishedStock: true,
    notes: '',
  });

  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [sumRes, itemsRes, batchesRes, transRes] = await Promise.all([
        inventoryService.getSummary(),
        inventoryService.getItems(),
        inventoryService.getBatches(),
        inventoryService.getTransactions(),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (itemsRes.data.success) setItems(itemsRes.data.data);
      if (batchesRes.data.success) setBatches(batchesRes.data.data);
      if (transRes.data.success) setTransactions(transRes.data.data);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      showToast('Error loading inventory data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchTerm]);

  // Handle Stock Transaction Submit
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await inventoryService.recordTransaction(transactionForm);
      if (res.data.success) {
        showToast(`Stock updated successfully! New level: ${res.data.data.item.currentStock} ${res.data.data.item.unit}`);
        setShowStockInModal(false);
        setShowStockOutModal(false);
        setTransactionForm({
          itemSku: '',
          transactionType: 'STOCK_IN',
          quantity: '',
          reason: '',
          referenceInvoice: '',
          performedBy: 'Production Supervisor',
        });
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Transaction failed', 'error');
    }
  };

  // Handle New Batch Submit
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await inventoryService.createBatch(batchForm);
      if (res.data.success) {
        showToast(`Production Batch ${batchForm.batchCode} started!`);
        setShowNewBatchModal(false);
        setBatchForm({
          batchCode: `MF-BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
          fishType: 'Skipjack Tuna (Balaya)',
          supplier: 'Local Harbor Catch',
          initialRawWeightKg: '150',
          saltUsedKg: '18',
          rawSku: 'RAW-TUNA-01',
          saltSku: 'SALT-SEA-01',
          performedBy: 'Production Supervisor',
          notes: '',
        });
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start batch', 'error');
    }
  };

  // Handle Advance Batch Stage
  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      const payload = {
        nextStatus: advanceForm.nextStatus,
        currentMoisture: advanceForm.currentMoisture,
        notes: advanceForm.notes,
        creditFinishedStock: advanceForm.creditFinishedStock,
        finalYield: {
          gradeA_Kg: advanceForm.gradeA_Kg,
          gradeB_Kg: advanceForm.gradeB_Kg,
          gradeC_Kg: advanceForm.gradeC_Kg,
          rihaakuruLiters: advanceForm.rihaakuruLiters,
        },
      };

      const res = await inventoryService.advanceBatch(selectedBatch._id, payload);
      if (res.data.success) {
        showToast(`Batch ${selectedBatch.batchCode} advanced to ${advanceForm.nextStatus}`);
        setShowAdvanceModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to advance batch', 'error');
    }
  };

  const openAdvanceModal = (batch) => {
    setSelectedBatch(batch);
    let nextStage = 'BOILED';
    let moisture = 45;
    if (batch.status === 'RAW_RECEIVED') nextStage = 'CLEANED';
    else if (batch.status === 'CLEANED') nextStage = 'BOILED';
    else if (batch.status === 'BOILED') nextStage = 'DRYING';
    else if (batch.status === 'DRYING') {
      nextStage = 'QUALITY_GRADED';
      moisture = 11.8;
    } else if (batch.status === 'QUALITY_GRADED') nextStage = 'PACKAGED';

    setAdvanceForm({
      nextStatus: nextStage,
      currentMoisture: moisture,
      gradeA_Kg: Math.round(batch.initialRawWeightKg * 0.12),
      gradeB_Kg: Math.round(batch.initialRawWeightKg * 0.05),
      gradeC_Kg: Math.round(batch.initialRawWeightKg * 0.02),
      rihaakuruLiters: Math.round(batch.initialRawWeightKg * 0.04),
      creditFinishedStock: true,
      notes: '',
    });
    setShowAdvanceModal(true);
  };

  const openTraceModal = (batch) => {
    setSelectedBatch(batch);
    setShowTraceModal(true);
  };

  // Stock Distribution Data for chart
  const stockDistribution = useMemo(() => {
    return [
      { name: 'Raw Fish', value: summary?.rawFishStockKg || 0, unit: 'kg' },
      { name: 'Sea Salt', value: summary?.saltStockKg || 0, unit: 'kg' },
      { name: 'Finished Maldive Fish', value: summary?.finishedMaldiveFishKg || 0, unit: 'kg' },
    ];
  }, [summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading Maldive Fish Inventory & Production Batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-xl border flex items-center gap-3 transition-all duration-300 ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          )}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Maldive Fish Inventory & Batch Pipeline
              </h1>
              <p className="text-sm text-slate-500">
                End-to-end stock control, raw material allocation, and yield traceability
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setTransactionForm({
                itemSku: items[0]?.sku || '',
                transactionType: 'STOCK_IN',
                quantity: '',
                reason: 'Supplier Catch Receipt',
                referenceInvoice: '',
                performedBy: 'Production Supervisor',
              });
              setShowStockInModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Receive Stock (In)
          </button>

          <button
            onClick={() => {
              setTransactionForm({
                itemSku: items.find((i) => i.category === 'FINISHED_MALDIVE_FISH')?.sku || items[0]?.sku || '',
                transactionType: 'STOCK_OUT',
                quantity: '',
                reason: 'Customer Export Dispatch',
                referenceInvoice: '',
                performedBy: 'Sales Supervisor',
              });
              setShowStockOutModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Dispatch / Stock Out
          </button>

          <button
            onClick={() => setShowNewBatchModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start New Batch
          </button>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Raw Fish Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Raw Tuna Stock</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Fish className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{summary?.rawFishStockKg || 0}</span>
            <span className="text-sm font-medium text-slate-500">kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Skipjack & Yellowfin</span>
            <span className="font-semibold text-blue-600">Cold Room 1</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.min(100, ((summary?.rawFishStockKg || 0) / 1000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Sea Salt Reserves */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Processing Salt</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{summary?.saltStockKg || 0}</span>
            <span className="text-sm font-medium text-slate-500">kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Coarse Solar Salt</span>
            <span className="font-semibold text-cyan-600">Dry Storage</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-600 h-full rounded-full"
              style={{ width: `${Math.min(100, ((summary?.saltStockKg || 0) / 500) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Finished Maldive Fish */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dried Maldive Fish</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{summary?.finishedMaldiveFishKg || 0}</span>
            <span className="text-sm font-medium text-slate-500">kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Grade A, B & C Stock</span>
            <span className="font-semibold text-emerald-600">Dehumidified</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${Math.min(100, ((summary?.finishedMaldiveFishKg || 0) / 300) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Active Batches in WIP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">WIP Active Batches</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{summary?.activeBatchesCount || 0}</span>
            <span className="text-sm font-medium text-slate-500">in pipeline</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Boiling / Drying</span>
            <span className="font-semibold text-purple-600">Live Stages</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Card 5: Production Yield Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Yield</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{summary?.avgYieldPercentage || 18.5}%</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Raw $\rightarrow$ Maldive Fish</span>
            <span className="font-semibold text-amber-600">Target 18-20%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, ((summary?.avgYieldPercentage || 18.5) / 25) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner (If Any) */}
      {summary?.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {summary.lowStockCount} item{summary.lowStockCount > 1 ? 's are' : ' is'} below minimum reorder level:
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {summary.lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setActiveTab('overview');
            }}
            className="text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Catalog
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Stock Catalog ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'batches'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          WIP Batch Pipeline ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'transactions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Movement & Audit Log
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Yield & Stock Analytics
        </button>
      </div>

      {/* TAB 1: STOCK CATALOG OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by SKU, item name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === catKey
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {catLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Item & SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Reorder Level</th>
                    <th className="py-3.5 px-4">Est. Unit Value</th>
                    <th className="py-3.5 px-4">Storage Location</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No inventory items found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = item.currentStock <= item.reorderLevel;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {CATEGORY_LABELS[item.category] || item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 text-base">{item.currentStock}</span>{' '}
                            <span className="text-xs text-slate-500">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {item.reorderLevel} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {item.unitCost ? `Rs. ${item.unitCost.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {item.storageLocation}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> Optimal
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setTransactionForm({
                                  itemSku: item.sku,
                                  transactionType: 'STOCK_IN',
                                  quantity: '',
                                  reason: 'Restock / Delivery',
                                  referenceInvoice: '',
                                  performedBy: 'Supervisor',
                                });
                                setShowStockInModal(true);
                              }}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WIP PRODUCTION BATCH PIPELINE */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((batch) => {
              const stageInfo = STAGE_CONFIG[batch.status] || STAGE_CONFIG.RAW_RECEIVED;
              const StageIcon = stageInfo.icon;
              const isFinished = ['QUALITY_GRADED', 'PACKAGED', 'COMPLETED'].includes(batch.status);

              return (
                <div
                  key={batch._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-800">{batch.batchCode}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stageInfo.color}`}
                    >
                      <StageIcon className="w-3.5 h-3.5" />
                      {stageInfo.label}
                    </span>
                  </div>

                  {/* Fish & Origin */}
                  <div className="text-sm">
                    <div className="font-medium text-slate-800">{batch.fishType}</div>
                    <div className="text-xs text-slate-500">Source: {batch.supplier}</div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block">Initial Weight</span>
                      <span className="font-bold text-slate-800 text-sm">{batch.initialRawWeightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Salt Consumed</span>
                      <span className="font-bold text-slate-800 text-sm">{batch.saltUsedKg || 0} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Moisture Content</span>
                      <span
                        className={`font-bold text-sm ${
                          batch.currentMoisturePercentage <= 15 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {batch.currentMoisturePercentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Final Yield %</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {batch.finalYield?.yieldPercentage ? `${batch.finalYield.yieldPercentage}%` : 'In Progress'}
                      </span>
                    </div>
                  </div>

                  {/* Finished Yield Breakdown (If Graded) */}
                  {batch.finalYield?.totalOutputKg > 0 && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                      <div className="font-semibold text-emerald-900 flex items-center justify-between">
                        <span>Output Yield:</span>
                        <span>{batch.finalYield.totalOutputKg} kg Maldive Fish</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 text-[11px]">
                        <span>Grade A: {batch.finalYield.gradeA_Kg} kg</span>
                        <span>Grade B: {batch.finalYield.gradeB_Kg} kg</span>
                        <span>Grade C: {batch.finalYield.gradeC_Kg} kg</span>
                      </div>
                      {batch.finalYield.rihaakuruLiters > 0 && (
                        <div className="text-[11px] text-emerald-700">
                          Rihaakuru Extract: {batch.finalYield.rihaakuruLiters} L
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openTraceModal(batch)}
                      className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Trace & QR
                    </button>

                    {!['PACKAGED', 'COMPLETED'].includes(batch.status) && (
                      <button
                        onClick={() => openAdvanceModal(batch)}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        Advance Stage <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK TRANSACTIONS & AUDIT LOG */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Stock Movement History & Audit Log
            </h3>
            <span className="text-xs text-slate-500">{transactions.length} recent transactions recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Batch / Invoice</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Stock Transition</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    let typeBadge = 'bg-slate-100 text-slate-700';
                    let sign = '';
                    if (tx.transactionType === 'STOCK_IN' || tx.transactionType === 'PRODUCTION_YIELD') {
                      typeBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                      sign = '+';
                    } else if (tx.transactionType === 'STOCK_OUT' || tx.transactionType === 'WIP_USAGE') {
                      typeBadge = 'bg-rose-50 text-rose-700 border border-rose-200';
                      sign = '-';
                    }

                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeBadge}`}>
                            {tx.transactionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{tx.itemName}</div>
                          <div className="text-xs text-slate-400 font-mono">{tx.itemSku}</div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600">
                          {tx.batchCode || tx.referenceInvoice || '-'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {sign}
                          {tx.quantity} {tx.unit}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {tx.previousStock} $\rightarrow$ <span className="font-semibold text-slate-800">{tx.newStock}</span> {tx.unit}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                          {tx.reason || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700">
                          {tx.performedBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & YIELD CHARTS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Stock Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Current Material Reserves</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis unit=" kg" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span>Raw Tuna: <b>{summary?.rawFishStockKg} kg</b></span>
              <span>Processing Salt: <b>{summary?.saltStockKg} kg</b></span>
              <span>Dried Maldive Fish: <b>{summary?.finishedMaldiveFishKg} kg</b></span>
            </div>
          </div>

          {/* Chart 2: Yield Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Standard Maldive Fish Transformation Yield</h3>
            <p className="text-xs text-slate-500">
              For every 100 kg of fresh Skipjack Tuna, standard processing yields approximately 18-20 kg of Grade A/B/C finished product.
            </p>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Grade A Premium Maldive Fish', value: 12 },
                      { name: 'Grade B Standard', value: 5 },
                      { name: 'Grade C Cooking Flakes', value: 2 },
                      { name: 'Rihaakuru Extract', value: 4 },
                      { name: 'Moisture Evaporation Loss', value: 57 },
                      { name: 'Dressed / Guts Offal', value: 20 },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {PIE_COLORS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 1: STOCK IN / RECEIVE
      ───────────────────────────────────────────── */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                Receive Inventory (Stock In)
              </h3>
              <button
                onClick={() => setShowStockInModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item *</label>
                <select
                  value={transactionForm.itemSku}
                  onChange={(e) => setTransactionForm({ ...transactionForm, itemSku: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose Inventory Item --</option>
                  {items.map((i) => (
                    <option key={i.sku} value={i.sku}>
                      {i.name} ({i.sku}) - Current: {i.currentStock} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Add *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 200"
                    value={transactionForm.quantity}
                    onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice / PO Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-8821"
                    value={transactionForm.referenceInvoice}
                    onChange={(e) => setTransactionForm({ ...transactionForm, referenceInvoice: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Supplier Info</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh catch batch from Harbor supplier"
                  value={transactionForm.reason}
                  onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm"
                >
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 2: STOCK OUT / DISPATCH
      ───────────────────────────────────────────── */}
      {showStockOutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                Dispatch / Stock Out
              </h3>
              <button
                onClick={() => setShowStockOutModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item *</label>
                <select
                  value={transactionForm.itemSku}
                  onChange={(e) => setTransactionForm({ ...transactionForm, itemSku: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose Inventory Item --</option>
                  {items.map((i) => (
                    <option key={i.sku} value={i.sku}>
                      {i.name} ({i.sku}) - Available: {i.currentStock} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Dispatch *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50"
                    value={transactionForm.quantity}
                    onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Order / Invoice</label>
                  <input
                    type="text"
                    placeholder="e.g. EXPORT-2026-09"
                    value={transactionForm.referenceInvoice}
                    onChange={(e) => setTransactionForm({ ...transactionForm, referenceInvoice: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Dispatch Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Wholesale Export Merchant Colombo"
                  value={transactionForm.reason}
                  onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockOutModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs shadow-sm"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 3: START PRODUCTION BATCH
      ───────────────────────────────────────────── */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-blue-600" />
                Launch New Production Batch
              </h3>
              <button
                onClick={() => setShowNewBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Code *</label>
                  <input
                    type="text"
                    value={batchForm.batchCode}
                    onChange={(e) => setBatchForm({ ...batchForm, batchCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fish Species</label>
                  <input
                    type="text"
                    value={batchForm.fishType}
                    onChange={(e) => setBatchForm({ ...batchForm, fishType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Raw Tuna Intake (kg) *</label>
                  <input
                    type="number"
                    value={batchForm.initialRawWeightKg}
                    onChange={(e) => setBatchForm({ ...batchForm, initialRawWeightKg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salt Allocation (kg)</label>
                  <input
                    type="number"
                    value={batchForm.saltUsedKg}
                    onChange={(e) => setBatchForm({ ...batchForm, saltUsedKg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catch Supplier / Harbor</label>
                <input
                  type="text"
                  value={batchForm.supplier}
                  onChange={(e) => setBatchForm({ ...batchForm, supplier: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                <div className="font-semibold">⚡ Auto Stock Deduction:</div>
                <p>
                  Creating this batch will automatically deduct <b>{batchForm.initialRawWeightKg} kg</b> from Raw Fish inventory and <b>{batchForm.saltUsedKg} kg</b> from Sea Salt inventory.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-sm"
                >
                  Start Batch & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 4: ADVANCE BATCH STAGE & YIELD
      ───────────────────────────────────────────── */}
      {showAdvanceModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Advance Batch: {selectedBatch.batchCode}
                </h3>
                <p className="text-xs text-slate-500">Current Status: {selectedBatch.status}</p>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdvanceSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Stage *</label>
                <select
                  value={advanceForm.nextStatus}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, nextStatus: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="CLEANED">Cleaned & Dressed</option>
                  <option value="BOILED">Boiled & Salt Cooked</option>
                  <option value="DRYING">Drying Chamber (Solar/Indoor)</option>
                  <option value="QUALITY_GRADED">AI Quality Graded</option>
                  <option value="PACKAGED">Packaged & Ready for Dispatch</option>
                  <option value="COMPLETED">Completed & Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Moisture %</label>
                <input
                  type="number"
                  step="0.1"
                  value={advanceForm.currentMoisture}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, currentMoisture: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Yield Input If Quality Graded or Packaged */}
              {['QUALITY_GRADED', 'PACKAGED', 'COMPLETED'].includes(advanceForm.nextStatus) && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="font-semibold text-xs text-emerald-900">
                    🏆 Record AI Graded Yield Output:
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-medium text-emerald-800 block">Grade A (kg)</label>
                      <input
                        type="number"
                        value={advanceForm.gradeA_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeA_Kg: e.target.value })}
                        className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-emerald-800 block">Grade B (kg)</label>
                      <input
                        type="number"
                        value={advanceForm.gradeB_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeB_Kg: e.target.value })}
                        className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-emerald-800 block">Grade C (kg)</label>
                      <input
                        type="number"
                        value={advanceForm.gradeC_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeC_Kg: e.target.value })}
                        className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-emerald-800 block">Rihaakuru Extract (Liters)</label>
                    <input
                      type="number"
                      value={advanceForm.rihaakuruLiters}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, rihaakuruLiters: e.target.value })}
                      className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="creditStock"
                      checked={advanceForm.creditFinishedStock}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, creditFinishedStock: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="creditStock" className="text-xs text-emerald-900 font-medium">
                      Auto-credit these quantities to Finished Maldive Fish inventory
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stage Notes / Sensor Observations</label>
                <input
                  type="text"
                  placeholder="e.g. Moisture reached 11.5%. Dark mahogany surface verified."
                  value={advanceForm.notes}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-sm"
                >
                  Save & Update Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 5: BATCH TRACEABILITY & QR CERTIFICATE
      ───────────────────────────────────────────── */}
      {showTraceModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Digital Traceability Certificate</h3>
              </div>
              <button
                onClick={() => setShowTraceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Certificate Card Content */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-b from-slate-50/50 to-white space-y-4">
              <div className="text-center space-y-1">
                <div className="text-xs uppercase font-bold text-blue-600 tracking-wider">
                  Smart Maldive Fish Processing Verification
                </div>
                <h4 className="text-xl font-mono font-bold text-slate-900">{selectedBatch.batchCode}</h4>
                <p className="text-xs text-slate-500">Certified by IoT & AI Quality Engine</p>
              </div>

              {/* QR Code Placeholder Box */}
              <div className="w-32 h-32 mx-auto bg-white border-2 border-slate-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner">
                <QrCode className="w-20 h-20 text-slate-900" />
                <span className="text-[9px] font-mono text-slate-600 mt-1">{selectedBatch.batchCode}</span>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-3">
                <div>
                  <span className="text-slate-400 block">Species:</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.fishType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Catch Origin:</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.supplier}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Initial Weight:</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.initialRawWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Salt Optimization:</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.saltUsedKg} kg Sea Salt</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Drying Moisture:</span>
                  <span className="font-semibold text-emerald-600">{selectedBatch.currentMoisturePercentage}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Processing Status:</span>
                  <span className="font-semibold text-blue-600">{selectedBatch.status}</span>
                </div>
              </div>

              {selectedBatch.finalYield?.totalOutputKg > 0 && (
                <div className="bg-emerald-50 p-2.5 rounded-xl text-xs text-emerald-900 border border-emerald-200">
                  <div className="font-bold">Total Certified Yield: {selectedBatch.finalYield.totalOutputKg} kg</div>
                  <div className="text-[11px] text-emerald-700">
                    Grade A: {selectedBatch.finalYield.gradeA_Kg}kg | Grade B: {selectedBatch.finalYield.gradeB_Kg}kg | Yield Ratio: {selectedBatch.finalYield.yieldPercentage}%
                  </div>
                </div>
              )}
            </div>

            {/* Print / Export Button */}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Traceability Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
