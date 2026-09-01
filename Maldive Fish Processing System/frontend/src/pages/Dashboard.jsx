import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Flame,
  Truck,
  Users,
  Package,
  Layers,
  Sparkles,
  X,
  Coins,
  DollarSign,
  Scale,
  Fish,
  Building2
} from 'lucide-react';
import inventoryService from '../services/inventoryService';

const STAGE_CONFIG = {
  RAW_RECEIVED: { label: 'Raw Intake', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CLEANED: { label: 'Cleaned', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  BOILED: { label: 'Boiled & Brined', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DRYING: { label: 'Drying Chamber', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  QUALITY_GRADED: { label: 'AI Graded', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  PACKAGED: { label: 'Ready for Dispatch', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { label: 'Archived', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

// Itemized Cost & Profitability Calculator Engine
const computeFullEconomics = (
  rawWeightKg,
  totalRawFishCost,
  operationalCosts = {},
  finishedKg,
  targetSellingPricePerKg = 0
) => {
  const raw = Math.max(0, parseFloat(rawWeightKg) || 0);
  const rawCost = Math.max(0, parseFloat(totalRawFishCost) || 0);
  const finished = Math.max(0, parseFloat(finishedKg) || 0);
  const sellPrice = Math.max(0, parseFloat(targetSellingPricePerKg) || 0);

  const saltCost = Math.max(0, parseFloat(operationalCosts.saltCost) || 0);
  const firewoodGasCost = Math.max(0, parseFloat(operationalCosts.firewoodGasCost) || 0);
  const laborCost = Math.max(0, parseFloat(operationalCosts.laborCost) || 0);
  const transportCost = Math.max(0, parseFloat(operationalCosts.transportCost) || 0);
  const packagingCost = Math.max(0, parseFloat(operationalCosts.packagingCost) || 0);

  const totalOtherExpenses = saltCost + firewoodGasCost + laborCost + transportCost + packagingCost;
  const grandTotalCost = rawCost + totalOtherExpenses;

  const rawUnitPrice = raw > 0 ? rawCost / raw : 0;
  const weightLossKg = Math.max(0, raw - finished);
  const shrinkagePercent = raw > 0 ? (weightLossKg / raw) * 100 : 0;
  const yieldPercent = raw > 0 ? (finished / raw) * 100 : 0;

  // Evaporated moisture economic value
  const moistureLossValue = weightLossKg * rawUnitPrice;

  // True unit cost per 1kg of finished Maldive fish including overheads
  const actualCostPerKgDried = finished > 0 ? grandTotalCost / finished : 0;

  // Revenue & Net Profitability
  const totalRevenue = finished * sellPrice;
  const netProfitOrLoss = totalRevenue > 0 ? totalRevenue - grandTotalCost : 0;
  const marginPercent = totalRevenue > 0 ? (netProfitOrLoss / totalRevenue) * 100 : 0;

  return {
    raw,
    rawCost: Math.round(rawCost),
    rawUnitPrice: Math.round(rawUnitPrice),
    finished,
    otherExpenses: {
      saltCost,
      firewoodGasCost,
      laborCost,
      transportCost,
      packagingCost,
      totalOtherExpenses: Math.round(totalOtherExpenses)
    },
    grandTotalCost: Math.round(grandTotalCost),
    weightLossKg: weightLossKg.toFixed(1),
    shrinkagePercent: shrinkagePercent.toFixed(1),
    yieldPercent: yieldPercent.toFixed(1),
    moistureLossValue: Math.round(moistureLossValue),
    actualCostPerKgDried: Math.round(actualCostPerKgDried),
    totalRevenue: Math.round(totalRevenue),
    netProfitOrLoss: Math.round(netProfitOrLoss),
    marginPercent: marginPercent.toFixed(1),
    isCalculated: finished > 0
  };
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // New Batch Form State
  const [batchForm, setBatchForm] = useState({
    batchCode: `MF-BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    fishType: 'Skipjack Tuna (Balaya)',
    supplier: 'Local Harbor Catch',
    initialRawWeightKg: '100',
    totalRawCost: '104000',
    buyingPricePerKg: '1040',
    saltCost: '1200',
    firewoodGasCost: '2500',
    laborCost: '3000',
    transportCost: '1500',
    packagingCost: '800',
  });

  // Advance Stage Form State
  const [advanceForm, setAdvanceForm] = useState({
    nextStatus: 'QUALITY_GRADED',
    currentMoisture: 12.0,
    gradeA_Kg: '14',
    gradeB_Kg: '4',
    gradeC_Kg: '2',
    targetSellingPricePerKg: '6800',
    creditFinishedStock: true,
    notes: '',
  });

  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [sumRes, itemsRes, batchesRes] = await Promise.all([
        inventoryService.getSummary(),
        inventoryService.getItems(),
        inventoryService.getBatches(),
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (itemsRes.data?.success) setItems(itemsRes.data.data);
      if (batchesRes.data?.success) setBatches(batchesRes.data.data);
    } catch (err) {
      showToast('Error loading real-time inventory ledger', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form Auto-Calculators for Money Inputs
  const handleWeightChange = (val) => {
    const rawKg = parseFloat(val) || 0;
    const unitPrice = parseFloat(batchForm.buyingPricePerKg) || 0;
    setBatchForm({
      ...batchForm,
      initialRawWeightKg: val,
      totalRawCost: rawKg > 0 && unitPrice > 0 ? (rawKg * unitPrice).toString() : batchForm.totalRawCost
    });
  };

  const handleTotalCostChange = (val) => {
    const totalCost = parseFloat(val) || 0;
    const rawKg = parseFloat(batchForm.initialRawWeightKg) || 0;
    setBatchForm({
      ...batchForm,
      totalRawCost: val,
      buyingPricePerKg: rawKg > 0 ? Math.round(totalCost / rawKg).toString() : ''
    });
  };

  const handleUnitPriceChange = (val) => {
    const unitPrice = parseFloat(val) || 0;
    const rawKg = parseFloat(batchForm.initialRawWeightKg) || 0;
    setBatchForm({
      ...batchForm,
      buyingPricePerKg: val,
      totalRawCost: rawKg > 0 ? Math.round(rawKg * unitPrice).toString() : ''
    });
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await inventoryService.createBatch(batchForm);
      if (res.data?.success) {
        showToast(`Production batch ${batchForm.batchCode} started!`);
        setShowNewBatchModal(false);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to initialize production batch', 'error');
    }
  };

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
          targetSellingPricePerKg: advanceForm.targetSellingPricePerKg,
        },
      };

      const res = await inventoryService.advanceBatch(selectedBatch._id, payload);
      if (res.data?.success) {
        showToast(`Batch ${selectedBatch.batchCode} updated successfully.`);
        setShowAdvanceModal(false);
        fetchData();
      }
    } catch (err) {
      showToast('Error recording stage transition', 'error');
    }
  };

  const openAdvanceModal = (batch) => {
    setSelectedBatch(batch);
    let nextStage = 'BOILED';
    if (batch.status === 'RAW_RECEIVED') nextStage = 'CLEANED';
    else if (batch.status === 'CLEANED') nextStage = 'BOILED';
    else if (batch.status === 'BOILED') nextStage = 'DRYING';
    else if (batch.status === 'DRYING') nextStage = 'QUALITY_GRADED';
    else if (batch.status === 'QUALITY_GRADED') nextStage = 'PACKAGED';

    setAdvanceForm({
      nextStatus: nextStage,
      currentMoisture: 12.0,
      gradeA_Kg: Math.round(batch.initialRawWeightKg * 0.14),
      gradeB_Kg: Math.round(batch.initialRawWeightKg * 0.04),
      gradeC_Kg: Math.round(batch.initialRawWeightKg * 0.02),
      targetSellingPricePerKg: '6800',
      creditFinishedStock: true,
      notes: '',
    });
    setShowAdvanceModal(true);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/70 p-4 sm:p-8 space-y-6 font-sans text-slate-800 antialiased">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold transition-all ${notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
            <Coins className="w-3.5 h-3.5" /> Maldive Fish ERP & Yield Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Production Valuation & Shrinkage Loss Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Real-time batch costing, raw material allocation, overhead itemization, and net revenue modeling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewBatchModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Start New Batch
          </button>
          <button
            onClick={fetchData}
            className="p-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-600 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Status KPI Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Raw Fish Vault</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600"><Fish className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-slate-900">{summary?.rawFishStockKg !== undefined ? summary.rawFishStockKg : 0}</span>
            <span className="text-xs font-semibold text-slate-400">kg balance</span>
          </div>
          <span className="text-[11px] text-blue-600 font-semibold block mt-1">
            {summary?.totalFishScannedCount ? `Auto-synced: ${summary.totalFishScannedCount} Measured Fish` : 'Laser & Scale Synchronized'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Finished Stock</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600"><Package className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-emerald-600">{summary?.finishedMaldiveFishKg || 0}</span>
            <span className="text-xs font-semibold text-slate-400">kg dried</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">Ready for Retail & Export</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Shrinkage Loss Rate</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600"><TrendingDown className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-rose-600">
              {(100 - (summary?.avgYieldPercentage || 20)).toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-slate-400">avg. loss</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">Target Yield: 18 - 22%</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Active Pipeline</span>
            <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600"><Layers className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-purple-600">{summary?.activeBatchesCount || 0}</span>
            <span className="text-xs font-semibold text-slate-400">lots in WIP</span>
          </div>
          <span className="text-[11px] text-purple-700 font-semibold block mt-1">Live Drying & Cooking</span>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex gap-3 border-b border-slate-200/80 pb-1">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === 'pipeline' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
        >
          Active Production Lots & Valuation
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === 'inventory' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
        >
          Raw & Finished Stock Vault
        </button>
      </div>

      {/* TAB 1: PRODUCTION BATCHES WITH FULL SPREAD */}
      {activeTab === 'pipeline' && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {batches.map((batch) => {
            const rawKg = parseFloat(batch.initialRawWeightKg) || 0;
            const totalRawCost = parseFloat(batch.totalRawCost) || (rawKg * (parseFloat(batch.buyingPricePerKg) || 1040));
            const operationalCosts = {
              saltCost: batch.saltCost || 1200,
              firewoodGasCost: batch.firewoodGasCost || 2500,
              laborCost: batch.laborCost || 3000,
              transportCost: batch.transportCost || 1500,
              packagingCost: batch.packagingCost || 800,
            };

            const finishedKg = parseFloat(batch.finalYield?.totalOutputKg) || 0;
            const sellPrice = parseFloat(batch.finalYield?.targetSellingPricePerKg) || 6800;

            const econ = computeFullEconomics(rawKg, totalRawCost, operationalCosts, finishedKg, sellPrice);
            const stage = STAGE_CONFIG[batch.status] || STAGE_CONFIG.RAW_RECEIVED;

            return (
              <div key={batch._id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 hover:border-slate-300 transition">
                {/* Lot Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                      {batch.batchCode}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {batch.fishType}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>

                {/* Weight Transformation Grid */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-center items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Raw Intake</span>
                    <span className="text-lg font-black text-slate-900">{rawKg} kg</span>
                    <span className="text-[11px] font-bold text-blue-600 block">
                      Rs. {econ.rawCost.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">Drying</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Finished Output</span>
                    <span className="text-lg font-black text-emerald-600">{finishedKg > 0 ? `${finishedKg} kg` : 'Pending'}</span>
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      {econ.isCalculated ? `${econ.yieldPercent}% Yield` : 'In Progress'}
                    </span>
                  </div>
                </div>

                {/* Itemized Cost Breakdown Sheet */}
                <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span>Total Cost Breakdown:</span>
                    <span className="font-mono text-slate-900 font-extrabold text-sm">Rs. {econ.grandTotalCost.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                    <div>🐟 Raw Catch: <b>Rs. {econ.rawCost.toLocaleString()}</b></div>
                    <div>🧂 Salt: <b>Rs. {econ.otherExpenses.saltCost.toLocaleString()}</b></div>
                    <div>🔥 Gas/Wood: <b>Rs. {econ.otherExpenses.firewoodGasCost.toLocaleString()}</b></div>
                    <div>👷 Labor: <b>Rs. {econ.otherExpenses.laborCost.toLocaleString()}</b></div>
                    <div>🚚 Transport: <b>Rs. {econ.otherExpenses.transportCost.toLocaleString()}</b></div>
                    <div>📦 Packaging: <b>Rs. {econ.otherExpenses.packagingCost.toLocaleString()}</b></div>
                  </div>
                </div>

                {/* Financial Loss & Profitability Breakdown */}
                {econ.isCalculated ? (
                  <div className="space-y-2.5 pt-1">
                    {/* Shrinkage Loss Box */}
                    <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-rose-900">
                          <TrendingDown className="w-4 h-4 text-rose-600" />
                          Shrinkage & Evaporation Loss:
                        </div>
                        <span className="text-[11px] text-rose-700 font-medium">
                          Raw material lost value: <b>Rs. {econ.moistureLossValue.toLocaleString()}</b>
                        </span>
                      </div>
                      <div className="text-right font-bold text-rose-900">
                        <span className="text-base font-black">-{econ.weightLossKg} kg</span>
                        <span className="block text-[10px] text-rose-600 font-bold">({econ.shrinkagePercent}% Loss)</span>
                      </div>
                    </div>

                    {/* True Unit Cost of 1kg Dried & Net Profit */}
                    <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>True Cost Per 1kg Finished (Overheads Included):</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          Rs. {econ.actualCostPerKgDried.toLocaleString()} / kg
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-400 font-bold pt-2 border-t border-slate-800">
                        <span>Net Profit (@ Rs. {sellPrice.toLocaleString()}/kg):</span>
                        <span className="font-mono text-sm">
                          +Rs. {econ.netProfitOrLoss.toLocaleString()} ({econ.marginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Unit cost and margin breakdown will be computed upon AI quality grading.</span>
                  </div>
                )}

                {/* Advance Button */}
                {!['PACKAGED', 'COMPLETED'].includes(batch.status) && (
                  <button
                    onClick={() => openAdvanceModal(batch)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    Advance Stage & Record Yield <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: INVENTORY VAULT */}
      {activeTab === 'inventory' && (
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw lots, finished stock..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-4">Item Name & SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock Balance</th>
                <th className="p-4">Storage Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">{item.name}</td>
                  <td className="p-4 text-slate-500">{item.category}</td>
                  <td className="p-4 font-black text-slate-900">{item.currentStock} {item.unit}</td>
                  <td className="p-4 text-slate-500">{item.storageLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: CREATE BATCH WITH ITEMIZED COSTS */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Start New Production Batch</h3>
              <button onClick={() => setShowNewBatchModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700">Batch Code</label>
                <input
                  type="text"
                  value={batchForm.batchCode}
                  onChange={(e) => setBatchForm({ ...batchForm, batchCode: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold"
                  required
                />
              </div>

              {/* Raw Fish Pricing Box */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <span className="font-bold text-blue-900 block">🐟 1. Raw Catch Purchase:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={batchForm.initialRawWeightKg}
                      onChange={(e) => handleWeightChange(e.target.value)}
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl font-bold text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Total Cost (Rs.)</label>
                    <input
                      type="number"
                      value={batchForm.totalRawCost}
                      onChange={(e) => handleTotalCostChange(e.target.value)}
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl font-bold text-blue-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Price / kg (Rs.)</label>
                    <input
                      type="number"
                      value={batchForm.buyingPricePerKg}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl font-bold text-blue-700 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Other Itemized Expenses Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="font-bold text-slate-900 block">⚡ 2. Overhead & Operational Costs (Rs.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div>
                    <label className="text-slate-600 block mb-1">🧂 Salt</label>
                    <input
                      type="number"
                      value={batchForm.saltCost}
                      onChange={(e) => setBatchForm({ ...batchForm, saltCost: e.target.value })}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">🔥 Energy / Gas</label>
                    <input
                      type="number"
                      value={batchForm.firewoodGasCost}
                      onChange={(e) => setBatchForm({ ...batchForm, firewoodGasCost: e.target.value })}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">👷 Labor Wages</label>
                    <input
                      type="number"
                      value={batchForm.laborCost}
                      onChange={(e) => setBatchForm({ ...batchForm, laborCost: e.target.value })}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">🚚 Transport</label>
                    <input
                      type="number"
                      value={batchForm.transportCost}
                      onChange={(e) => setBatchForm({ ...batchForm, transportCost: e.target.value })}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">📦 Packaging</label>
                    <input
                      type="number"
                      value={batchForm.packagingCost}
                      onChange={(e) => setBatchForm({ ...batchForm, packagingCost: e.target.value })}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Total Committed Capital Preview */}
              {(() => {
                const rawTotal = parseFloat(batchForm.totalRawCost) || 0;
                const extraTotal = (parseFloat(batchForm.saltCost) || 0) +
                  (parseFloat(batchForm.firewoodGasCost) || 0) +
                  (parseFloat(batchForm.laborCost) || 0) +
                  (parseFloat(batchForm.transportCost) || 0) +
                  (parseFloat(batchForm.packagingCost) || 0);
                const grandTotal = rawTotal + extraTotal;

                return (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center text-xs font-semibold">
                    <span>Total Estimated Production Capital:</span>
                    <span className="font-black text-amber-400 font-mono text-sm">
                      Rs. {grandTotal.toLocaleString()}
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs"
                >
                  Initialize Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADVANCE & REAL-TIME COST/LOSS CALCULATION */}
      {showAdvanceModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Record Yield ({selectedBatch.batchCode})</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAdvanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700">Target Stage</label>
                <select
                  value={advanceForm.nextStatus}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, nextStatus: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                >
                  <option value="BOILED">Boiled & Brined</option>
                  <option value="DRYING">Drying Chamber</option>
                  <option value="QUALITY_GRADED">AI Quality Graded & Yield Logged</option>
                  <option value="PACKAGED">Packaged & Ready for Wholesale</option>
                </select>
              </div>

              {['QUALITY_GRADED', 'PACKAGED'].includes(advanceForm.nextStatus) && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <span className="font-bold text-emerald-900 block">Graded Finished Yield (kg):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">Grade A</span>
                      <input
                        type="number"
                        value={advanceForm.gradeA_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeA_Kg: e.target.value })}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-black text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">Grade B</span>
                      <input
                        type="number"
                        value={advanceForm.gradeB_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeB_Kg: e.target.value })}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-black text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block mb-1">Grade C</span>
                      <input
                        type="number"
                        value={advanceForm.gradeC_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeC_Kg: e.target.value })}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-black text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-emerald-900 block mb-1">Target Selling Price / kg (Rs.)</label>
                    <input
                      type="number"
                      value={advanceForm.targetSellingPricePerKg}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, targetSellingPricePerKg: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-black"
                    />
                  </div>

                  {/* Real-time Yield Cost Preview */}
                  {(() => {
                    const totalProduced = (parseFloat(advanceForm.gradeA_Kg) || 0) + (parseFloat(advanceForm.gradeB_Kg) || 0) + (parseFloat(advanceForm.gradeC_Kg) || 0);
                    const rawInitial = parseFloat(selectedBatch.initialRawWeightKg) || 0;
                    const totalCost = parseFloat(selectedBatch.totalRawCost) || (rawInitial * (parseFloat(selectedBatch.buyingPricePerKg) || 1040));
                    const operationalCosts = {
                      saltCost: selectedBatch.saltCost || 1200,
                      firewoodGasCost: selectedBatch.firewoodGasCost || 2500,
                      laborCost: selectedBatch.laborCost || 3000,
                      transportCost: selectedBatch.transportCost || 1500,
                      packagingCost: selectedBatch.packagingCost || 800,
                    };
                    const sell = parseFloat(advanceForm.targetSellingPricePerKg) || 6800;

                    const econ = computeFullEconomics(rawInitial, totalCost, operationalCosts, totalProduced, sell);

                    return (
                      <div className="pt-3 border-t border-emerald-200/80 space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-rose-700 font-bold">
                          <span>Evaporated Weight Loss:</span>
                          <span>-{econ.weightLossKg} kg ({econ.shrinkagePercent}%)</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-emerald-200">
                          <span>Actual Cost Per 1kg Finished:</span>
                          <span className="text-blue-700 font-mono">Rs. {econ.actualCostPerKgDried.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-emerald-800 font-bold">
                          <span>Projected Net Profit:</span>
                          <span>+Rs. {econ.netProfitOrLoss.toLocaleString()} ({econ.marginPercent}%)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs"
                >
                  Confirm & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;