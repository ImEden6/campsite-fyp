/**
 * Guided admin flow: add details + photos then place on map, or place on map first then complete photos.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Images as ImagesIcon, Tent } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { SiteFormData } from '@/features/sites/components/SiteForm';
import {
  AmenitiesSection,
  BasicInfoSection,
  DescriptionSection,
  DimensionsSection,
  ImagesSection,
} from '@/features/sites/components/SiteFormSections';
import { createSite, getSiteById, updateSite, uploadSiteImages } from '@/services/api/sites';
import { getMapById } from '@/services/api/maps';
import { MeasurementUnit, SiteStatus, SiteType, type Site } from '@/types';

export const ADMIN_MAIN_MAP_ID = 'main-map';

export const WIZ_MAP_FIRST_KEY = 'addSiteWizard_mapFirst';
export const WIZ_PREV_CAMPSITES_KEY = 'addSiteWizard_prevCampsiteIds';

type WizardPhase =
  | 'choose'
  | 'detailsForm'
  | 'photos'
  | 'place'
  /** Finish listing after map-first (photos + description) */
  | 'completeListing';

function defaultForm(defaultType: SiteType): SiteFormData {
  return {
    name: '',
    type: defaultType,
    status: SiteStatus.AVAILABLE,
    capacity: 4,
    description: '',
    basePrice: 0,
    maxVehicles: 1,
    maxTents: 1,
    isPetFriendly: false,
    hasElectricity: false,
    hasWater: false,
    hasSewer: false,
    hasWifi: false,
    amenities: [],
    images: [],
    newImages: [],
    size: { length: 30, width: 20, unit: MeasurementUnit.FEET },
    location: {
      latitude: 0,
      longitude: 0,
      mapPosition: { x: 0, y: 0 },
    },
  };
}

interface AddSiteWizardProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSiteType: SiteType;
  /** When set (e.g. after map-first save), open listing-completion step */
  completeSiteId?: string | null;
}

