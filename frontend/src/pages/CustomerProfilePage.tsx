/**
 * CustomerProfilePage
 * Customer profile management page
 */

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { User, Mail, Phone, Save, RefreshCw } from 'lucide-react';

const CustomerProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { showToast } = useUIStore();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to update profile',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <GlassCard className="p-8" intensity="strong">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-secondary-200 dark:border-gray-700">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 text-secondary-400" />
                  First Name
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 text-secondary-400" />
                  Last Name
                </label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 text-secondary-400" />
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled
                  className="bg-gray-50 dark:bg-gray-700/50"
                />
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1.5">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="w-4 h-4 text-secondary-400" />
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-secondary-200 dark:border-gray-700">
              <Button type="submit" disabled={isSaving} className="shadow-lg shadow-primary-600/20">
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
