'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Wrench,
  Milestone as MilestoneIcon,
  ShieldAlert,
  Droplets,
  Zap,
  Shield,
  Home,
  Sliders,
  Plus,
  Trash2,
  X,
  Boxes,
  Search,
  SearchX,
  LayoutGrid,
  Circle,
  Pencil,
  FolderPlus,
} from 'lucide-react';
import {
  getAdminPricingConfig,
  updatePackagePricing,
  updatePackageMetadata,
  updateLocationMultiplier,
  createLocation,
  deleteLocation,
  updateAddonVariantPricing,
  updateAddonMetadata,
  createAddon,
  deleteAddon,
  createAddonVariant,
  deleteAddonVariant,
  updateOptionPricing,
  createOption,
  deleteOption,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  updateMilestones,
  ADDON_PRICING_UNITS,
  expandPackageTier,
  ITEM_UNITS,
  PricingConfigData,
  AdminSpecificationCategory,
  AdminSpecificationItem,
  BrandOption,
  AddonPricingUnitKey,
  AddonVariantPayload,
  ItemUnit,
} from '@/lib/api/admin';
import { useAdminRoute, writeAdminHash } from '@/lib/useAdminRoute';

type MainSectionTab = 'packages' | 'addons' | 'locations' | 'specifications' | 'milestones';

const MAIN_SECTION_TABS: readonly MainSectionTab[] = [
  'packages',
  'specifications',
  'addons',
  'locations',
  'milestones',
] as const;

function isMainSectionTab(value: string | null): value is MainSectionTab {
  return value !== null && (MAIN_SECTION_TABS as readonly string[]).includes(value);
}
type PackageFilter = 'ALL' | 'basic' | 'standard' | 'premium' | 'luxury';
type AddonCategory = 'water' | 'power' | 'security' | 'smart_home' | 'other';
type AddonCategoryFilter = 'ALL' | AddonCategory;
/** `'ALL'` shows every category grouped; a number narrows to one category id. */
type SpecCategoryFilter = 'ALL' | number;

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/** Case- and punctuation-insensitive match used by the matrix search boxes. */
function matches(haystack: Array<string | null | undefined>, needle: string): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => (h ?? '').toLowerCase().includes(q));
}

function formatPricingUnit(unit: string): string {
  switch (unit) {
    case 'fixed':
      return 'Flat ₹';
    case 'per_litre':
      return '₹ / Litre';
    case 'per_rft':
      return '₹ / Running Foot';
    case 'per_sqft':
      return '₹ / Sq.Ft';
    case 'per_sqft_gate':
      return '₹ / Sq.Ft (Gate)';
    case 'per_sqft_terrace':
      return '₹ / Sq.Ft (Terrace)';
    default:
      return unit.replace(/_/g, ' ');
  }
}

function getAddonCategory(slug: string): AddonCategory {
  switch (slug) {
    case 'overhead_concrete_tank':
    case 'underground_sump':
    case 'conventional_septic_tank':
    case 'choke_pit':
    case 'waste_water_recycling':
      return 'water';
    case 'rooftop_solar':
    case 'solar_water_heater':
    case 'motor_automation':
    case 'pressure_pump':
      return 'power';
    case 'compound_wall':
    case 'main_gate':
    case 'cctv_security':
    case 'cool_roof_tiles':
      return 'security';
    case 'smart_home':
    case 'passenger_lift':
      return 'smart_home';
    default:
      return 'other';
  }
}

type AdminAddon = PricingConfigData['addons'][number];

/** Create/edit share one dialog per entity; the mode decides the verb and target. */
type CategoryDialog = { mode: 'create' } | { mode: 'edit'; category: AdminSpecificationCategory };
type ItemDialog =
  | { mode: 'create'; categoryId: number; categoryName: string }
  | { mode: 'edit'; item: AdminSpecificationItem };
type OptionDialog =
  | { mode: 'create'; itemId: number; itemName: string }
  | { mode: 'edit'; option: BrandOption; itemName: string };
type AddonDialog = { mode: 'create' } | { mode: 'edit'; addon: AdminAddon };

interface CategoryForm {
  name: string;
  slug: string;
  sortOrder: number;
}

interface ItemForm {
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  unit: ItemUnit;
  isCustomizable: boolean;
  sortOrder: number;
}

interface OptionForm {
  name: string;
  slug: string;
  priceDelta: number;
  description: string;
}

interface AddonForm {
  name: string;
  slug: string;
  description: string;
  pricingUnit: AddonPricingUnitKey;
  defaultQuantity: string;
  minQuantity: string;
  maxQuantity: string;
  sortOrder: number;
}

interface VariantForm {
  variantName: string;
  variantSlug: string;
  price: number;
  /** Package slugs this variant is offered in; empty is invalid. */
  packageTiers: string[];
}

const EMPTY_CATEGORY_FORM: CategoryForm = { name: '', slug: '', sortOrder: 0 };
const EMPTY_ITEM_FORM: ItemForm = {
  categoryId: 0,
  name: '',
  slug: '',
  description: '',
  unit: 'sqft',
  isCustomizable: true,
  sortOrder: 0,
};
const EMPTY_OPTION_FORM: OptionForm = { name: '', slug: '', priceDelta: 0, description: '' };
const EMPTY_ADDON_FORM: AddonForm = {
  name: '',
  slug: '',
  description: '',
  pricingUnit: 'fixed',
  defaultQuantity: '',
  minQuantity: '',
  maxQuantity: '',
  sortOrder: 0,
};
const EMPTY_VARIANT_FORM: VariantForm = {
  variantName: '',
  variantSlug: '',
  price: 0,
  packageTiers: [],
};

/** The slug shape every create endpoint validates against: [a-z0-9_]{2,}. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const ITEM_UNIT_LABELS: Record<ItemUnit, string> = {
  sqft: 'Per Sq.Ft',
  rft: 'Per Running Foot',
  fixed: 'Flat / Fixed',
  item: 'Per Item',
  allowance: 'Allowance',
};

/**
 * Human-readable scope for a stored `package_tier` value, so a row seeded as
 * 'basic_standard' reads as the packages it actually covers rather than as its
 * raw group name.
 */
function describeVariantScope(
  packageTier: string,
  packages: Array<{ slug: string; name: string }>
): string {
  const slugs = expandPackageTier(
    packageTier,
    packages.map((p) => p.slug)
  );
  if (packages.length > 0 && slugs.length === packages.length) return 'All packages';
  if (slugs.length === 0) return 'No packages';

  return packages
    .filter((p) => slugs.includes(p.slug))
    .map((p) => p.name)
    .join(', ');
}

/**
 * Which packages an add-on variant is offered in — one checkbox per package,
 * rather than the pre-combined tier groups the original seed shipped with.
 */
function PackageTierPicker({
  packages,
  selected,
  onChange,
  idPrefix,
}: {
  packages: Array<{ slug: string; name: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
}) {
  const allSelected = packages.length > 0 && packages.every((p) => selected.includes(p.slug));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-muted">Available In</span>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : packages.map((p) => p.slug))}
          className="text-[10px] font-bold text-muted hover:text-foreground underline underline-offset-2"
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {packages.map((pkg) => {
          const checked = selected.includes(pkg.slug);
          return (
            <label
              key={pkg.slug}
              htmlFor={`${idPrefix}-${pkg.slug}`}
              className={`flex items-center gap-2 px-2.5 py-2 rounded border cursor-pointer transition-colors ${
                checked
                  ? 'border-foreground bg-surface-active'
                  : 'border-border bg-background hover:bg-surface-active/50'
              }`}
            >
              <input
                id={`${idPrefix}-${pkg.slug}`}
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, pkg.slug]
                      : selected.filter((s) => s !== pkg.slug)
                  )
                }
                className="calculator-checkbox"
              />
              <span className="text-[11px] font-semibold truncate">{pkg.name}</span>
            </label>
          );
        })}
      </div>

      <span className="text-[10px] text-muted block">
        {selected.length === 0
          ? 'Select at least one package.'
          : allSelected
            ? 'Offered in every package.'
            : `Offered in ${selected.length} of ${packages.length} packages.`}
      </span>
    </div>
  );
}

