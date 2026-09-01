import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
  X
} from 'lucide-react';
import inventoryService from '../services/inventoryService';

const STAGE_CONFIG = {
  RAW_RECEIVED: { label: 'අමු මාළු ලැබීම', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CLEANED: { label: 'සුද්ද කිරීම', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  BOILED: { label: 'තැම්බීම හා ලුණු දැමීම', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DRYING: { label: 'වේලීම (Drying)', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  QUALITY_GRADED: { label: 'AI තත්ත්ව පරීක්ෂාව', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  PACKAGED: { label: 'ඇසුරුම් කර අවසන්', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { label: 'නිකුත් කර ඇත', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

// Advanced Economics & Shrinkage Loss Engine
const computeEconomics = (rawWeightKg, totalRawCost, finishedKg, targetSellingPrice = 0) => {
  const raw = Math.max(0, parseFloat(rawWeightKg) || 0);
  const totalCost = Math.max(0, parseFloat(totalRawCost) || 0);
  const finished = Math.max(0, parseFloat(finishedKg) || 0);
  const sellPrice = Math.max(0, parseFloat(targetSellingPrice) || 0);

  const rawUnitPrice = raw > 0 ? totalCost / raw : 0;
  const weightLossKg = Math.max(0, raw - finished);
  const shrinkagePercent = raw > 0 ? (weightLossKg / raw) * 100 : 0;
  const yieldPercent = raw > 0 ? (finished / raw) * 100 : 0;

  // Actual evaporated monetary loss
  const moistureLossValue = weightLossKg * rawUnitPrice;

  // Real cost to produce 1kg of dried Maldive fish
  const trueCostPerKg = finished > 0 ? totalCost / finished : 0;

  // Potential Revenue & Net Profit
  const totalRevenue = finished * sellPrice;
  const netProfit = totalRevenue > 0 ? totalRevenue - totalCost : 0;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    raw,
    totalCost: Math.round(totalCost),
    rawUnitPrice: Math.round(rawUnitPrice),
    finished,
    weightLossKg: weightLossKg.toFixed(1),
    shrinkagePercent: shrinkagePercent.toFixed(1),
    yieldPercent: yieldPercent.toFixed(1),
    moistureLossValue: Math.round(moistureLossValue),
    trueCostPerKg: Math.round(trueCostPerKg),
    totalRevenue: Math.round(totalRevenue),
    netProfit: Math.round(netProfit),
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

  // New Batch Form State (Dual Money Entry)
  const [batchForm, setBatchForm] = useState({
    batchCode: `MF-BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    fishType: 'බලයා (Skipjack Tuna)',
    supplier: 'දේශීය වරාය / සැපයුම්කරු',
    initialRawWeightKg: '100',
    totalRawCost: '104000',     // Total purchase money for the catch
    buyingPricePerKg: '1040',    // Computed or entered 1kg price
  });

  // Advance Stage Form State
  const [advanceForm, setAdvanceForm] = useState({
    nextStatus: 'QUALITY_GRADED',
    currentMoisture: 12.0,
    gradeA_Kg: '14',
    gradeB_Kg: '4',
    gradeC_Kg: '2',
    targetSellingPricePerKg: '6200',
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
      showToast('දත්ත ලබා ගැනීමේ දෝෂයක්', 'error');
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
        showToast(`කාණ්ඩය ${batchForm.batchCode} ආරම්භ විය!`);
        setShowNewBatchModal(false);
        fetchData();
      }
    } catch (err) {
      showToast('කාණ්ඩය සෑදීම අසාර්ථකයි', 'error');
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
        showToast(`කාණ්ඩය සාර්ථකව යාවත්කාලීන විය`);
        setShowAdvanceModal(false);
        fetchData();
      }
    } catch (err) {
      showToast('යාවත්කාලීන කිරීම අසාර්ථකයි', 'error');
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
      targetSellingPricePerKg: '6200',
      creditFinishedStock: true,
      notes: '',
    });
    setShowAdvanceModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-slate-800 antialiased">
      
      {/* Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-semibold transition-all ${
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            Maldive Fish Cost ERP
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            උම්බලකඩ නිෂ්පාදන වියදම හා Loss ගණනය කිරීම
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            අමු මාළු ගත් මුදල, බර අඩුවීම (Shrinkage Loss) සහ නිමි උම්බලකඩ 1kg ක නියම පිරිවැය.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewBatchModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> අලුත් Batch එකක් (මුදල සමඟ)
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-400">අමු මාළු තොගය</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900">{summary?.rawFishStockKg || 0}</span>
            <span className="text-xs text-slate-500">kg</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-400">නිමි උම්බලකඩ</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-emerald-600">{summary?.finishedMaldiveFishKg || 0}</span>
            <span className="text-xs text-slate-500">kg</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-rose-500">සාමාන්‍ය බර අඩුවීම</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-rose-600">
              {(100 - (summary?.avgYieldPercentage || 20)).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">Loss</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-400">ක්‍රියාකාරී Batches</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-blue-600">{summary?.activeBatchesCount || 0}</span>
            <span className="text-xs text-slate-500">ක්‍රියාවලියේ</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeTab === 'pipeline' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Batches හා නිෂ්පාදන පිරිවැය
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeTab === 'inventory' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          තොග ලැයිස්තුව (Vault)
        </button>
      </div>

      {/* TAB 1: BATCH PIPELINE & ADVANCED LOSS CALCULATION */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {batches.map((batch) => {
            const rawKg = parseFloat(batch.initialRawWeightKg) || 0;
            const totalRawCost = parseFloat(batch.totalRawCost) || (rawKg * (parseFloat(batch.buyingPricePerKg) || 1040));
            const finishedKg = parseFloat(batch.finalYield?.totalOutputKg) || 0;
            const sellPrice = parseFloat(batch.finalYield?.targetSellingPricePerKg) || 6200;

            const econ = computeEconomics(rawKg, totalRawCost, finishedKg, sellPrice);
            const stage = STAGE_CONFIG[batch.status] || STAGE_CONFIG.RAW_RECEIVED;

            return (
              <div key={batch._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 hover:border-slate-300 transition">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {batch.batchCode}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {batch.fishType}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>

                {/* 🌟 3-Step Weight & Cost Flow */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-center items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">අමු මාළු බර</span>
                    <span className="text-base font-bold text-slate-900">{rawKg} kg</span>
                    <span className="text-[10px] font-semibold text-blue-600 block">
                      රු. {econ.totalCost.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 block">(@ Rs. {econ.rawUnitPrice}/kg)</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 mt-1">Drying</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-600 block">නිමි උම්බලකඩ</span>
                    <span className="text-base font-bold text-emerald-600">{finishedKg > 0 ? `${finishedKg} kg` : 'මැන නැත'}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 block">
                      {econ.isCalculated ? `${econ.yieldPercent}% Output` : 'ක්‍රියාවලියේ'}
                    </span>
                  </div>
                </div>

                {/* 🌟 FINANCIAL LOSS & MARGIN SUMMARY */}
                {econ.isCalculated ? (
                  <div className="space-y-2 pt-1">
                    {/* Loss Box */}
                    <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1 font-bold text-rose-900">
                          <TrendingDown className="w-4 h-4 text-rose-600" />
                          වියලීමේදී අඩුවූ බර (Loss):
                        </div>
                        <span className="text-[11px] text-rose-700">
                          අහිමි වූ මුදල: <b>රු. {econ.moistureLossValue.toLocaleString()}</b>
                        </span>
                      </div>
                      <div className="text-right font-bold text-rose-900">
                        <span className="text-sm">-{econ.weightLossKg} kg</span>
                        <span className="block text-[10px] text-rose-600">({econ.shrinkagePercent}% Loss)</span>
                      </div>
                    </div>

                    {/* True Cost of 1kg Dried */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>උම්බලකඩ 1kg ක සැබෑ නිෂ්පාදන වියදම:</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          රු. {econ.trueCostPerKg.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-400 font-bold pt-1 border-t border-slate-800">
                        <span>ශුද්ධ ලාභය (@ රු. {sellPrice.toLocaleString()}/kg):</span>
                        <span className="font-mono">
                          +රු. {econ.netProfit.toLocaleString()} ({econ.marginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>වේලීම අවසන් වූ පසු 1kg ක නියම නිෂ්පාදන වියදම හා Loss මුදල පෙන්වයි.</span>
                  </div>
                )}

                {/* Footer Action */}
                {!['PACKAGED', 'COMPLETED'].includes(batch.status) && (
                  <button
                    onClick={() => openAdvanceModal(batch)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                  >
                    ඊළඟ පියවර / අස්වැන්න ඇතුළත් කරන්න <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: INVENTORY VAULT */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="තොග සොයන්න..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-3.5">අයිතමය</th>
                <th className="p-3.5">වර්ගය</th>
                <th className="p-3.5">ප්‍රමාණය</th>
                <th className="p-3.5">ස්ථානය</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-bold text-slate-900">
                    {item.name}
                    <span className="font-mono text-slate-400 text-[10px] block">{item.sku}</span>
                  </td>
                  <td className="p-3.5 text-slate-500">{item.category}</td>
                  <td className="p-3.5 font-bold text-slate-900">{item.currentStock} {item.unit}</td>
                  <td className="p-3.5 text-slate-500">{item.storageLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL 1: CREATE BATCH (ENTER TOTAL COST OR UNIT PRICE) ── */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">අලුත් Batch එකක් ඇතුළත් කිරීම</h3>
              <button onClick={() => setShowNewBatchModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700">Batch කේතය</label>
                <input
                  type="text"
                  value={batchForm.batchCode}
                  onChange={(e) => setBatchForm({ ...batchForm, batchCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700">අමු මාළු බර (kg) *</label>
                <input
                  type="number"
                  value={batchForm.initialRawWeightKg}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                  placeholder="100"
                  required
                />
              </div>

              {/* DUAL MONEY INPUT BOX */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <span className="font-bold text-blue-900 block">💰 අමු මාළු මිලදී ගත් මුදල ඇතුළත් කරන්න:</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">මාළු ගත් මුළු මුදල (රු.)</label>
                    <input
                      type="number"
                      value={batchForm.totalRawCost}
                      onChange={(e) => handleTotalCostChange(e.target.value)}
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl font-bold text-blue-700"
                      placeholder="104000"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">1kg ක මිල (රු.)</label>
                    <input
                      type="number"
                      value={batchForm.buyingPricePerKg}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl font-bold text-blue-700"
                      placeholder="1040"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-blue-800 flex justify-between font-medium pt-1">
                  <span>සාමාන්‍ය 1kg මිල: <b>රු. {batchForm.buyingPricePerKg || 0}</b></span>
                  <span>මුළු වියදම: <b>රු. {parseFloat(batchForm.totalRawCost || 0).toLocaleString()}</b></span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  අවලංගු කරන්න
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
                >
                  ආරම්භ කරන්න
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADVANCE & REAL-TIME COST/LOSS CALCULATION ── */}
      {showAdvanceModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">අස්වැන්න හා Loss ගණනය ({selectedBatch.batchCode})</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAdvanceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700">ඊළඟ පියවර</label>
                <select
                  value={advanceForm.nextStatus}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, nextStatus: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="BOILED">තැම්බීම (Boiled)</option>
                  <option value="DRYING">වේලීම (Drying Chamber)</option>
                  <option value="QUALITY_GRADED">AI තත්ත්ව පරීක්ෂාව හා Yield මැනීම</option>
                  <option value="PACKAGED">ඇසුරුම් කර අවසන්</option>
                </select>
              </div>

              {['QUALITY_GRADED', 'PACKAGED'].includes(advanceForm.nextStatus) && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                  <span className="font-bold text-emerald-900 block">ලැබුණු නිමි උම්බලකඩ බර (kg):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block">Grade A</span>
                      <input
                        type="number"
                        value={advanceForm.gradeA_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeA_Kg: e.target.value })}
                        className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block">Grade B</span>
                      <input
                        type="number"
                        value={advanceForm.gradeB_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeB_Kg: e.target.value })}
                        className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block">Grade C</span>
                      <input
                        type="number"
                        value={advanceForm.gradeC_Kg}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, gradeC_Kg: e.target.value })}
                        className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-emerald-900 block mb-1">විකිණීමට බලාපොරොත්තු වන 1kg මිල (රු.)</label>
                    <input
                      type="number"
                      value={advanceForm.targetSellingPricePerKg}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, targetSellingPricePerKg: e.target.value })}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold"
                    />
                  </div>

                  {/* 🌟 REAL-TIME COST & LOSS CALCULATOR IN MODAL */}
                  {(() => {
                    const totalProduced = (parseFloat(advanceForm.gradeA_Kg) || 0) + (parseFloat(advanceForm.gradeB_Kg) || 0) + (parseFloat(advanceForm.gradeC_Kg) || 0);
                    const rawInitial = parseFloat(selectedBatch.initialRawWeightKg) || 0;
                    const totalCost = parseFloat(selectedBatch.totalRawCost) || (rawInitial * (parseFloat(selectedBatch.buyingPricePerKg) || 1040));
                    const sell = parseFloat(advanceForm.targetSellingPricePerKg) || 6200;

                    const econ = computeEconomics(rawInitial, totalCost, totalProduced, sell);

                    return (
                      <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-[11px]">
                        <div className="flex justify-between text-rose-700 font-semibold">
                          <span>අඩුවූ බර (Loss):</span>
                          <span>-{econ.weightLossKg} kg ({econ.shrinkagePercent}%)</span>
                        </div>
                        <div className="flex justify-between text-rose-700">
                          <span>අහිමි වූ අමු මාළු මුදල:</span>
                          <span>රු. {econ.moistureLossValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-emerald-200">
                          <span>උම්බලකඩ 1kg ක සැබෑ වියදම:</span>
                          <span className="text-blue-700 font-mono">රු. {econ.trueCostPerKg.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  අවලංගු කරන්න
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
                >
                  තහවුරු කරන්න
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