const AddSiteWizard: React.FC<AddSiteWizardProps> = ({
  isOpen,
  onClose,
  defaultSiteType,
  completeSiteId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<WizardPhase>('choose');
  const [form, setForm] = useState<SiteFormData>(() => defaultForm(defaultSiteType));
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);
  const [listingSite, setListingSite] = useState<Site | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [completeBusy, setCompleteBusy] = useState(false);

  const resetWizard = useCallback(() => {
    setPhase('choose');
    setForm(defaultForm(defaultSiteType));
    setCreatedSiteId(null);
    setListingSite(null);
    setFlowError(null);
    setPhotosBusy(false);
    setCompleteBusy(false);
  }, [defaultSiteType]);

  useEffect(() => {
    if (!isOpen) return;
    setFlowError(null);
    if (completeSiteId) {
      setPhase('completeListing');
      setCreatedSiteId(completeSiteId);
      void (async () => {
        try {
          const site = await getSiteById(completeSiteId);
          setListingSite(site);
          setForm((prev) => ({
            ...prev,
            description: site.description || '',
            images: site.images || [],
            newImages: [],
          }));
        } catch (e) {
          setFlowError(e instanceof Error ? e.message : 'Failed to load site');
        }
      })();
      return;
    }
    resetWizard();
    setForm(defaultForm(defaultSiteType));
  }, [isOpen, completeSiteId, defaultSiteType, resetWizard]);

  const handleFieldChange = useCallback(<K extends keyof SiteFormData>(field: K, value: SiteFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const createMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      const siteData: Partial<Site> = {
        name: data.name.trim(),
        type: data.type,
        status: data.status,
        capacity: data.capacity,
        description: data.description || undefined,
        basePrice: data.basePrice,
        maxVehicles: data.maxVehicles,
        maxTents: data.maxTents,
        isPetFriendly: data.isPetFriendly,
        hasElectricity: data.hasElectricity,
        hasWater: data.hasWater,
        hasSewer: data.hasSewer,
        hasWifi: data.hasWifi,
        amenities: data.amenities,
        size: data.size,
        location: data.location,
        images: [],
      };
      return createSite(siteData);
    },
  });

  const onContinueFromDetails = async () => {
    setFlowError(null);
    if (!form.name.trim()) {
      setFlowError('Site name is required');
      return;
    }
    if (form.capacity < 1) {
      setFlowError('Capacity must be at least 1');
      return;
    }
    try {
      const site = await createMutation.mutateAsync(form);
      setCreatedSiteId(site.id);
      setPhase('photos');
      await queryClient.invalidateQueries({ queryKey: ['sites'] });
    } catch (e) {
      setFlowError(e instanceof Error ? e.message : 'Failed to create site');
    }
  };

  const onContinueFromPhotos = async () => {
    setFlowError(null);
    if (!createdSiteId) {
      setFlowError('Missing site id');
      return;
    }
    setPhotosBusy(true);
    try {
      if (form.newImages.length > 0) {
        const urls = await uploadSiteImages(createdSiteId, form.newImages);
        const merged = [...(form.images || []), ...urls];
        await updateSite(createdSiteId, { images: merged });
        setForm((prev) => ({ ...prev, images: merged, newImages: [] }));
      }
      setPhase('place');
      await queryClient.invalidateQueries({ queryKey: ['sites'] });
    } catch (e) {
      setFlowError(e instanceof Error ? e.message : 'Failed to upload images');
    } finally {
      setPhotosBusy(false);
    }
  };

  const openMapEditorForSite = () => {
    if (!createdSiteId) return;
    onClose();
    navigate(
      `/admin/map-editor/${ADMIN_MAIN_MAP_ID}?siteId=${encodeURIComponent(createdSiteId)}&returnTo=/admin`
    );
  };

  const beginMapFirst = async () => {
    setFlowError(null);
    try {
      const map = await getMapById(ADMIN_MAIN_MAP_ID);
      const ids = map.modules.filter((m) => m.type === 'campsite').map((m) => m.id);
      sessionStorage.setItem(WIZ_PREV_CAMPSITES_KEY, JSON.stringify(ids));
      sessionStorage.setItem(WIZ_MAP_FIRST_KEY, '1');
      onClose();
      navigate(`/admin/map-editor/${ADMIN_MAIN_MAP_ID}?returnTo=${encodeURIComponent('/admin')}`);
    } catch (e) {
      setFlowError(e instanceof Error ? e.message : 'Could not open map editor');
    }
  };

  const saveCompleteListing = async () => {
    if (!createdSiteId) return;
    setFlowError(null);
    setCompleteBusy(true);
    try {
      let imageUrls = [...form.images];
      if (form.newImages.length > 0) {
        const uploaded = await uploadSiteImages(createdSiteId, form.newImages);
        imageUrls = [...imageUrls, ...uploaded];
      }
      await updateSite(createdSiteId, {
        description: form.description || undefined,
        images: imageUrls,
      });
      await queryClient.invalidateQueries({ queryKey: ['sites'] });
      onClose();
      resetWizard();
    } catch (e) {
      setFlowError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setCompleteBusy(false);
    }
  };

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose}>
        Cancel
      </Button>
      {phase === 'choose' && null}
      {phase === 'detailsForm' && (
        <Button type="button" onClick={() => void onContinueFromDetails()} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating…
            </>
          ) : (
            'Continue to photos'
          )}
        </Button>
      )}
      {phase === 'photos' && (
        <Button type="button" onClick={() => void onContinueFromPhotos()} disabled={photosBusy}>
          {photosBusy ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading…
            </>
          ) : form.newImages.length > 0 ? (
            'Upload & continue'
          ) : (
            'Skip photos'
          )}
        </Button>
      )}
      {phase === 'place' && (
        <Button type="button" onClick={openMapEditorForSite}>
          <MapPin className="w-4 h-4 mr-2" />
          Open map editor
        </Button>
      )}
      {phase === 'completeListing' && (
        <Button type="button" onClick={() => void saveCompleteListing()} disabled={completeBusy}>
          {completeBusy ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            'Save listing'
          )}
        </Button>
      )}
    </>
  );

  const title =
    phase === 'choose'
      ? 'Add site'
      : phase === 'detailsForm'
        ? 'Site details'
        : phase === 'photos'
          ? 'Photos'
          : phase === 'place'
            ? 'Place on map'
            : 'Complete listing';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="xl" closeOnBackdrop>
      {flowError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {flowError}
        </div>
      )}

      {phase === 'choose' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            className="flex flex-col items-start rounded-xl border border-secondary-200 bg-white p-5 text-left shadow-sm transition hover:border-primary-400 hover:shadow-md dark:border-secondary-700 dark:bg-night-surface"
            onClick={() => {
              setFlowError(null);
              setPhase('detailsForm');
              setForm(defaultForm(defaultSiteType));
            }}
          >
            <ImagesIcon className="mb-3 h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden />
            <span className="font-heading text-lg font-semibold text-gray-900 dark:text-primary-100">
              Details &amp; photos first
            </span>
            <span className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Enter pricing and amenities, add photos, then open the map to position the pad.
            </span>
          </button>
          <button
            type="button"
            className="flex flex-col items-start rounded-xl border border-secondary-200 bg-white p-5 text-left shadow-sm transition hover:border-primary-400 hover:shadow-md dark:border-secondary-700 dark:bg-night-surface"
            onClick={() => void beginMapFirst()}
          >
            <Tent className="mb-3 h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden />
            <span className="font-heading text-lg font-semibold text-gray-900 dark:text-primary-100">
              Place on map first
            </span>
            <span className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Drop a campsite on the layout, save, then come back to upload photos and polish the listing.
            </span>
          </button>
        </div>
      )}

      {phase === 'detailsForm' && (
        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
          <BasicInfoSection data={form} onChange={handleFieldChange} />
          <DescriptionSection description={form.description} onChange={(v) => handleFieldChange('description', v)} />
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-primary-100 mb-2">Lot size</h3>
            <DimensionsSection
              data={form.size}
              onChange={(field, value) =>
                handleFieldChange('size', { ...form.size, [field]: value })
              }
            />
          </div>
          <AmenitiesSection data={form} onChange={handleFieldChange} />
        </div>
      )}

      {phase === 'photos' && createdSiteId && (
        <div className="space-y-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Optional: add listing photos. You can skip and add them later from Sites.
          </p>
          <ImagesSection
            images={form.images}
            newImages={form.newImages}
            onImagesChange={(imgs) => handleFieldChange('images', imgs)}
            onNewImagesChange={(files) => handleFieldChange('newImages', files)}
          />
        </div>
      )}

      {phase === 'place' && createdSiteId && (
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            <strong className="text-gray-900 dark:text-primary-100">{form.name.trim()}</strong> is created.
            Open the map editor to drag the pad into position, then save the map.
          </p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Your site stays at map coordinates (0, 0) until you move it on the map and save.
          </p>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            I&apos;ll position it later
          </Button>
        </div>
      )}

      {phase === 'completeListing' && listingSite && (
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Site <strong className="text-gray-900 dark:text-primary-100">{listingSite.name}</strong> — add photos and
            a description for guests.
          </p>
          <DescriptionSection description={form.description} onChange={(v) => handleFieldChange('description', v)} />
          <ImagesSection
            images={form.images}
            newImages={form.newImages}
            onImagesChange={(imgs) => handleFieldChange('images', imgs)}
            onNewImagesChange={(files) => handleFieldChange('newImages', files)}
          />
        </div>
      )}

      {phase === 'completeListing' && !listingSite && completeSiteId && !flowError && (
        <div className="flex items-center gap-2 text-secondary-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading site…
        </div>
      )}
    </Modal>
  );
};

export default AddSiteWizard;
