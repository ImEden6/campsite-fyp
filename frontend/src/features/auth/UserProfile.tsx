import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Camera, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface UserProfileProps {
  editable?: boolean;
  onSave?: () => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  editable = true,
  onSave 
}) => {
  const { user, updateProfile, isLoading } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const [validationErrors, setValidationErrors] = useState<Partial<ProfileFormData>>({});

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No user data available</p>
      </Card>
    );
  }

  const validateForm = (): boolean => {
    const errors: Partial<ProfileFormData> = {};
    
    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name as keyof ProfileFormData]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
    
    // Clear messages
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
    });
    setValidationErrors({});
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await updateProfile({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      if (onSave) {
        onSave();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    setUploadingAvatar(true);
    setError(null);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Upload avatar to backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/v1/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload avatar' }));
        throw new Error(errorData.message || 'Failed to upload avatar');
      }
      
      const result = await response.json();
      
      // Update user in store with new avatar URL
      if (result.data?.url) {
        const updatedUser = { ...user, avatar: result.data.url };
        useAuthStore.getState().setUser(updatedUser);
      }
      
      setSuccess('Avatar updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      {/* Header with avatar */}
      <div className="bg-linear-to-r from-blue-500 to-blue-600 px-6 py-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-600 shadow-lg">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials()
              )}
              
              {/* Upload progress overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            
            {editable && (
              <label
                htmlFor="avatar-upload"
                className={cn(
                  'absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-100',
                  uploadingAvatar && 'pointer-events-none opacity-50'
                )}
              >
                <Camera className="h-4 w-4 text-gray-600" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          {/* User info */}
          <div className="flex-1 text-white">
            <h2 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="mt-1 text-blue-100">{user.email}</p>
            <div className="mt-2 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
              {user.role}
            </div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="p-6">
        {/* Success message */}
        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-md bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-md bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Personal Information
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="text"
                name="firstName"
                label="First name"
                value={formData.firstName}
                onChange={handleChange}
                error={validationErrors.firstName}
                icon={<UserIcon className="h-5 w-5" />}
                disabled={!isEditing}
                required
              />
              
              <Input
                type="text"
                name="lastName"
                label="Last name"
                value={formData.lastName}
                onChange={handleChange}
                error={validationErrors.lastName}
                icon={<UserIcon className="h-5 w-5" />}
                disabled={!isEditing}
                required
              />
            </div>
          </div>

          {/* Contact information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Contact Information
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="email"
                name="email"
                label="Email address"
                value={formData.email}
                onChange={handleChange}
                error={validationErrors.email}
                icon={<Mail className="h-5 w-5" />}
                disabled={!isEditing}
                required
              />
              
              <Input
                type="tel"
                name="phone"
                label="Phone number"
                value={formData.phone}
                onChange={handleChange}
                error={validationErrors.phone}
                icon={<Phone className="h-5 w-5" />}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Action buttons */}
          {editable && (
            <div className="flex justify-end gap-3 border-t pt-6">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default UserProfile;
