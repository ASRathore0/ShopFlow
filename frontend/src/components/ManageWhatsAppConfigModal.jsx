import React, { useState, useEffect } from 'react';
import {
  X, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Key, Smartphone, ShieldCheck, RefreshCw, Sparkles, Check
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';

export default function ManageWhatsAppConfigModal({
  isOpen,
  onClose,
  shop,
  onSaved,
}) {
  if (!isOpen || !shop) return null;

  const [provider, setProvider] = useState('none'); // 'none' | 'meta' | 'twilio'
  const [autoSend, setAutoSend] = useState(true);

  // Meta configuration
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaTemplateName, setMetaTemplateName] = useState('');

  // Twilio configuration
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromNumber, setTwilioFromNumber] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const res = await superAdminService.getWhatsAppConfig(shop.id);
        if (res && res.data) {
          const d = res.data;
          setProvider(d.whatsapp_provider || 'none');
          setAutoSend(d.auto_send_whatsapp_bill !== false);

          const c = d.whatsapp_config || {};
          setMetaPhoneId(c.meta_phone_number_id || '');
          setMetaWabaId(c.meta_waba_id || '');
          setMetaAccessToken(c.meta_access_token || '');
          setMetaTemplateName(c.meta_template_name || '');

          setTwilioSid(c.twilio_account_sid || '');
          setTwilioAuthToken(c.twilio_auth_token || '');
          setTwilioFromNumber(c.twilio_from_number || '');
        }
      } catch (err) {
        console.error('Failed to load WhatsApp config', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [shop.id]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setTestResult(null);

    const config = {
      meta_phone_number_id: metaPhoneId.trim(),
      meta_waba_id: metaWabaId.trim(),
      meta_access_token: metaAccessToken.trim(),
      meta_template_name: metaTemplateName.trim(),
      twilio_account_sid: twilioSid.trim(),
      twilio_auth_token: twilioAuthToken.trim(),
      twilio_from_number: twilioFromNumber.trim(),
    };

    try {
      const res = await superAdminService.updateWhatsAppConfig(shop.id, {
        whatsapp_provider: provider,
        auto_send_whatsapp_bill: autoSend,
        whatsapp_config: config,
      });

      if (res && res.status === 'success') {
        showToast(res.message || 'WhatsApp configuration saved successfully!');
        if (onSaved) onSaved(res.data);
        setTimeout(() => onClose(), 800);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone.trim()) {
      alert('Please enter a test mobile number with country code (e.g. 919876543210)');
      return;
    }

    if (provider === 'none') {
      alert('Please select Meta or Twilio as the provider to test API integration.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    const config = {
      meta_phone_number_id: metaPhoneId.trim(),
      meta_waba_id: metaWabaId.trim(),
      meta_access_token: metaAccessToken.trim(),
      meta_template_name: metaTemplateName.trim(),
      twilio_account_sid: twilioSid.trim(),
      twilio_auth_token: twilioAuthToken.trim(),
      twilio_from_number: twilioFromNumber.trim(),
    };

    try {
      const res = await superAdminService.testWhatsAppConfig(shop.id, {
        test_phone: testPhone.trim(),
        whatsapp_provider: provider,
        whatsapp_config: config,
      });

      if (res && res.data) {
        setTestResult(res.data);
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed.',
        error: err.response?.data?.data?.error || err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  WhatsApp Gateway Setup
                </h2>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {shop.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Configure Meta Cloud API or Twilio to automatically send bills to customer WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>Loading WhatsApp settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* PROVIDER CARDS */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] block">
                Select WhatsApp Delivery Gateway:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. None / Manual Link */}
                <button
                  type="button"
                  onClick={() => setProvider('none')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    provider === 'none'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">Manual 1-Click</span>
                    {provider === 'none' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    No API keys required. Cashier clicks WhatsApp icon to open Web/App with pre-filled bill.
                  </p>
                </button>

                {/* 2. Meta Cloud API */}
                <button
                  type="button"
                  onClick={() => setProvider('meta')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    provider === 'meta'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">Meta Cloud API</span>
                    {provider === 'meta' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Official WhatsApp Business Cloud API. Instant automated delivery directly to customer.
                  </p>
                </button>

                {/* 3. Twilio */}
                <button
                  type="button"
                  onClick={() => setProvider('twilio')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    provider === 'twilio'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-600 dark:text-indigo-400">Twilio WhatsApp</span>
                    {provider === 'twilio' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Twilio Messaging API. Uses Twilio Account SID & Auth Token.
                  </p>
                </button>
              </div>
            </div>

            {/* AUTO-SEND TOGGLE */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Automatic Bill Dispatch
                </div>
                <div className="text-[11px] text-slate-500">
                  Send bill automatically as soon as cashier generates bill (if customer phone is entered)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoSend(!autoSend)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSend ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSend ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* META CREDENTIALS FORM */}
            {provider === 'meta' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 dark:text-emerald-300">
                    Meta Cloud API Credentials
                  </span>
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Meta Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      Phone Number ID *
                    </label>
                    <input
                      type="text"
                      required={provider === 'meta'}
                      value={metaPhoneId}
                      onChange={(e) => setMetaPhoneId(e.target.value)}
                      placeholder="e.g. 105948372619482"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      WABA Account ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={metaWabaId}
                      onChange={(e) => setMetaWabaId(e.target.value)}
                      placeholder="e.g. 194827401928471"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    System User Permanent Access Token *
                  </label>
                  <input
                    type="password"
                    required={provider === 'meta'}
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                    placeholder="EAA..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Requires <code>whatsapp_business_messaging</code> permission.
                  </span>
                </div>
              </div>
            )}

            {/* TWILIO CREDENTIALS FORM */}
            {provider === 'twilio' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 dark:text-indigo-300">
                    Twilio WhatsApp API Credentials
                  </span>
                  <a
                    href="https://console.twilio.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    Twilio Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      Account SID *
                    </label>
                    <input
                      type="text"
                      required={provider === 'twilio'}
                      value={twilioSid}
                      onChange={(e) => setTwilioSid(e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      Auth Token *
                    </label>
                    <input
                      type="password"
                      required={provider === 'twilio'}
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      placeholder="Your Twilio Auth Token"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    From WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required={provider === 'twilio'}
                    value={twilioFromNumber}
                    onChange={(e) => setTwilioFromNumber(e.target.value)}
                    placeholder="e.g. +14155238886 (or whatsapp:+14155238886)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* LIVE TEST SEND SECTION */}
            {provider !== 'none' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-500" />
                  <span>Test WhatsApp Connection Before Saving</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Recipient phone (e.g. 919876543210)"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{testing ? 'Testing...' : 'Send Test'}</span>
                  </button>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div className={`p-3 rounded-xl text-xs font-medium border ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span>{testResult.message}</span>
                    </div>
                    {testResult.error && (
                      <div className="mt-1 text-[11px] font-mono break-all opacity-80">
                        {typeof testResult.error === 'object' ? JSON.stringify(testResult.error) : testResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

