import React, { useState, useRef } from 'react';
import {
  X, User, Mail, Phone, Shield, Store, MapPin, CheckCircle2,
  Lock, Save, AlertCircle, Award, UserCheck, Sparkles, Check,
  Camera, Upload, Loader2, Image as ImageIcon
} from 'lucide-react';
import { staffService } from '../services/staffService';
import { useAuth } from '../context/AuthContext';

export default function StaffProfileModal({ isOpen, onClose, employee, shop, onProfileUpdated }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const getCleanImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const backendBase = import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:8000';
    return `${backendBase}/${url.replace(/^\//, '')}`;
  };

  const initialAvatar = employee?.avatar_url || user?.avatar_url || '';

  const [name, setName] = useState(employee?.name || user?.name || '');
  const [email, setEmail] = useState(employee?.email || user?.email || '');
  const [phone, setPhone] = useState(employee?.phone || user?.phone || '');
  const [assignedZone, setAssignedZone] = useState(employee?.assigned_zone || 'Main Showroom Floor');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const roleLabel = employee?.role === 'manager' 
    ? 'Store Manager' 
    : employee?.role === 'shop_owner' 
    ? 'Shop Owner' 
    : employee?.role === 'cashier'
    ? 'Checkout Staff'
    : 'Floor Staff';

  const employeeCode = employee?.employee_code || `EMP-${String(user?.id || '01').padStart(2, '0')}`;
  const totalCompleted = employee?.total_requests_completed ?? 142;

  // Handle immediate avatar photo upload
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setUploadingAvatar(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await staffService.uploadAvatar(file);
      if (res && res.status === 'success') {
        const uploadedUrl = res.avatar_url;
        setAvatarUrl(uploadedUrl);
        setSuccessMsg('Profile picture updated successfully!');
        if (onProfileUpdated) {
          onProfileUpdated(res.user, res.employee);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload profile picture. Please try another image.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        assigned_zone: assignedZone.trim(),
        avatar_url: avatarUrl,
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await staffService.updateProfile(payload);
      if (res && res.status === 'success') {
        setSuccessMsg('Profile updated successfully!');
        setPassword('');
        setIsEditing(false);
        if (onProfileUpdated) {
          onProfileUpdated(res.user, res.employee);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const activeAvatarSrc = avatarPreview || getCleanImageUrl(avatarUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Staff Profile Details
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Showroom floor associate credentials & settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Hidden file input for photo upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarFileChange}
            className="hidden"
          />

          {/* Staff Hero Card with Avatar Upload Trigger */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white dark:from-[#18181E] dark:via-[#141417] dark:to-[#121215] border border-blue-100 dark:border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              {/* Avatar with Camera Overlay */}
              <div className="relative shrink-0 group">
                {activeAvatarSrc ? (
                  <img
                    src={activeAvatarSrc}
                    alt={name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white dark:border-zinc-700 shadow-lg shadow-blue-500/20"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center font-black text-white text-2xl sm:text-3xl shadow-lg shadow-blue-500/25">
                    {(name || 'S').charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Online pulse indicator */}
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#121215] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />

                {/* Upload camera button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer border border-white dark:border-zinc-800"
                  title="Upload / Change Profile Picture"
                  aria-label="Upload profile picture"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Identity & Badges */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {name}
                  </h4>
                  {/* Floor Staff indicator badge placed into profile */}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs shadow-blue-600/30 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{roleLabel}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{shop?.name || 'Showroom Store'}</span>
                  <span>·</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400">ID: {employeeCode}</span>
                </div>

                {/* Direct quick button to change photo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>{uploadingAvatar ? 'Uploading Photo...' : 'Change Profile Picture'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Pill Highlights */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-200/60 dark:border-white/[0.06] text-xs">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                  Assigned Floor Zone
                </span>
                <span className="font-bold text-slate-800 dark:text-zinc-200 truncate block mt-0.5">
                  {assignedZone || 'Main Floor'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                  Completed Requests
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block mt-0.5">
                  {totalCompleted} served
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Toggle between View and Edit Modes */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {isEditing ? 'Edit Profile Details' : 'Account Details'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-zinc-900 border-blue-500 ring-2 ring-blue-500/10 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-zinc-900 border-blue-500 ring-2 ring-blue-500/10 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    isEditing
                      ? 'bg-white dark:bg-zinc-900 border-blue-500 ring-2 ring-blue-500/10 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Assigned Store Zone</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={assignedZone}
                onChange={(e) => setAssignedZone(e.target.value)}
                placeholder="e.g. Zone A - Mobile & Audio"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isEditing
                    ? 'bg-white dark:bg-zinc-900 border-blue-500 ring-2 ring-blue-500/10 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 cursor-not-allowed'
                }`}
              />
            </div>

            {isEditing && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Update Password (Optional)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty to keep existing password"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 dark:text-white transition-all"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                  Must be at least 6 characters long if changing.
                </span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              {isEditing && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
