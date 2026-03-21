import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import UserProfile from '@/features/auth/UserProfile';
import Button from '@/components/ui/Button';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
              <p className="text-secondary-600 dark:text-secondary-400">
                Manage your personal information and preferences
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Profile component */}
        <UserProfile editable />
      </div>
    </div>
  );
};

export default ProfilePage;