/** Shared chrome for every dialog in this matrix — overlay, panel, titled header. */
function AdminModal({
  title,
  onClose,
  children,
  width = 'max-w-md',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        className={`admin-dialog p-6 w-full ${width} space-y-4 my-auto`}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface MilestoneFormItem {
  id?: number;
  stageNumber: number;
  stageName: string;
  percentage: number;
  keyDeliverables: string;
  isActive?: boolean;
}

export function AdminPricingConfigManager() {
  const [config, setConfig] = useState<PricingConfigData | null>(null);
  const [milestonesState, setMilestonesState] = useState<MilestoneFormItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingMilestones, setSavingMilestones] = useState<boolean>(false);

  // Feedback. Saves happen at the bottom of matrices several screens tall, so
  // these render in a fixed viewport corner rather than in the page header.
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  // Per-control in-flight keys, so a Save button can show its own spinner and
  // refuse a second click instead of firing duplicate writes.
  const [busyKeys, setBusyKeys] = useState<Record<string, boolean>>({});

  // Active Navigation Tabs
  // Read from the hash so a refresh reopens the matrix the operator was in
  // rather than dropping them back on Package Tiers.
  const route = useAdminRoute();
  const activeSection: MainSectionTab = isMainSectionTab(route.section)
    ? route.section
    : 'packages';

  const handleSectionChange = useCallback((section: MainSectionTab) => {
    writeAdminHash('pricing', section, 'replace');
  }, []);
  const [selectedPkgFilter, setSelectedPkgFilter] = useState<PackageFilter>('ALL');
  const [selectedAddonCategory, setSelectedAddonCategory] = useState<AddonCategoryFilter>('ALL');
  const [addonSearch, setAddonSearch] = useState<string>('');

  // Specifications Tab Filters
  const [selectedSpecCategoryId, setSelectedSpecCategoryId] = useState<SpecCategoryFilter>('ALL');
  const [specSearch, setSpecSearch] = useState<string>('');

  // Destructive actions route through an in-page dialog rather than
  // window.confirm(), which is unstyled, unlabelled and easy to dismiss blind.
  const [confirmState, setConfirm] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    onConfirm: () => Promise<unknown>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState<boolean>(false);

  // Modals State
  const [showAddLocationModal, setShowAddLocationModal] = useState<boolean>(false);
  const [newLocationName, setNewLocationName] = useState<string>('');
  const [newLocationSlug, setNewLocationSlug] = useState<string>('');
  const [newLocationMultiplier, setNewLocationMultiplier] = useState<number>(1.0);
  const [creatingLocation, setCreatingLocation] = useState<boolean>(false);

  // Specification matrix dialogs — one per level of the category / component /
  // brand-option tree, each shared between its create and edit mode.
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialog | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY_FORM);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  const [itemDialog, setItemDialog] = useState<ItemDialog | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM_FORM);
  const [savingItem, setSavingItem] = useState<boolean>(false);

  const [optionDialog, setOptionDialog] = useState<OptionDialog | null>(null);
  const [optionForm, setOptionForm] = useState<OptionForm>(EMPTY_OPTION_FORM);
  const [creatingOption, setCreatingOption] = useState<boolean>(false);

  // Add-on catalog dialogs.
  const [addonDialog, setAddonDialog] = useState<AddonDialog | null>(null);
  const [addonForm, setAddonForm] = useState<AddonForm>(EMPTY_ADDON_FORM);
  // Create only: an add-on must ship with at least one price row, or it renders
  // in the calculator with nothing to select.
  const [addonVariantsDraft, setAddonVariantsDraft] = useState<VariantForm[]>([
    { ...EMPTY_VARIANT_FORM },
  ]);
  const [savingAddon, setSavingAddon] = useState<boolean>(false);

  const [variantDialog, setVariantDialog] = useState<{ addon: AdminAddon } | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(EMPTY_VARIANT_FORM);
  const [savingVariant, setSavingVariant] = useState<boolean>(false);

  const anyDialogBusy =
    savingCategory || savingItem || creatingOption || savingAddon || savingVariant;

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++toastSeq.current;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      // Successes are transient; failures stay until acknowledged, so an
      // operator cannot miss a write that silently did not happen.
      if (kind === 'success') {
        window.setTimeout(() => dismissToast(id), 4000);
      }
    },
    [dismissToast]
  );

  const toMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  /**
   * Refetch the matrix. `showSkeleton` is only for the first load — a refresh
   * after a save must not tear the whole form down and discard every other
   * card's uncommitted edits.
   */
  const fetchConfig = useCallback(
    (opts?: { showSkeleton?: boolean; hydrateMilestones?: boolean }) => {
      const { showSkeleton = false, hydrateMilestones = false } = opts ?? {};
      if (showSkeleton) setLoading(true);
      return getAdminPricingConfig()
        .then((data) => {
          setConfig(data);
          if (data?.milestones) {
            // Milestones are a controlled form. Only rehydrate on first load or
            // straight after saving them, so an unrelated save elsewhere in the
            // matrix cannot wipe a half-finished schedule.
            setMilestonesState((prev) =>
              hydrateMilestones || prev.length === 0
                ? data.milestones.map((m) => ({
                    id: m.id,
                    stageNumber: m.stageNumber,
                    stageName: m.stageName,
                    percentage: Number(m.percentage) || 0,
                    keyDeliverables: m.keyDeliverables,
                    isActive: m.isActive !== false,
                  }))
                : prev
            );
          }
        })
        .catch((err) => {
          console.error(err);
          pushToast('error', toMessage(err, 'Failed to fetch pricing configuration.'));
        })
        .finally(() => {
          if (showSkeleton) setLoading(false);
        });
    },
    [pushToast]
  );

  useEffect(() => {
    fetchConfig({ showSkeleton: true, hydrateMilestones: true });
  }, [fetchConfig]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Never yank a dialog out from under an in-flight write.
      if (confirmBusy || creatingLocation || anyDialogBusy) return;
      setConfirm(null);
      setShowAddLocationModal(false);
      setCategoryDialog(null);
      setItemDialog(null);
      setOptionDialog(null);
      setAddonDialog(null);
      setVariantDialog(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmBusy, creatingLocation, anyDialogBusy]);

  const isBusy = (key: string) => Boolean(busyKeys[key]);

  /**
   * Run one write under a named key: the originating control shows a spinner,
   * ignores repeat clicks, reports through a toast, and refreshes the matrix.
   */
  const runAction = async (
    key: string,
    action: () => Promise<unknown>,
    opts: { success: string; failure: string; hydrateMilestones?: boolean }
  ): Promise<boolean> => {
    if (busyKeys[key]) return false;
    setBusyKeys((prev) => ({ ...prev, [key]: true }));
    try {
      await action();
      pushToast('success', opts.success);
      await fetchConfig({ hydrateMilestones: opts.hydrateMilestones });
      return true;
    } catch (err) {
      console.error(err);
      pushToast('error', toMessage(err, opts.failure));
      return false;
    } finally {
      setBusyKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleUpdatePackage = async (
    id: number,
    slug: string,
    standardRate: number,
    volumeRate: number,
    threshold: number,
    headroomRate?: number,
    name?: string,
    tagline?: string,
    highlights?: string[],
    isRecommended?: boolean
  ) => {
    if (!name || name.trim().length < 2) {
      pushToast('error', 'Package display name must be at least 2 characters.');
      return;
    }
    const invalid = [
      ['Standard rate', standardRate],
      ['Volume rate', volumeRate],
      ['Volume threshold', threshold],
    ].find(([, v]) => !Number.isFinite(v as number) || (v as number) < 0);
    if (invalid) {
      pushToast('error', `${invalid[0]} must be a valid non-negative number.`);
      return;
    }

    await runAction(
      `pkg:${slug}`,
      () =>
        Promise.all([
          updatePackagePricing(id, {
            pricePerSqft: standardRate,
            volumePricePerSqft: volumeRate,
            volumeDiscountThresholdSqft: threshold,
            headRoomPricePerSqft: headroomRate,
          }),
          updatePackageMetadata(id, { name, tagline, highlights, isRecommended }),
        ]),
      {
        success: `Saved ${name || slug} package configuration.`,
        failure: `Failed to update the ${name || slug} package.`,
      }
    );
  };

  const handleUpdateLocation = async (id: number, name: string, mult: number) => {
    if (!Number.isFinite(mult) || mult <= 0) {
      pushToast('error', `Enter a valid multiplier for ${name}.`);
      return;
    }
    if (name.trim().length < 2) {
      pushToast('error', 'City name must be at least 2 characters.');
      return;
    }
    await runAction(
      `loc:${id}`,
      () => updateLocationMultiplier(id, { name: name.trim(), priceMultiplier: mult }),
      {
        success: `${name} saved at ${mult.toFixed(2)}× multiplier.`,
        failure: `Failed to update ${name}.`,
      }
    );
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim() || !newLocationSlug.trim()) return;
    setCreatingLocation(true);
    const name = newLocationName.trim();
    const ok = await runAction(
      'loc:create',
      () =>
        createLocation({
          name,
          slug: newLocationSlug.trim().toLowerCase().replace(/\s+/g, '_'),
          priceMultiplier: Number(newLocationMultiplier),
        }),
      { success: `Location '${name}' added.`, failure: 'Failed to create the location.' }
    );
    setCreatingLocation(false);
    if (ok) {
      setShowAddLocationModal(false);
      setNewLocationName('');
      setNewLocationSlug('');
      setNewLocationMultiplier(1.0);
    }
  };

  const handleDeleteLocation = async (id: number, name: string) => {
    setConfirm({
      title: 'Delete city multiplier',
      body: `'${name}' will be removed from the calculator's city list. Estimates already saved against it are not affected. This cannot be undone.`,
      confirmLabel: 'Delete city',
      onConfirm: () =>
        runAction(`loc:${id}`, () => deleteLocation(id), {
          success: `Location '${name}' deleted.`,
          failure: `Failed to delete '${name}'.`,
        }),
    });
  };

  const handleUpdateAddonPrice = async (
    addonId: number,
    addonName: string,
    variantSlug: string,
    variantName: string,
    price: number
  ) => {
    if (!Number.isFinite(price) || price < 0) {
      pushToast('error', `${variantName}: price must be a valid non-negative number.`);
      return;
    }
    await runAction(
      `addon:${addonId}:${variantSlug}`,
      () => updateAddonVariantPricing(addonId, { variantSlug, price }),
      {
        success: `${addonName} — ${variantName} set to ₹${price.toFixed(2)}.`,
        failure: `Failed to update the price for ${variantName}.`,
      }
    );
  };

  // Add-On Catalog Handlers
  /** Packages a variant can be scoped to, in catalogue order. */
  const packageChoices = useMemo(
    () => (config?.packages ?? []).map((p) => ({ slug: p.slug, name: p.name })),
    [config?.packages]
  );
  const allPackageSlugs = useMemo(() => packageChoices.map((p) => p.slug), [packageChoices]);

  const openCreateAddon = () => {
    setAddonForm({ ...EMPTY_ADDON_FORM, sortOrder: (config?.addons.length ?? 0) + 1 });
    // Default to every package — the common case, and narrowing is one click.
    setAddonVariantsDraft([{ ...EMPTY_VARIANT_FORM, packageTiers: [...allPackageSlugs] }]);
    setAddonDialog({ mode: 'create' });
  };

  const openEditAddon = (addon: AdminAddon) => {
    setAddonForm({
      name: addon.name,
      slug: addon.slug,
      description: addon.description ?? '',
      pricingUnit: (ADDON_PRICING_UNITS as readonly string[]).includes(addon.pricingUnit)
        ? (addon.pricingUnit as AddonPricingUnitKey)
        : 'fixed',
      defaultQuantity: addon.defaultQuantity ?? '',
      minQuantity: addon.minQuantity ?? '',
      maxQuantity: addon.maxQuantity ?? '',
      sortOrder: addon.sortOrder ?? 0,
    });
    setAddonDialog({ mode: 'edit', addon });
  };

  const handleSubmitAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonDialog) return;
    const name = addonForm.name.trim();
    const slug = slugify(addonForm.slug);
    if (name.length < 2 || slug.length < 2) {
      pushToast('error', 'Add-on needs a name and a slug of at least 2 characters.');
      return;
    }

    const quantities = {
      defaultQuantity: toOptionalNumber(addonForm.defaultQuantity),
      minQuantity: toOptionalNumber(addonForm.minQuantity),
      maxQuantity: toOptionalNumber(addonForm.maxQuantity),
    };
    if (
      quantities.minQuantity !== undefined &&
      quantities.maxQuantity !== undefined &&
      quantities.minQuantity > quantities.maxQuantity
    ) {
      pushToast('error', 'Minimum quantity cannot exceed the maximum quantity.');
      return;
    }

    if (addonDialog.mode === 'create') {
      const variants: AddonVariantPayload[] = [];
      const seen = new Set<string>();
      for (const draft of addonVariantsDraft) {
        const variantName = draft.variantName.trim();
        const variantSlug = slugify(draft.variantSlug);
        if (!variantName || variantSlug.length < 2) {
          pushToast('error', 'Every price variant needs a name and a slug of at least 2 characters.');
          return;
        }
        if (seen.has(variantSlug)) {
          pushToast('error', `Variant slug '${variantSlug}' is used twice. Each needs its own slug.`);
          return;
        }
        if (draft.packageTiers.length === 0) {
          pushToast('error', `'${variantName}': select at least one package it is available in.`);
          return;
        }
        seen.add(variantSlug);
        variants.push({
          variantName,
          variantSlug,
          price: Math.max(0, Number(draft.price) || 0),
          packageTiers: draft.packageTiers,
        });
      }
      if (variants.length === 0) {
        pushToast('error', 'Add at least one price variant.');
        return;
      }

      setSavingAddon(true);
      const ok = await runAction(
        'addon:create',
        () =>
          createAddon({
            name,
            slug,
            description: addonForm.description.trim(),
            pricingUnit: addonForm.pricingUnit,
            sortOrder: addonForm.sortOrder,
            isActive: true,
            variants,
            ...quantities,
          }),
        {
          success: `Add-on '${name}' created with ${variants.length} variant${
            variants.length === 1 ? '' : 's'
          }.`,
          failure: 'Failed to create the add-on.',
        }
      );
      setSavingAddon(false);
      if (ok) setAddonDialog(null);
      return;
    }

    setSavingAddon(true);
    const ok = await runAction(
      `addon:${addonDialog.addon.id}`,
      () =>
        updateAddonMetadata(addonDialog.addon.id, {
          name,
          description: addonForm.description.trim(),
          pricingUnit: addonForm.pricingUnit,
          sortOrder: addonForm.sortOrder,
          defaultQuantity: quantities.defaultQuantity ?? null,
          minQuantity: quantities.minQuantity ?? null,
          maxQuantity: quantities.maxQuantity ?? null,
        }),
      { success: `Add-on '${name}' updated.`, failure: `Failed to update '${name}'.` }
    );
    setSavingAddon(false);
    if (ok) setAddonDialog(null);
  };

  const handleDeleteAddon = (addon: AdminAddon) => {
    setConfirm({
      title: 'Delete add-on',
      body: `'${addon.name}' and its ${addon.activePrices.length} price variant${
        addon.activePrices.length === 1 ? '' : 's'
      } will be removed from the cost calculator. This cannot be undone.`,
      confirmLabel: 'Delete add-on',
      onConfirm: () =>
        runAction(`addon:${addon.id}`, () => deleteAddon(addon.id), {
          success: `Add-on '${addon.name}' deleted.`,
          failure: `Failed to delete '${addon.name}'.`,
        }),
    });
  };

  const openCreateVariant = (addon: AdminAddon) => {
    setVariantForm({ ...EMPTY_VARIANT_FORM, packageTiers: [...allPackageSlugs] });
    setVariantDialog({ addon });
  };

  const handleSubmitVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantDialog) return;
    const variantName = variantForm.variantName.trim();
    const variantSlug = slugify(variantForm.variantSlug);
    if (!variantName || variantSlug.length < 2) {
      pushToast('error', 'Variant needs a name and a slug of at least 2 characters.');
      return;
    }
    if (variantForm.packageTiers.length === 0) {
      pushToast('error', 'Select at least one package this variant is available in.');
      return;
    }

    setSavingVariant(true);
    const ok = await runAction(
      `addon:${variantDialog.addon.id}:variant:create`,
      () =>
        createAddonVariant(variantDialog.addon.id, {
          variantName,
          variantSlug,
          price: Math.max(0, Number(variantForm.price) || 0),
          packageTiers: variantForm.packageTiers,
        }),
      {
        success: `Variant '${variantName}' added to ${variantDialog.addon.name}.`,
        failure: 'Failed to add the price variant.',
      }
    );
    setSavingVariant(false);
    if (ok) setVariantDialog(null);
  };

  const handleDeleteVariant = (addon: AdminAddon, variantId: number, variantName: string) => {
    setConfirm({
      title: 'Delete price variant',
      body: `'${variantName}' will no longer be selectable under ${addon.name} in the cost calculator. This cannot be undone.`,
      confirmLabel: 'Delete variant',
      onConfirm: () =>
        runAction(`addon:${addon.id}:variant:${variantId}`, () => deleteAddonVariant(addon.id, variantId), {
          success: `Variant '${variantName}' deleted.`,
          failure: `Failed to delete '${variantName}'.`,
        }),
    });
  };

  // Specifications Handlers
  const handleUpdateOptionPriceDelta = async (
    optionId: number,
    brandName: string,
    priceDelta: number
  ) => {
    if (!Number.isFinite(priceDelta) || priceDelta < 0) {
      pushToast('error', `${brandName}: rate delta must be a valid non-negative number.`);
      return;
    }
    const safeDelta = Math.max(0, priceDelta);
    await runAction(
      `opt:${optionId}`,
      () => updateOptionPricing(optionId, { priceDelta: safeDelta, name: brandName }),
      {
        success: `${brandName} rate delta set to +₹${safeDelta}/sq.ft.`,
        failure: `Failed to update the ${brandName} rate delta.`,
      }
    );
  };

  const openCreateOption = (itemId: number, itemName: string) => {
    setOptionForm(EMPTY_OPTION_FORM);
    setOptionDialog({ mode: 'create', itemId, itemName });
  };

  const openEditOption = (option: BrandOption, itemName: string) => {
    setOptionForm({
      name: option.brandName,
      slug: option.slug,
      priceDelta: Number(option.activePrice?.priceDelta ?? 0),
      description: option.specification ?? '',
    });
    setOptionDialog({ mode: 'edit', option, itemName });
  };

  const handleSubmitOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionDialog) return;
    const name = optionForm.name.trim();
    const slug = slugify(optionForm.slug);
    if (!name || !slug) return;

    const delta = Math.max(0, Number(optionForm.priceDelta) || 0);
    const description = optionForm.description.trim();
    setCreatingOption(true);

    const ok =
      optionDialog.mode === 'create'
        ? await runAction(
            'opt:create',
            () =>
              createOption({
                itemId: optionDialog.itemId,
                name,
                slug,
                priceDelta: delta,
                description,
              }),
            {
              success: `Brand option '${name}' created.`,
              failure: 'Failed to create the brand option.',
            }
          )
        : await runAction(
            `opt:${optionDialog.option.id}`,
            () =>
              updateOptionPricing(optionDialog.option.id, {
                name,
                slug,
                description,
                priceDelta: delta,
              }),
            {
              success: `Brand option '${name}' updated.`,
              failure: `Failed to update '${name}'.`,
            }
          );

    setCreatingOption(false);
    if (ok) setOptionDialog(null);
  };

  const handleDeleteBrandOption = async (optionId: number, brandName: string, itemName: string) => {
    setConfirm({
      title: 'Delete brand option',
      body: `'${brandName}' will no longer be selectable under ${itemName} in the cost calculator. This cannot be undone.`,
      confirmLabel: 'Delete option',
      onConfirm: () =>
        runAction(`opt:${optionId}`, () => deleteOption(optionId), {
          success: `Brand option '${brandName}' deleted.`,
          failure: `Failed to delete '${brandName}'.`,
        }),
    });
  };

  // Category Handlers
  const openCreateCategory = () => {
    setCategoryForm({
      ...EMPTY_CATEGORY_FORM,
      // Append rather than collide with an existing position.
      sortOrder: (config?.categories.length ?? 0) + 1,
    });
    setCategoryDialog({ mode: 'create' });
  };

  const openEditCategory = (category: AdminSpecificationCategory) => {
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder ?? 0,
    });
    setCategoryDialog({ mode: 'edit', category });
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryDialog) return;
    const name = categoryForm.name.trim();
    const slug = slugify(categoryForm.slug);
    if (name.length < 2 || slug.length < 2) {
      pushToast('error', 'Category needs a name and a slug of at least 2 characters.');
      return;
    }

    setSavingCategory(true);
    const ok =
      categoryDialog.mode === 'create'
        ? await runAction(
            'cat:create',
            () => createCategory({ name, slug, sortOrder: categoryForm.sortOrder }),
            {
              success: `Category '${name}' created. Add components to it next.`,
              failure: 'Failed to create the category.',
            }
          )
        : await runAction(
            `cat:${categoryDialog.category.id}`,
            () =>
              updateCategory(categoryDialog.category.id, {
                name,
                slug,
                sortOrder: categoryForm.sortOrder,
              }),
            {
              success: `Category '${name}' updated.`,
              failure: `Failed to update '${name}'.`,
            }
          );

    setSavingCategory(false);
    if (ok) setCategoryDialog(null);
  };

  const handleDeleteCategory = (category: AdminSpecificationCategory) => {
    const itemCount = category.items?.length ?? 0;
    setConfirm({
      title: 'Delete specification category',
      body:
        itemCount > 0
          ? `'${category.name}' and its ${itemCount} component${
              itemCount === 1 ? '' : 's'
            } (with every brand option under them) will be removed from the cost calculator. This cannot be undone.`
          : `'${category.name}' will be removed from the specifications matrix. This cannot be undone.`,
      confirmLabel: 'Delete category',
      onConfirm: async () => {
        const ok = await runAction(`cat:${category.id}`, () => deleteCategory(category.id), {
          success: `Category '${category.name}' deleted.`,
          failure: `Failed to delete '${category.name}'.`,
        });
        // The filter pill pointed at a category that no longer exists.
        if (ok && selectedSpecCategoryId === category.id) setSelectedSpecCategoryId('ALL');
        return ok;
      },
    });
  };

  // Component (item) Handlers
  const openCreateItem = (categoryId: number, categoryName: string) => {
    const category = config?.categories.find((c) => c.id === categoryId);
    setItemForm({
      ...EMPTY_ITEM_FORM,
      categoryId,
      sortOrder: (category?.items?.length ?? 0) + 1,
    });
    setItemDialog({ mode: 'create', categoryId, categoryName });
  };

  const openEditItem = (item: AdminSpecificationItem) => {
    setItemForm({
      categoryId: item.categoryId,
      name: item.name,
      slug: item.slug,
      description: item.description ?? '',
      unit: (ITEM_UNITS as readonly string[]).includes(item.unit)
        ? (item.unit as ItemUnit)
        : 'sqft',
      isCustomizable: item.isCustomizable,
      sortOrder: item.sortOrder ?? 0,
    });
    setItemDialog({ mode: 'edit', item });
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDialog) return;
    const name = itemForm.name.trim();
    const slug = slugify(itemForm.slug);
    if (name.length < 2 || slug.length < 2) {
      pushToast('error', 'Component needs a name and a slug of at least 2 characters.');
      return;
    }

    setSavingItem(true);
    const ok =
      itemDialog.mode === 'create'
        ? await runAction(
            'item:create',
            () =>
              createItem({
                categoryId: itemForm.categoryId,
                name,
                slug,
                description: itemForm.description.trim(),
                unit: itemForm.unit,
                isCustomizable: itemForm.isCustomizable,
                sortOrder: itemForm.sortOrder,
              }),
            {
              success: `Component '${name}' created. Add brand options to it next.`,
              failure: 'Failed to create the component.',
            }
          )
        : await runAction(
            `item:${itemDialog.item.id}`,
            () =>
              updateItem(itemDialog.item.id, {
                categoryId: itemForm.categoryId,
                name,
                slug,
                description: itemForm.description.trim() || null,
                unit: itemForm.unit,
                isCustomizable: itemForm.isCustomizable,
                sortOrder: itemForm.sortOrder,
              }),
            {
              success: `Component '${name}' updated.`,
              failure: `Failed to update '${name}'.`,
            }
          );

    setSavingItem(false);
    if (ok) setItemDialog(null);
  };

  const handleDeleteItem = (item: AdminSpecificationItem) => {
    const optionCount = item.options?.length ?? 0;
    setConfirm({
      title: 'Delete specification component',
      body:
        optionCount > 0
          ? `'${item.name}' and its ${optionCount} brand option${
              optionCount === 1 ? '' : 's'
            } will be removed from the cost calculator. This cannot be undone.`
          : `'${item.name}' will be removed from the cost calculator. This cannot be undone.`,
      confirmLabel: 'Delete component',
      onConfirm: () =>
        runAction(`item:${item.id}`, () => deleteItem(item.id), {
          success: `Component '${item.name}' deleted.`,
          failure: `Failed to delete '${item.name}'.`,
        }),
    });
  };

  // Milestones Handlers
  const handleMilestoneFieldChange = (
    index: number,
    field: keyof MilestoneFormItem,
    value: string | number
  ) => {
    setMilestonesState((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === 'percentage' ? (value === '' ? 0 : Number(value)) : value,
      };
      return next;
    });
  };

  /**
   * Stage numbers are the schedule's identity — the PUT upserts on them and
   * prunes anything absent — so both add and remove keep them contiguous from 1
   * rather than leaving a hole where a deleted stage used to be.
   */
  const renumberStages = (stages: MilestoneFormItem[]): MilestoneFormItem[] =>
    stages.map((stage, i) => ({ ...stage, stageNumber: i + 1 }));

  const handleAddMilestoneStage = () => {
    setMilestonesState((prev) =>
      renumberStages([
        ...prev,
        {
          stageNumber: prev.length + 1,
          stageName: '',
          percentage: 0,
          keyDeliverables: '',
          isActive: true,
        },
      ])
    );
  };

  const handleRemoveMilestoneStage = (index: number) => {
    setMilestonesState((prev) => renumberStages(prev.filter((_, i) => i !== index)));
  };

  const milestoneTotalPercentage = milestonesState
    .filter((m) => m.isActive !== false)
    .reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);

  const roundedTotal = Math.round(milestoneTotalPercentage * 100) / 100;
  const is100Percent = Math.abs(roundedTotal - 100) < 0.01;

  const areMilestonesValid =
    is100Percent &&
    milestonesState.length > 0 &&
    milestonesState.every(
      (m) =>
        m.stageName.trim().length >= 2 &&
        m.keyDeliverables.trim().length >= 3 &&
        m.percentage > 0
    );

  const handleSaveMilestones = async () => {
    if (!areMilestonesValid) return;
    setSavingMilestones(true);
    await runAction(
      'milestones',
      () =>
        updateMilestones({
          milestones: milestonesState.map((m) => ({
            id: m.id,
            stageNumber: m.stageNumber,
            stageName: m.stageName.trim(),
            percentage: Number(m.percentage),
            keyDeliverables: m.keyDeliverables.trim(),
            isActive: m.isActive !== false,
          })),
        }),
      {
        success: 'Milestone payment schedule saved — allocation verified at 100.00%.',
        failure: 'Failed to update the milestone stages.',
        hydrateMilestones: true,
      }
    );
    setSavingMilestones(false);
  };

  const packages = config?.packages;
  const addons = config?.addons;
  const categories = config?.categories;

  const filteredPackages = useMemo(() => {
    if (!packages) return [];
    if (selectedPkgFilter === 'ALL') return packages;
    return packages.filter((p) => p.slug === selectedPkgFilter);
  }, [packages, selectedPkgFilter]);

  const filteredAddons = useMemo(() => {
    if (!addons) return [];
    return addons.filter(
      (a) =>
        (selectedAddonCategory === 'ALL' || getAddonCategory(a.slug) === selectedAddonCategory) &&
        matches([a.name, a.slug, a.description], addonSearch)
    );
  }, [addons, selectedAddonCategory, addonSearch]);

  /** Category counts drive the pill labels; only non-empty pills are offered. */
  const addonCategoryCounts = useMemo(() => {
    const counts: Record<AddonCategory, number> = {
      water: 0,
      power: 0,
      security: 0,
      smart_home: 0,
      other: 0,
    };
    (addons ?? []).forEach((a) => {
      counts[getAddonCategory(a.slug)] += 1;
    });
    return counts;
  }, [addons]);

  const specCategories = useMemo(() => categories ?? [], [categories]);

  const totalSpecItems = useMemo(
    () => specCategories.reduce((sum, c) => sum + (c.items?.length ?? 0), 0),
    [specCategories]
  );

  /**
   * Categories narrowed by the pill filter and then by the search box, keeping
   * the category grouping so 'All categories' stays navigable. Search also
   * looks through brand options, so 'Ramco' finds the component that offers it.
   *
   * An empty category is only hidden while a search is running: a category the
   * operator has just created has no components yet, and dropping it from the
   * list would make the Add Category button look like it did nothing.
   */
  const visibleSpecCategories = useMemo(() => {
    const searching = specSearch.trim().length > 0;
    return specCategories
      .filter((c) => selectedSpecCategoryId === 'ALL' || c.id === selectedSpecCategoryId)
      .map((c) => ({
        ...c,
        items: (c.items ?? []).filter((item) =>
          matches(
            [
              item.name,
              item.slug,
              item.description,
              item.unit,
              ...item.options.map((o) => o.brandName),
              ...item.options.map((o) => o.slug),
            ],
            specSearch
          )
        ),
      }))
      .filter((c) => !searching || c.items.length > 0);
  }, [specCategories, selectedSpecCategoryId, specSearch]);

  const visibleSpecItemCount = useMemo(
    () => visibleSpecCategories.reduce((sum, c) => sum + c.items.length, 0),
    [visibleSpecCategories]
  );

  /** Denominator for 'showing X of Y' — the pill's scope, before the search. */
  const specScopeItemCount = useMemo(() => {
    if (selectedSpecCategoryId === 'ALL') return totalSpecItems;
    return specCategories.find((c) => c.id === selectedSpecCategoryId)?.items?.length ?? 0;
  }, [specCategories, selectedSpecCategoryId, totalSpecItems]);

  if (loading) {
    return (
      <div className="py-20 text-center calculator-card">
        <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
        <p className="text-xs text-muted">Loading pricing configuration matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Dynamic Pricing Matrix</h2>
          <p className="text-xs text-muted">
            Configure live construction rates, volume thresholds, city multipliers, material specifications, add-on variants, and milestone schedules
          </p>
        </div>
      </div>

      {/* Main Section Navigation Bar */}
      <div role="tablist" aria-label="Pricing matrix sections" className="flex gap-2 overflow-x-auto pb-1 border-b border-border">
        <button
          type="button"
          role="tab"
          onClick={() => handleSectionChange('packages')}
          aria-selected={activeSection === 'packages'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t text-xs font-bold transition-all border-b-2 ${
            activeSection === 'packages'
              ? 'border-foreground text-foreground bg-surface font-extrabold shadow-sm'
              : 'border-transparent text-muted hover:text-foreground hover:bg-surface/50'
          }`}
        >
          <Layers size={15} />
          <span>Package Tiers ({config?.packages.length ?? 0})</span>
        </button>

        <button
          type="button"
          role="tab"
          onClick={() => handleSectionChange('specifications')}
          aria-selected={activeSection === 'specifications'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t text-xs font-bold transition-all border-b-2 ${
            activeSection === 'specifications'
              ? 'border-foreground text-foreground bg-surface font-extrabold shadow-sm'
              : 'border-transparent text-muted hover:text-foreground hover:bg-surface/50'
          }`}
        >
          <Boxes size={15} />
          <span>Specifications Matrix ({config?.categories.length ?? 0})</span>
        </button>

        <button
          type="button"
          role="tab"
          onClick={() => handleSectionChange('addons')}
          aria-selected={activeSection === 'addons'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t text-xs font-bold transition-all border-b-2 ${
            activeSection === 'addons'
              ? 'border-foreground text-foreground bg-surface font-extrabold shadow-sm'
              : 'border-transparent text-muted hover:text-foreground hover:bg-surface/50'
          }`}
        >
          <Wrench size={15} />
          <span>Add-Ons Catalog ({config?.addons.length ?? 0})</span>
        </button>

        <button
          type="button"
          role="tab"
          onClick={() => handleSectionChange('locations')}
          aria-selected={activeSection === 'locations'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t text-xs font-bold transition-all border-b-2 ${
            activeSection === 'locations'
              ? 'border-foreground text-foreground bg-surface font-extrabold shadow-sm'
              : 'border-transparent text-muted hover:text-foreground hover:bg-surface/50'
          }`}
        >
          <MapPin size={15} />
          <span>City Multipliers ({config?.locations.length ?? 0})</span>
        </button>

        <button
          type="button"
          role="tab"
          onClick={() => handleSectionChange('milestones')}
          aria-selected={activeSection === 'milestones'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t text-xs font-bold transition-all border-b-2 ${
            activeSection === 'milestones'
              ? 'border-foreground text-foreground bg-surface font-extrabold shadow-sm'
              : 'border-transparent text-muted hover:text-foreground hover:bg-surface/50'
          }`}
        >
          <MilestoneIcon size={15} />
          <span>Milestone Schedule ({config?.milestones.length ?? 10})</span>
        </button>
      </div>

      {/* SECTION 1: PACKAGES */}
      {activeSection === 'packages' && (
        <div className="space-y-6">
          <div className="admin-toolbar flex items-center justify-between gap-4 flex-wrap">
            <div role="tablist" aria-label="Package tiers" className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-muted uppercase mr-1 flex items-center gap-1 shrink-0">
                <Sliders size={12} /> Filter:
              </span>
              {[
                { id: 'ALL', label: 'All Packages' },
                { id: 'basic', label: 'Basic Package' },
                { id: 'standard', label: 'Standard Package' },
                { id: 'premium', label: 'Premium Package' },
                { id: 'luxury', label: 'Luxury Package' },
              ].map((tab) => {
                const isActive = selectedPkgFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedPkgFilter(tab.id as PackageFilter)}
                    className={`admin-pill ${isActive ? 'admin-pill--active' : ''}`}
                  >
                    {tab.id === 'ALL' && <LayoutGrid size={12} />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-muted font-mono">
              Showing {filteredPackages.length} of {config?.packages.length ?? 0} tiers
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.slug}
                className="calculator-card p-6 border border-border bg-surface flex flex-col justify-between space-y-5 shadow-sm"
              >
                <div className="pb-3 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-foreground inline-block" />
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-surface-active text-muted border border-border">
                          slug: {pkg.slug}
                        </span>
                        {pkg.isRecommended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted font-bold block mb-1">
                            Package Display Name
                          </label>
                          <input
                            type="text"
                            defaultValue={pkg.name}
                            id={`pkg-name-${pkg.slug}`}
                            className="form-input text-xs font-bold"
                            placeholder="e.g. Premium Package"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted font-bold block mb-1">
                            Tagline / Subtitle
                          </label>
                          <input
                            type="text"
                            defaultValue={pkg.tagline ?? ''}
                            id={`pkg-tagline-${pkg.slug}`}
                            className="form-input text-xs"
                            placeholder="e.g. Best Value / Most Popular"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={pkg.isRecommended ?? (pkg.slug === 'premium')}
                          id={`pkg-rec-${pkg.slug}`}
                          className="calculator-checkbox"
                        />
                        <span className="text-[11px] font-semibold text-foreground">
                          Mark as &quot;Recommended / Most Popular&quot; tier on cost calculator
                        </span>
                      </label>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-muted block">Active Base Rate</span>
                      <span className="text-base font-mono font-bold text-foreground">
                        {pkg.activePrice?.pricePerSqft ? `₹${pkg.activePrice.pricePerSqft}` : '—'}
                        <span className="text-xs font-normal text-muted"> / sq.ft</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                      1. Core Base & Volume Discount Pricing
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-muted font-bold block mb-1">
                          Standard Rate (₹/sq.ft)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pkg.activePrice?.pricePerSqft ?? ''}
                          id={`pkg-std-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 2099.00"
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') e.preventDefault();
                          }}
                          onInput={(e) => {
                            const val = parseFloat(e.currentTarget.value);
                            if (!isNaN(val) && val < 0) e.currentTarget.value = '0';
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted font-bold block mb-1">
                          Volume Rate (₹/sq.ft)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pkg.activePrice?.volumePricePerSqft ?? ''}
                          id={`pkg-vol-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 2000.00"
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') e.preventDefault();
                          }}
                          onInput={(e) => {
                            const val = parseFloat(e.currentTarget.value);
                            if (!isNaN(val) && val < 0) e.currentTarget.value = '0';
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted font-bold block mb-1">
                          Volume Threshold (Sq.Ft)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          defaultValue={pkg.activePrice?.volumeDiscountThresholdSqft ?? ''}
                          id={`pkg-thresh-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 3500"
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') e.preventDefault();
                          }}
                          onInput={(e) => {
                            const val = parseFloat(e.currentTarget.value);
                            if (!isNaN(val) && val < 0) e.currentTarget.value = '0';
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                      2. Structural Add-on Pricing
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted font-bold block mb-1">
                          Headroom Rate (₹/sq.ft)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pkg.activePrice?.headRoomPricePerSqft ?? ''}
                          id={`pkg-head-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 1650.00"
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') e.preventDefault();
                          }}
                          onInput={(e) => {
                            const val = parseFloat(e.currentTarget.value);
                            if (!isNaN(val) && val < 0) e.currentTarget.value = '0';
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-[11px] text-muted pb-2">
                          Applies to overhead stair headrooms & utility access structures.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                        3. Feature Highlights & Inclusions (Bullet Points)
                      </span>
                      <span className="text-[10px] text-muted font-mono">1 item per line</span>
                    </div>
                    <textarea
                      rows={8}
                      defaultValue={(pkg.highlights || []).join('\n')}
                      id={`pkg-highlights-${pkg.slug}`}
                      className="form-input text-xs font-sans leading-relaxed"
                      placeholder="Enter one feature highlight per line..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBusy(`pkg:${pkg.slug}`)}
                  onClick={() => {
                    const std = Number((document.getElementById(`pkg-std-${pkg.slug}`) as HTMLInputElement)?.value);
                    const vol = Number((document.getElementById(`pkg-vol-${pkg.slug}`) as HTMLInputElement)?.value);
                    const thresh = Number((document.getElementById(`pkg-thresh-${pkg.slug}`) as HTMLInputElement)?.value);
                    const head = Number((document.getElementById(`pkg-head-${pkg.slug}`) as HTMLInputElement)?.value);
                    const name = (document.getElementById(`pkg-name-${pkg.slug}`) as HTMLInputElement)?.value.trim();
                    const tagline = (document.getElementById(`pkg-tagline-${pkg.slug}`) as HTMLInputElement)?.value.trim();
                    const isRecommended = (document.getElementById(`pkg-rec-${pkg.slug}`) as HTMLInputElement)?.checked;
                    const rawHighlights = (document.getElementById(`pkg-highlights-${pkg.slug}`) as HTMLTextAreaElement)?.value;
                    const highlights = rawHighlights
                      ? rawHighlights.split('\n').map((l) => l.trim()).filter(Boolean)
                      : [];
                    handleUpdatePackage(pkg.id, pkg.slug, std, vol, thresh, head, name, tagline, highlights, isRecommended);
                  }}
                  className="button button--solid w-full text-xs py-2.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  {isBusy(`pkg:${pkg.slug}`) ? (
                    <>
                      <Loader2 size={14} className="animate-spin shrink-0" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} className="shrink-0" />
                      <span>Save {pkg.name} Configuration</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: SPECIFICATIONS & BRAND CHOICES MATRIX */}
      {activeSection === 'specifications' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm">Material Specifications & Brand Upgrade Matrix</h3>
              <p className="text-xs text-muted">
                Manage categories, customizable components, brand options, and rate deltas per sq.ft
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateCategory}
              className="button button--solid text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <FolderPlus size={14} />
              <span>Add New Category</span>
            </button>
          </div>

          {/* Category filter — pills matched to the other matrix tabs, plus a
              search that also reaches into brand names. */}
          <div className="admin-toolbar space-y-2.5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div
                role="tablist"
                aria-label="Specification categories"
                className="flex items-center gap-1.5 flex-wrap"
              >
                <span className="text-[11px] font-bold text-muted uppercase mr-1 flex items-center gap-1 shrink-0">
                  <Sliders size={12} /> Category:
                </span>

                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedSpecCategoryId === 'ALL'}
                  onClick={() => setSelectedSpecCategoryId('ALL')}
                  className={`admin-pill ${selectedSpecCategoryId === 'ALL' ? 'admin-pill--active' : ''}`}
                >
                  <LayoutGrid size={12} />
                  <span>All Categories</span>
                  <span className="admin-pill__count">{totalSpecItems}</span>
                </button>

                {specCategories.map((cat) => {
                  const isActive = selectedSpecCategoryId === cat.id;
                  const count = cat.items?.length ?? 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedSpecCategoryId(cat.id)}
                      className={`admin-pill ${isActive ? 'admin-pill--active' : ''}`}
                      title={`${cat.name} — ${count} component${count === 1 ? '' : 's'}`}
                    >
                      <span>{cat.name}</span>
                      <span className="admin-pill__count">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="admin-search w-56">
                  <span className="admin-search__icon">
                    <Search size={13} />
                  </span>
                  <input
                    type="search"
                    value={specSearch}
                    onChange={(e) => setSpecSearch(e.target.value)}
                    placeholder="Search components or brands…"
                    aria-label="Search specification components"
                    className="form-input text-xs"
                  />
                  {specSearch && (
                    <button
                      type="button"
                      onClick={() => setSpecSearch('')}
                      aria-label="Clear search"
                      className="admin-search__clear"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-muted font-mono whitespace-nowrap">
                  Showing {visibleSpecItemCount} of {specScopeItemCount} components
                </span>
              </div>
            </div>
          </div>

          {visibleSpecCategories.length === 0 ? (
            <div className="calculator-card p-10 text-center">
              <SearchX className="w-7 h-7 text-muted mx-auto mb-3" />
              <p className="text-sm font-bold mb-1">
                {specCategories.length === 0
                  ? 'No specification categories yet'
                  : 'No components match this view'}
              </p>
              <p className="text-xs text-muted mb-4">
                {specCategories.length === 0
                  ? 'Create a category first, then add the components and brand options that sit under it.'
                  : specSearch
                    ? `Nothing in ${
                        selectedSpecCategoryId === 'ALL'
                          ? 'any category'
                          : specCategories.find((c) => c.id === selectedSpecCategoryId)?.name
                      } matches “${specSearch}”.`
                    : 'This category has no components configured yet.'}
              </p>
              {specCategories.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateCategory}
                  className="button button--solid text-xs inline-flex items-center gap-1.5"
                >
                  <FolderPlus size={13} />
                  <span>Add New Category</span>
                </button>
              ) : (
                (specSearch || selectedSpecCategoryId !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpecSearch('');
                      setSelectedSpecCategoryId('ALL');
                    }}
                    className="button button--ghost text-xs"
                  >
                    Reset filters
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {visibleSpecCategories.map((category) => (
                <section key={category.id} className="space-y-3">
                  {/* The heading carries the category's own CRUD, so it renders
                      even when a single category is filtered into view. */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Circle size={7} className="fill-current text-primary shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      {category.name}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted bg-surface-active border border-border">
                      {category.slug}
                    </span>
                    <span className="text-[11px] text-muted font-mono">
                      {category.items.length}
                    </span>
                    <span className="h-px flex-1 bg-border min-w-4" />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openCreateItem(category.id, category.name)}
                        className="button button--ghost text-[11px] py-1 px-2.5 flex items-center gap-1"
                      >
                        <Plus size={12} />
                        <span>Add Component</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditCategory(category)}
                        className="text-muted hover:text-foreground p-1.5 transition-colors"
                        aria-label={`Edit category ${category.name}`}
                        title={`Edit ${category.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="text-muted hover:text-red-600 p-1.5 transition-colors"
                        aria-label={`Delete category ${category.name}`}
                        title={`Delete ${category.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {category.items.length === 0 && (
                    <div className="calculator-card p-6 text-center border-dashed">
                      <p className="text-xs text-muted mb-3">
                        No components in {category.name} yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => openCreateItem(category.id, category.name)}
                        className="button button--ghost text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>Add the first component</span>
                      </button>
                    </div>
                  )}

                  {category.items.map((item) => (
                    <div key={item.id} className="calculator-card p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-foreground">
                              {item.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-active text-muted border border-border">
                              unit: {item.unit}
                            </span>
                            {item.isCustomizable ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/30">
                                Customizable
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-active text-muted border border-border">
                                Fixed
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted mt-0.5">{item.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 self-start sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => openCreateOption(item.id, item.name)}
                            className="button button--ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            <Plus size={13} />
                            <span>Add Brand Option</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditItem(item)}
                            className="text-muted hover:text-foreground p-1.5 transition-colors"
                            aria-label={`Edit component ${item.name}`}
                            title={`Edit ${item.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="text-muted hover:text-red-600 p-1.5 transition-colors"
                            aria-label={`Delete component ${item.name}`}
                            title={`Delete ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Brand Options */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                          Brand Choices & Upgrade Price Deltas ({item.options.length})
                        </span>

                        {item.options.length === 0 ? (
                          <p className="text-xs text-muted italic">
                            No brand options configured for this component.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {item.options.map((opt) => {
                              const busy = isBusy(`opt:${opt.id}`);
                              return (
                                <div
                                  key={opt.id}
                                  className="p-3 rounded border border-border bg-background flex flex-col justify-between space-y-2.5 shadow-sm text-xs"
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0">
                                      <span className="font-bold text-foreground block truncate">
                                        {opt.brandName}
                                      </span>
                                      <span className="font-mono text-[10px] text-muted">
                                        {opt.slug}
                                      </span>
                                    </div>
                                    <div className="flex items-center shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => openEditOption(opt, item.name)}
                                        className="text-muted hover:text-foreground p-1 transition-colors"
                                        aria-label={`Edit brand option ${opt.brandName}`}
                                        title={`Edit ${opt.brandName}`}
                                      >
                                        <Pencil size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteBrandOption(opt.id, opt.brandName, item.name)
                                        }
                                        className="text-muted hover:text-red-600 p-1 transition-colors"
                                        aria-label={`Delete brand option ${opt.brandName}`}
                                        title={`Delete ${opt.brandName}`}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {opt.specification && (
                                    <p className="text-[11px] text-muted line-clamp-2">
                                      {opt.specification}
                                    </p>
                                  )}

                                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-[11px] pointer-events-none">
                                        +₹
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue={opt.activePrice?.priceDelta || 0}
                                        id={`opt-delta-${opt.id}`}
                                        aria-label={`Rate delta for ${opt.brandName}`}
                                        className="form-input text-xs pl-6 py-1 font-mono font-bold w-full"
                                        placeholder="0.00"
                                        onKeyDown={(e) => {
                                          if (e.key === '-' || e.key === 'e') {
                                            e.preventDefault();
                                          }
                                        }}
                                        onInput={(e) => {
                                          const val = parseFloat(e.currentTarget.value);
                                          if (!isNaN(val) && val < 0) {
                                            e.currentTarget.value = '0';
                                          }
                                        }}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => {
                                        const rawVal = (
                                          document.getElementById(
                                            `opt-delta-${opt.id}`
                                          ) as HTMLInputElement
                                        )?.value;
                                        const delta = Math.max(0, Number(rawVal) || 0);
                                        handleUpdateOptionPriceDelta(opt.id, opt.brandName, delta);
                                      }}
                                      className="button button--ghost text-[11px] py-1 px-2.5 shrink-0 disabled:opacity-50"
                                    >
                                      {busy ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <span>Save</span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ADD-ONS */}
      {activeSection === 'addons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm">Optional Add-Ons Catalog</h3>
              <p className="text-xs text-muted">
                Manage optional works, their pricing units, and the price variants customers pick from
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateAddon}
              className="button button--solid text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Plus size={14} />
              <span>Add New Add-On</span>
            </button>
          </div>

          <div className="admin-toolbar flex items-start justify-between gap-4 flex-wrap">
            <div role="tablist" aria-label="Add-on categories" className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-muted uppercase mr-1 flex items-center gap-1 shrink-0">
                <Sliders size={12} /> Category:
              </span>
              {(
                [
                  { id: 'ALL', label: 'All Add-Ons', icon: Wrench },
                  { id: 'water', label: 'Water & Drainage', icon: Droplets },
                  { id: 'power', label: 'Power & Solar', icon: Zap },
                  { id: 'security', label: 'Perimeter & Security', icon: Shield },
                  { id: 'smart_home', label: 'Automation & Lifts', icon: Home },
                  { id: 'other', label: 'Uncategorised', icon: Boxes },
                ] as const
              )
                // 'Uncategorised' exists only to surface add-ons whose slug the
                // category map does not know; hide the pill while there are none.
                .filter((cat) => cat.id !== 'other' || addonCategoryCounts.other > 0)
                .map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedAddonCategory === cat.id;
                  const count =
                    cat.id === 'ALL'
                      ? config?.addons.length ?? 0
                      : addonCategoryCounts[cat.id as AddonCategory];
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedAddonCategory(cat.id as AddonCategoryFilter)}
                      className={`admin-pill ${isActive ? 'admin-pill--active' : ''}`}
                    >
                      <Icon size={12} />
                      <span>{cat.label}</span>
                      <span className="admin-pill__count">{count}</span>
                    </button>
                  );
                })}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="admin-search w-56">
                <span className="admin-search__icon">
                  <Search size={13} />
                </span>
                <input
                  type="search"
                  value={addonSearch}
                  onChange={(e) => setAddonSearch(e.target.value)}
                  placeholder="Search add-ons..."
                  aria-label="Search add-ons"
                  className="form-input text-xs"
                />
                {addonSearch && (
                  <button
                    type="button"
                    onClick={() => setAddonSearch('')}
                    aria-label="Clear search"
                    className="admin-search__clear"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <span className="text-[11px] text-muted font-mono whitespace-nowrap">
                Showing {filteredAddons.length} of {config?.addons.length ?? 0} items
              </span>
            </div>
          </div>

          {filteredAddons.length === 0 && (
            <div className="calculator-card p-10 text-center">
              <SearchX className="w-7 h-7 text-muted mx-auto mb-3" />
              <p className="text-sm font-bold mb-1">
                {(config?.addons.length ?? 0) === 0
                  ? 'No add-ons in the catalog yet'
                  : 'No add-ons match this view'}
              </p>
              <p className="text-xs text-muted mb-4">
                {(config?.addons.length ?? 0) === 0
                  ? 'Create an add-on to offer it as optional work in the cost calculator.'
                  : 'Try a different category, or clear the search term.'}
              </p>
              {(config?.addons.length ?? 0) === 0 ? (
                <button
                  type="button"
                  onClick={openCreateAddon}
                  className="button button--solid text-xs inline-flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Add New Add-On</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddonSearch('');
                    setSelectedAddonCategory('ALL');
                  }}
                  className="button button--ghost text-xs"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAddons.map((addon) => (
              <div
                key={addon.slug}
                className="calculator-card p-5 rounded border border-border bg-surface space-y-3 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-foreground">{addon.name}</span>
                      <span className="text-[11px] font-mono text-muted block">{addon.slug}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-active text-muted border border-border">
                        {formatPricingUnit(addon.pricingUnit)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditAddon(addon)}
                        className="text-muted hover:text-foreground p-1 transition-colors"
                        aria-label={`Edit add-on ${addon.name}`}
                        title={`Edit ${addon.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddon(addon)}
                        className="text-muted hover:text-red-600 p-1 transition-colors"
                        aria-label={`Delete add-on ${addon.name}`}
                        title={`Delete ${addon.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {addon.description && (
                    <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1">
                      {addon.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                      Active Price Variants ({addon.activePrices.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateVariant(addon)}
                      className="button button--ghost text-[11px] py-1 px-2.5 flex items-center gap-1 shrink-0"
                    >
                      <Plus size={12} />
                      <span>Add Variant</span>
                    </button>
                  </div>

                  {addon.activePrices.length === 0 ? (
                    <p className="text-xs text-muted italic">No active price rows found.</p>
                  ) : (
                    <div className="space-y-2">
                      {addon.activePrices.map((variant) => (
                        <div
                          key={variant.id}
                          className="p-2.5 rounded bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-foreground truncate">
                              {variant.variantName}
                            </div>
                            <div className="text-[10px] text-muted flex items-center gap-2 flex-wrap">
                              <span className="font-mono">{variant.variantSlug}</span>
                              <span>•</span>
                              <span>{describeVariantScope(variant.packageTier, packageChoices)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="relative w-28">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-[11px]">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={variant.price}
                                id={`addon-${addon.id}-${variant.variantSlug}`}
                                className="form-input text-xs pl-5 py-1.5 font-mono font-bold"
                                onKeyDown={(e) => {
                                  if (e.key === '-' || e.key === 'e') e.preventDefault();
                                }}
                                onInput={(e) => {
                                  const val = parseFloat(e.currentTarget.value);
                                  if (!isNaN(val) && val < 0) e.currentTarget.value = '0';
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              disabled={isBusy(`addon:${addon.id}:${variant.variantSlug}`)}
                              onClick={() => {
                                const inputEl = document.getElementById(
                                  `addon-${addon.id}-${variant.variantSlug}`
                                ) as HTMLInputElement;
                                const price = Math.max(0, Number(inputEl?.value) || 0);
                                handleUpdateAddonPrice(
                                  addon.id,
                                  addon.name,
                                  variant.variantSlug,
                                  variant.variantName,
                                  price
                                );
                              }}
                              className="button button--solid text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-60"
                            >
                              {isBusy(`addon:${addon.id}:${variant.variantSlug}`) ? (
                                <Loader2 size={13} className="animate-spin shrink-0" />
                              ) : (
                                <Save size={13} className="shrink-0" />
                              )}
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy(`addon:${addon.id}:variant:${variant.id}`)}
                              onClick={() =>
                                handleDeleteVariant(addon, variant.id, variant.variantName)
                              }
                              className="text-muted hover:text-red-600 p-1 transition-colors disabled:opacity-50"
                              aria-label={`Delete variant ${variant.variantName}`}
                              title={
                                addon.activePrices.length <= 1
                                  ? 'An add-on must keep at least one variant — delete the add-on instead'
                                  : `Delete ${variant.variantName}`
                              }
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: CITY MULTIPLIERS */}
      {activeSection === 'locations' && (
        <div className="space-y-6">
          <div className="calculator-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <div>
                  <h3 className="font-bold text-sm">Regional City Factor Multipliers</h3>
                  <p className="text-xs text-muted">
                    Scale package baseline rates across regional markets
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddLocationModal(true)}
                className="button button--solid text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add New City</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {config?.locations.map((loc) => (
                <div key={loc.id} className="p-3.5 rounded border border-border bg-surface space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      defaultValue={loc.name}
                      id={`loc-name-${loc.id}`}
                      aria-label={`City name for ${loc.name}`}
                      className="form-input text-xs font-bold flex-1 min-w-0"
                      placeholder="City name"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id, loc.name)}
                      className="text-muted hover:text-red-600 p-1 transition-colors shrink-0"
                      aria-label={`Delete ${loc.name}`}
                      title={`Delete ${loc.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-muted block">{loc.slug}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="2.0"
                      defaultValue={loc.priceMultiplier}
                      id={`loc-mult-${loc.id}`}
                      className="form-input text-xs font-mono font-bold"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e') e.preventDefault();
                      }}
                      onInput={(e) => {
                        const val = parseFloat(e.currentTarget.value);
                        if (!isNaN(val) && val < 0) e.currentTarget.value = '0.5';
                      }}
                    />
                    <button
                      type="button"
                      disabled={isBusy(`loc:${loc.id}`)}
                      onClick={() => {
                        const mult = Number((document.getElementById(`loc-mult-${loc.id}`) as HTMLInputElement)?.value);
                        const name =
                          (document.getElementById(`loc-name-${loc.id}`) as HTMLInputElement)?.value ?? loc.name;
                        handleUpdateLocation(loc.id, name.trim() || loc.name, mult);
                      }}
                      className="button button--solid text-xs py-2 px-3 shrink-0 flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {isBusy(`loc:${loc.id}`) ? (
                        <Loader2 size={12} className="animate-spin shrink-0" />
                      ) : (
                        <Save size={12} className="shrink-0" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MILESTONES */}
      {activeSection === 'milestones' && (
        <div className="space-y-6">
          <div className="calculator-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <MilestoneIcon size={18} />
                <div>
                  <h3 className="font-bold text-sm">
                    {milestonesState.length}-Stage Milestone Payment Schedule
                  </h3>
                  <p className="text-xs text-muted">
                    Governs customer disbursement schedule across construction milestones
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddMilestoneStage}
                  disabled={savingMilestones}
                  className="button button--ghost text-xs py-2 px-3 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus size={13} />
                  <span>Add Stage</span>
                </button>

                <div
                  className={`px-3 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 border ${
                    is100Percent
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {is100Percent ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                  <span>Total: {roundedTotal.toFixed(2)}%</span>
                  {!is100Percent && <span className="font-normal">(Must equal 100.00%)</span>}
                </div>

                <button
                  type="button"
                  disabled={!areMilestonesValid || savingMilestones}
                  onClick={handleSaveMilestones}
                  className="button button--solid text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {savingMilestones ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} className="shrink-0" />
                      <span>Save Milestone Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!is100Percent && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  Total milestone allocation is currently <strong>{roundedTotal.toFixed(2)}%</strong>. Adjust stage percentages so the sum equals exactly 100.00% to enable saving.
                </span>
              </div>
            )}

            {/* A blank stage the operator has just added blocks the save on its
                own, and the percentage banner above would not explain why. */}
            {is100Percent && !areMilestonesValid && (
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  Every stage needs a name (2+ characters), key deliverables (3+ characters), and a percentage above zero before the schedule can be saved.
                </span>
              </div>
            )}

            <div className="space-y-3">
              {milestonesState.map((stage, idx) => {
                const shareAmount = Math.round(5000000 * ((Number(stage.percentage) || 0) / 100));

                return (
                  <div
                    key={stage.stageNumber}
                    className="p-3.5 rounded border border-border bg-surface space-y-3 text-xs shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2 sm:w-32 shrink-0">
                        <span className="w-6 h-6 rounded-full bg-surface-active font-mono font-bold flex items-center justify-center text-[11px] text-foreground shrink-0">
                          {stage.stageNumber}
                        </span>
                        <span className="font-bold text-muted text-[11px] uppercase">Stage {stage.stageNumber}</span>
                        <button
                          type="button"
                          disabled={savingMilestones || milestonesState.length <= 1}
                          onClick={() => handleRemoveMilestoneStage(idx)}
                          className="text-muted hover:text-red-600 p-1 transition-colors disabled:opacity-40 disabled:hover:text-muted shrink-0"
                          aria-label={`Remove stage ${stage.stageNumber}`}
                          title={
                            milestonesState.length <= 1
                              ? 'The schedule must keep at least one stage'
                              : `Remove stage ${stage.stageNumber}`
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={stage.stageName}
                          onChange={(e) => handleMilestoneFieldChange(idx, 'stageName', e.target.value)}
                          placeholder="Stage Name (min 2 chars)"
                          className="form-input text-xs w-full font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="relative w-28 sm:w-28">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={stage.percentage || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleMilestoneFieldChange(idx, 'percentage', isNaN(val) ? '' : Math.max(0, val));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e') e.preventDefault();
                            }}
                            placeholder="0.00"
                            className="form-input text-xs pr-6 text-right font-mono font-bold"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">%</span>
                        </div>

                        <div
                          className="flex-1 sm:w-36 shrink-0 flex items-center justify-between sm:justify-end px-3 py-1.5 rounded border border-border bg-surface-active/40"
                          title="Calculated share for a ₹50 Lakh benchmark project"
                        >
                          <span className="text-[9px] uppercase font-bold text-muted tracking-wider sm:hidden">
                            ₹50L Share
                          </span>
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-muted tracking-wider hidden sm:block leading-none mb-0.5">
                              ₹50L Share
                            </span>
                            <span className="font-mono font-bold text-xs text-foreground block leading-tight">
                              ₹{shareAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                        Key Deliverables & Scope Checklist
                      </label>
                      <input
                        type="text"
                        value={stage.keyDeliverables}
                        onChange={(e) => handleMilestoneFieldChange(idx, 'keyDeliverables', e.target.value)}
                        placeholder="Key deliverables (min 3 chars)"
                        className="form-input text-xs w-full text-muted leading-relaxed"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CITY / LOCATION */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div role="dialog" aria-modal="true" className="admin-dialog p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base">Add New City / Location</h3>
              <button
                type="button"
                onClick={() => setShowAddLocationModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted block mb-1">City Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salem, Trichy"
                  value={newLocationName}
                  onChange={(e) => {
                    setNewLocationName(e.target.value);
                    setNewLocationSlug(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }}
                  className="form-input text-xs w-full"
                />
              </div>

              <div>
                <label className="font-bold text-muted block mb-1">URL / Database Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. salem, trichy"
                  value={newLocationSlug}
                  onChange={(e) => setNewLocationSlug(e.target.value)}
                  className="form-input text-xs w-full font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-muted block mb-1">Price Multiplier</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="2.0"
                  required
                  value={newLocationMultiplier}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setNewLocationMultiplier(isNaN(val) ? 1.0 : Math.max(0.5, Math.min(2.0, val)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  className="form-input text-xs w-full font-mono font-bold"
                />
                <span className="text-[10px] text-muted block mt-1">
                  1.00 = standard rate, 0.96 = 4% discount, 1.05 = 5% metro premium
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  className="button button--ghost text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLocation}
                  className="button button--solid text-xs py-2 px-4"
                >
                  {creatingLocation ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BRAND OPTION */}
      {optionDialog && (
        <AdminModal
          title={
            optionDialog.mode === 'create'
              ? `Add Brand Option — ${optionDialog.itemName}`
              : `Edit Brand Option — ${optionDialog.itemName}`
          }
          onClose={() => setOptionDialog(null)}
        >
          <form onSubmit={handleSubmitOption} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-muted block mb-1">Brand Name</label>
              <input
                type="text"
                required
                placeholder="e.g. JSW NeoSteel / TATA Tiscon"
                value={optionForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setOptionForm((prev) => ({
                    ...prev,
                    name,
                    // Only auto-derive while creating; an existing slug is
                    // referenced by saved estimates and stays put unless edited.
                    slug: optionDialog.mode === 'create' ? slugify(name) : prev.slug,
                  }));
                }}
                className="form-input text-xs w-full"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">Slug</label>
              <input
                type="text"
                required
                placeholder="e.g. jsw_neosteel"
                value={optionForm.slug}
                onChange={(e) => setOptionForm((prev) => ({ ...prev, slug: e.target.value }))}
                className="form-input text-xs w-full font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">Rate Delta (₹ / sq.ft)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={optionForm.priceDelta}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setOptionForm((prev) => ({
                    ...prev,
                    priceDelta: isNaN(val) ? 0 : Math.max(0, val),
                  }));
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') e.preventDefault();
                }}
                className="form-input text-xs w-full font-mono font-bold"
                placeholder="0.00"
              />
              <span className="text-[10px] text-muted block mt-1">
                0.00 if included in base package rate, or rate addition if premium brand
              </span>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">Technical Specification Note</label>
              <textarea
                rows={2}
                placeholder="e.g. Fe 550D grade primary TMT bars with corrosion resistance"
                value={optionForm.description}
                onChange={(e) =>
                  setOptionForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="form-input text-xs w-full leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOptionDialog(null)}
                className="button button--ghost text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingOption}
                className="button button--solid text-xs py-2 px-4 disabled:opacity-60"
              >
                {creatingOption
                  ? 'Saving…'
                  : optionDialog.mode === 'create'
                    ? 'Create Option'
                    : 'Save Option'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* MODAL: ADD / EDIT SPECIFICATION CATEGORY */}
      {categoryDialog && (
        <AdminModal
          title={
            categoryDialog.mode === 'create'
              ? 'Add Specification Category'
              : `Edit Category — ${categoryDialog.category.name}`
          }
          onClose={() => setCategoryDialog(null)}
        >
          <form onSubmit={handleSubmitCategory} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-muted block mb-1">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. FLOORING, ELECTRICAL"
                value={categoryForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setCategoryForm((prev) => ({
                    ...prev,
                    name,
                    slug: categoryDialog.mode === 'create' ? slugify(name) : prev.slug,
                  }));
                }}
                className="form-input text-xs w-full font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">URL / Database Slug</label>
              <input
                type="text"
                required
                placeholder="e.g. flooring, electrical"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                className="form-input text-xs w-full font-mono"
              />
              <span className="text-[10px] text-muted block mt-1">
                Lowercase letters, numbers and underscores only. Must be unique.
              </span>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">Display Order</label>
              <input
                type="number"
                step="1"
                min="0"
                value={categoryForm.sortOrder}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCategoryForm((prev) => ({
                    ...prev,
                    sortOrder: isNaN(val) ? 0 : Math.max(0, val),
                  }));
                }}
                className="form-input text-xs w-full font-mono"
              />
              <span className="text-[10px] text-muted block mt-1">
                Lower numbers appear first in the calculator and comparison matrix.
              </span>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryDialog(null)}
                className="button button--ghost text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCategory}
                className="button button--solid text-xs py-2 px-4 disabled:opacity-60"
              >
                {savingCategory
                  ? 'Saving…'
                  : categoryDialog.mode === 'create'
                    ? 'Create Category'
                    : 'Save Category'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* MODAL: ADD / EDIT SPECIFICATION COMPONENT */}
      {itemDialog && (
        <AdminModal
          title={
            itemDialog.mode === 'create'
              ? `Add Component — ${itemDialog.categoryName}`
              : `Edit Component — ${itemDialog.item.name}`
          }
          onClose={() => setItemDialog(null)}
        >
          <form onSubmit={handleSubmitItem} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-muted block mb-1">Component Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Steel Rebar Fe 550D"
                value={itemForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setItemForm((prev) => ({
                    ...prev,
                    name,
                    slug: itemDialog.mode === 'create' ? slugify(name) : prev.slug,
                  }));
                }}
                className="form-input text-xs w-full font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted block mb-1">Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. steel_rebar"
                  value={itemForm.slug}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="form-input text-xs w-full font-mono"
                />
                {itemDialog.mode === 'edit' && (
                  <span className="text-[10px] text-muted block mt-1">
                    The calculator resolves components by slug — renaming one breaks any
                    calculator session already open on it.
                  </span>
                )}
              </div>

              <div>
                <label className="font-bold text-muted block mb-1">Category</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, categoryId: Number(e.target.value) }))
                  }
                  className="form-input text-xs w-full"
                >
                  {specCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted block mb-1">Rate Unit</label>
                <select
                  value={itemForm.unit}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, unit: e.target.value as ItemUnit }))
                  }
                  className="form-input text-xs w-full"
                >
                  {ITEM_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {ITEM_UNIT_LABELS[unit]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-muted block mb-1">Display Order</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={itemForm.sortOrder}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setItemForm((prev) => ({
                      ...prev,
                      sortOrder: isNaN(val) ? 0 : Math.max(0, val),
                    }));
                  }}
                  className="form-input text-xs w-full font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="e.g. Primary reinforcement steel used across the structure"
                value={itemForm.description}
                onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                className="form-input text-xs w-full leading-relaxed"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isCustomizable}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, isCustomizable: e.target.checked }))
                }
                className="calculator-checkbox"
              />
              <span className="text-[11px] font-semibold text-foreground">
                Customer can choose between brand options for this component
              </span>
            </label>

            {itemDialog.mode === 'create' && (
              <p className="text-[10px] text-muted leading-relaxed">
                The component is added to all active package tiers as included at no extra cost.
                Add brand options next, then set each tier&apos;s default from the package matrix.
              </p>
            )}

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemDialog(null)}
                className="button button--ghost text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingItem}
                className="button button--solid text-xs py-2 px-4 disabled:opacity-60"
              >
                {savingItem
                  ? 'Saving…'
                  : itemDialog.mode === 'create'
                    ? 'Create Component'
                    : 'Save Component'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* MODAL: ADD / EDIT ADD-ON */}
      {addonDialog && (
        <AdminModal
          title={
            addonDialog.mode === 'create'
              ? 'Add New Add-On'
              : `Edit Add-On — ${addonDialog.addon.name}`
          }
          onClose={() => setAddonDialog(null)}
          width="max-w-2xl"
        >
          <form onSubmit={handleSubmitAddon} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted block mb-1">Add-On Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rooftop Solar System"
                  value={addonForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setAddonForm((prev) => ({
                      ...prev,
                      name,
                      slug: addonDialog.mode === 'create' ? slugify(name) : prev.slug,
                    }));
                  }}
                  className="form-input text-xs w-full font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-muted block mb-1">Slug</label>
                <input
                  type="text"
                  required
                  disabled={addonDialog.mode === 'edit'}
                  placeholder="e.g. rooftop_solar"
                  value={addonForm.slug}
                  onChange={(e) => setAddonForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="form-input text-xs w-full font-mono disabled:opacity-60"
                />
                {addonDialog.mode === 'edit' && (
                  <span className="text-[10px] text-muted block mt-1">
                    Slugs are referenced by saved estimates and cannot be changed.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted block mb-1">Pricing Unit</label>
                <select
                  value={addonForm.pricingUnit}
                  onChange={(e) =>
                    setAddonForm((prev) => ({
                      ...prev,
                      pricingUnit: e.target.value as AddonPricingUnitKey,
                    }))
                  }
                  className="form-input text-xs w-full"
                >
                  {ADDON_PRICING_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {formatPricingUnit(unit)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-muted block mb-1">Display Order</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={addonForm.sortOrder}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setAddonForm((prev) => ({
                      ...prev,
                      sortOrder: isNaN(val) ? 0 : Math.max(0, val),
                    }));
                  }}
                  className="form-input text-xs w-full font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="e.g. Grid-tied rooftop solar with net metering and 25-year panel warranty"
                value={addonForm.description}
                onChange={(e) => setAddonForm((prev) => ({ ...prev, description: e.target.value }))}
                className="form-input text-xs w-full leading-relaxed"
              />
            </div>

            <div>
              <span className="font-bold text-muted block mb-1">
                Quantity Bounds{' '}
                <span className="font-normal">(optional — leave blank for a single-unit add-on)</span>
              </span>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ['defaultQuantity', 'Default'],
                    ['minQuantity', 'Minimum'],
                    ['maxQuantity', 'Maximum'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="text-[10px] text-muted font-bold block mb-1">{label}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      value={addonForm[field]}
                      onChange={(e) =>
                        setAddonForm((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e') e.preventDefault();
                      }}
                      className="form-input text-xs w-full font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {addonDialog.mode === 'create' ? (
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-muted">
                    Price Variants ({addonVariantsDraft.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAddonVariantsDraft((prev) => [...prev, { ...EMPTY_VARIANT_FORM }])
                    }
                    className="button button--ghost text-[11px] py-1 px-2.5 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Add Variant</span>
                  </button>
                </div>

                {addonVariantsDraft.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-border bg-background space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                        Variant {idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={addonVariantsDraft.length <= 1}
                        onClick={() =>
                          setAddonVariantsDraft((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-muted hover:text-red-600 p-1 transition-colors disabled:opacity-40 disabled:hover:text-muted"
                        aria-label={`Remove variant ${idx + 1}`}
                        title={
                          addonVariantsDraft.length <= 1
                            ? 'An add-on needs at least one variant'
                            : `Remove variant ${idx + 1}`
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Variant name — e.g. 3 kW"
                        value={variant.variantName}
                        onChange={(e) => {
                          const variantName = e.target.value;
                          setAddonVariantsDraft((prev) =>
                            prev.map((v, i) =>
                              i === idx
                                ? { ...v, variantName, variantSlug: slugify(variantName) }
                                : v
                            )
                          );
                        }}
                        className="form-input text-xs w-full"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Variant slug — e.g. 3_kw"
                        value={variant.variantSlug}
                        onChange={(e) => {
                          const variantSlug = e.target.value;
                          setAddonVariantsDraft((prev) =>
                            prev.map((v, i) => (i === idx ? { ...v, variantSlug } : v))
                          );
                        }}
                        className="form-input text-xs w-full font-mono"
                      />
                    </div>

                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-[11px] pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        value={variant.price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setAddonVariantsDraft((prev) =>
                            prev.map((v, i) =>
                              i === idx ? { ...v, price: isNaN(val) ? 0 : Math.max(0, val) } : v
                            )
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e') e.preventDefault();
                        }}
                        className="form-input text-xs w-full pl-5 font-mono font-bold"
                      />
                    </div>

                    <PackageTierPicker
                      packages={packageChoices}
                      selected={variant.packageTiers}
                      idPrefix={`draft-variant-${idx}`}
                      onChange={(packageTiers) =>
                        setAddonVariantsDraft((prev) =>
                          prev.map((v, i) => (i === idx ? { ...v, packageTiers } : v))
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted leading-relaxed pt-2 border-t border-border">
                Price variants are managed from the add-on card — use Add Variant there, or the
                price field on each row.
              </p>
            )}

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddonDialog(null)}
                className="button button--ghost text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAddon}
                className="button button--solid text-xs py-2 px-4 disabled:opacity-60"
              >
                {savingAddon
                  ? 'Saving…'
                  : addonDialog.mode === 'create'
                    ? 'Create Add-On'
                    : 'Save Add-On'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* MODAL: ADD ADD-ON PRICE VARIANT */}
      {variantDialog && (
        <AdminModal
          title={`Add Price Variant — ${variantDialog.addon.name}`}
          onClose={() => setVariantDialog(null)}
        >
          <form onSubmit={handleSubmitVariant} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-muted block mb-1">Variant Name</label>
              <input
                type="text"
                required
                placeholder="e.g. 5 kW, Red Brick, SS Gate"
                value={variantForm.variantName}
                onChange={(e) => {
                  const variantName = e.target.value;
                  setVariantForm((prev) => ({
                    ...prev,
                    variantName,
                    variantSlug: slugify(variantName),
                  }));
                }}
                className="form-input text-xs w-full"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">Variant Slug</label>
              <input
                type="text"
                required
                placeholder="e.g. 5_kw"
                value={variantForm.variantSlug}
                onChange={(e) =>
                  setVariantForm((prev) => ({ ...prev, variantSlug: e.target.value }))
                }
                className="form-input text-xs w-full font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">
                Price ({formatPricingUnit(variantDialog.addon.pricingUnit)})
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-[11px] pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={variantForm.price}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVariantForm((prev) => ({
                      ...prev,
                      price: isNaN(val) ? 0 : Math.max(0, val),
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  className="form-input text-xs w-full pl-5 font-mono font-bold"
                />
              </div>
            </div>

            <PackageTierPicker
              packages={packageChoices}
              selected={variantForm.packageTiers}
              idPrefix="new-variant"
              onChange={(packageTiers) => setVariantForm((prev) => ({ ...prev, packageTiers }))}
            />

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVariantDialog(null)}
                className="button button--ghost text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingVariant}
                className="button button--solid text-xs py-2 px-4 disabled:opacity-60"
              >
                {savingVariant ? 'Saving…' : 'Add Variant'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* CONFIRMATION DIALOG — replaces window.confirm() for destructive writes */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            className="admin-dialog p-6 w-full max-w-sm space-y-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 id="admin-confirm-title" className="font-bold text-sm">
                  {confirmState.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed mt-1">{confirmState.body}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirm(null)}
                className="button button--ghost text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  await confirmState.onConfirm();
                  setConfirmBusy(false);
                  setConfirm(null);
                }}
                className="button button--danger text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-60"
              >
                {confirmBusy && <Loader2 size={13} className="animate-spin" />}
                <span>{confirmState.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS — pinned to the viewport. Saves fire from the bottom of matrices
          several screens tall, where a banner in the page header is invisible. */}
      <div className="admin-toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`admin-toast admin-toast--${toast.kind}`}>
            <span className="admin-toast__icon">
              {toast.kind === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="admin-toast__close"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
