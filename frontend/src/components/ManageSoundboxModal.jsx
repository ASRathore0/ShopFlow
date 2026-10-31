import React, { useState, useEffect } from 'react';
import { 
  X, Volume2, Plus, Trash2, Edit2, CheckCircle2, Copy, 
  ExternalLink, RefreshCw, AlertCircle, Radio, ArrowRight, ShieldCheck, Check
} from 'lucide-react';
import { billingService } from '../services/billingService';

// Pleasant retail payment chime using standard Web Audio API
export const playSoundboxChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.25);       // D5 note
    playTone(880.00, now + 0.15, 0.4);  // A5 note
  } catch (err) {
    console.warn('Audio chime playback failed:', err);
  }
};

export default function ManageSoundboxModal({ isOpen, onClose, role = 'admin', onDeviceChanged }) {
  const [devices, setDevices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('devices'); // 'devices' | 'transactions' | 'add'
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'paytm',
    upi_id: '',
    device_id: '',
    merchant_id: '',
    is_default: false,
    is_active: true,
  });

  // Simulation test state
  const [simAmount, setSimAmount] = useState('100');
  const [simDevice, setSimDevice] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      loadTransactions();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await billingService.getSoundboxDevices(role);
      setDevices(res.data || []);
      if (res.data?.length > 0 && !simDevice) {
        setSimDevice(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load soundbox devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await billingService.getSoundboxTransactions({ per_page: 20 }, role);
      setTransactions(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handleCopyWebhook = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.upi_id) {
      setMessage({ type: 'error', text: 'Device name and UPI ID are required.' });
      return;
    }

    setLoading(true);
    try {
      if (editingDevice) {
        await billingService.updateSoundboxDevice(editingDevice.id, formData, role);
        setMessage({ type: 'success', text: `Soundbox "${formData.name}" updated successfully!` });
      } else {
        await billingService.createSoundboxDevice(formData, role);
        setMessage({ type: 'success', text: `Soundbox "${formData.name}" added successfully!` });
      }

      setFormData({
        name: '',
        provider: 'paytm',
        upi_id: '',
        device_id: '',
        merchant_id: '',
        is_default: false,
        is_active: true,
      });
      setEditingDevice(null);
      setActiveTab('devices');
      await loadDevices();
      if (onDeviceChanged) onDeviceChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save Soundbox device.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (device) => {
    if (!window.confirm(`Are you sure you want to delete "${device.name}"?`)) return;
    try {
      await billingService.deleteSoundboxDevice(device.id, role);
      await loadDevices();
      if (onDeviceChanged) onDeviceChanged();
    } catch (err) {
      alert('Failed to delete device: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      const res = await billingService.simulatePayment({
        amount: parseFloat(simAmount) || 100,
        soundbox_device_id: simDevice || null,
        payer_vpa: 'customer@upi',
      }, role);

      playSoundboxChime();
      setMessage({ 
        type: 'success', 
        text: `🔊 Soundbox Ping Successful! Payment of ₹${res.data?.amount} on "${res.data?.account_name}" recorded. UTR: ${res.data?.utr_number}` 
      });

      await loadTransactions();
      await loadDevices();
      if (onDeviceChanged) onDeviceChanged();
    } catch (err) {
      setMessage({ type: 'error', text: 'Simulation failed: ' + (err.response?.data?.message || err.message) });
    } finally {
      setSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] border border-gray-100 dark:border-gray-800">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex-shrink-0 flex items-center justify-center backdrop-blur-md">
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold tracking-tight truncate">Soundbox Sync & UPI Accounts</h2>
              <p className="text-[11px] sm:text-xs text-blue-100 truncate">
                Direct Paytm, PhonePe, GPay sync & reconciliation
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 px-3 sm:px-6 gap-2">
          <button
            onClick={() => { setActiveTab('devices'); setEditingDevice(null); }}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'devices'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 shadow-sm -mb-px rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Devices ({devices.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('add');
              setFormData({
                name: '',
                provider: 'paytm',
                upi_id: '',
                device_id: '',
                merchant_id: '',
                is_default: devices.length === 0,
                is_active: true,
              });
              setEditingDevice(null);
            }}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'add'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 shadow-sm -mb-px rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {editingDevice ? 'Edit Device' : 'Add New'}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 shadow-sm -mb-px rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Webhook Log
          </button>
        </div>

        {/* Alerts / Feedback */}
        {message && (
          <div className={`mx-3 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
            <span className="flex-1 font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Configured Devices */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              {devices.length === 0 ? (
                <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">No Soundboxes Added Yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Add your Paytm Soundbox, PhonePe SmartSpeaker, or Bank QR to track payments per account and get real-time voice confirmations.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-md transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Your First Soundbox
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devices.map((device) => {
                      const providerBadgeColors = {
                        paytm: 'bg-sky-100 text-sky-800 border-sky-200',
                        phonepe: 'bg-purple-100 text-purple-800 border-purple-200',
                        gpay: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        bharatpe: 'bg-amber-100 text-amber-800 border-amber-200',
                        bank_upi: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                        other: 'bg-gray-100 text-gray-800 border-gray-200',
                      };

                      return (
                        <div
                          key={device.id}
                          className={`rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                            device.is_default
                              ? 'border-blue-500 ring-2 ring-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-gray-900 text-base">{device.name}</h4>
                                  {device.is_default && (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                                      Default POS
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-mono font-semibold text-blue-700 mt-0.5 flex items-center gap-1">
                                  <span>UPI:</span> {device.upi_id}
                                </p>
                              </div>

                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${providerBadgeColors[device.provider] || providerBadgeColors.other}`}>
                                {device.provider}
                              </span>
                            </div>

                            {/* Today's collection summary */}
                            <div className="my-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-gray-500 block">Today's Received</span>
                                <span className="font-bold text-sm text-gray-900">
                                  ₹{parseFloat(device.today_amount_sum || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-500 block">Synced Bills</span>
                                <span className="font-bold text-sm text-emerald-600">
                                  {device.today_transactions_count || 0} bills
                                </span>
                              </div>
                            </div>

                            {/* Webhook copy box */}
                            <div className="mb-3">
                              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                Webhook Notification URL:
                              </label>
                              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs">
                                <input
                                  type="text"
                                  readOnly
                                  value={device.webhook_url}
                                  className="w-full bg-transparent font-mono text-[11px] text-gray-700 outline-none truncate"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCopyWebhook(device.webhook_url, device.id)}
                                  className="px-2 py-1 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                                  title="Copy Webhook URL"
                                >
                                  {copiedId === device.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700 font-bold">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Action footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingDevice(device);
                                  setFormData({
                                    name: device.name,
                                    provider: device.provider,
                                    upi_id: device.upi_id,
                                    device_id: device.device_id || '',
                                    merchant_id: device.merchant_id || '',
                                    is_default: device.is_default,
                                    is_active: device.is_active,
                                  });
                                  setActiveTab('add');
                                }}
                                className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 p-1 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDevice(device)}
                                className="text-gray-600 hover:text-red-600 font-medium flex items-center gap-1 p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                setSimDevice(device.id);
                                handleSimulatePayment();
                              }}
                              disabled={simulating}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Test Ding</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Instant Test Simulator Tool */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-blue-700" />
                        <h4 className="font-bold text-gray-900 text-sm">Direct Soundbox Test Simulator</h4>
                      </div>
                      <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                        Instant Cashier Ping
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Simulate a customer scanning and paying at this soundbox. This tests voice chime, auto-clears pending bills, and logs the UTR in real-time.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[150px]">
                        <select
                          value={simDevice}
                          onChange={(e) => setSimDevice(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                        >
                          {devices.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.provider.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">₹</span>
                          <input
                            type="number"
                            value={simAmount}
                            onChange={(e) => setSimAmount(e.target.value)}
                            className="w-full pl-6 pr-2 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                            placeholder="Amount"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSimulatePayment}
                        disabled={simulating}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
                      >
                        {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                        Simulate Payment Ding
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Add or Edit Device Form */}
          {activeTab === 'add' && (
            <form onSubmit={handleSaveDevice} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Soundbox Nickname / Counter <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paytm Soundbox (ICICI A/C) or Counter 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Label your bank or counter so cashiers know exactly where payment was announced.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Soundbox Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  >
                    <option value="paytm">Paytm Soundbox</option>
                    <option value="phonepe">PhonePe SmartSpeaker</option>
                    <option value="gpay">Google Pay for Business</option>
                    <option value="bharatpe">BharatPe Speaker</option>
                    <option value="bank_upi">Direct Bank UPI (SBI/HDFC/ICICI/Axis)</option>
                    <option value="other">Other UPI Soundbox</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    UPI VPA / ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vrcollection@paytm or shop@ybl"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Used to generate dynamic QR codes for customers with exact bill amount.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Terminal / Device Serial ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PAYTM-BOX-0921"
                    value={formData.device_id}
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Merchant ID / MID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PAYTM_MID_98213"
                    value={formData.merchant_id}
                    onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>

                <div className="flex flex-col justify-center space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-gray-800">Set as Primary Default Soundbox</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Active (Accepting Payments)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setActiveTab('devices'); setEditingDevice(null); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingDevice ? 'Update Soundbox' : 'Register Soundbox'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Webhook & Transaction Logs */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Real-time Soundbox Webhook Pings</h4>
                  <p className="text-xs text-gray-500">Latest transactions received directly from Soundbox IoT webhooks</p>
                </div>
                <button
                  onClick={loadTransactions}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-medium flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-xs">
                  No incoming transactions recorded yet. Use the "Test Ding" button to test!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Device / Soundbox</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">UTR Reference</th>
                        <th className="py-2.5 px-3">Matched Bill</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {tx.soundbox_device?.name || 'Generic Soundbox'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700 text-sm whitespace-nowrap">
                            ₹{parseFloat(tx.amount).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                            {tx.utr_number}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            {tx.order ? (
                              <span className="text-blue-700 font-bold">
                                #{tx.order.bill_number || tx.order.order_number}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Unmatched</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              tx.status === 'matched' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Instant Bank UTR Verification & Real-time Bill Auto-Clearing</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 font-semibold text-gray-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

