'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Sparkles,
} from 'lucide-react';
import {
  getAdminPricingConfig,
  updatePackagePricing,
  updateLocationMultiplier,
  updateAddonVariantPricing,
  updateMilestones,
  PricingConfigData,
} from '@/lib/api/admin';

type MainSectionTab = 'packages' | 'addons' | 'locations' | 'milestones';
type PackageFilter = 'ALL' | 'basic' | 'standard' | 'premium' | 'luxury';
type AddonCategoryFilter = 'ALL' | 'water' | 'power' | 'security' | 'smart_home';

function formatPricingUnit(unit: string): string {
  switch (unit) {
    case 'fixed':
      return 'Flat ₹';
    case 'per_litre':
      return '₹ / Litre';
    case 'per_rft':
      return '₹ / Running Foot';
    case 'per_sqft_gate':
      return '₹ / Sq.Ft (Gate)';
    case 'per_sqft_terrace':
      return '₹ / Sq.Ft (Terrace)';
    default:
      return unit.replace(/_/g, ' ');
  }
}

function getAddonCategory(slug: string): AddonCategoryFilter {
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
      return 'water';
  }
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
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savingMilestones, setSavingMilestones] = useState<boolean>(false);

  // Active Navigation Tabs
  const [activeSection, setActiveSection] = useState<MainSectionTab>('packages');
  const [selectedPkgFilter, setSelectedPkgFilter] = useState<PackageFilter>('ALL');
  const [selectedAddonCategory, setSelectedAddonCategory] = useState<AddonCategoryFilter>('ALL');

  const fetchConfig = () => {
    setLoading(true);
    getAdminPricingConfig()
      .then((data) => {
        setConfig(data);
        if (data?.milestones) {
          setMilestonesState(
            data.milestones.map((m) => ({
              id: m.id,
              stageNumber: m.stageNumber,
              stageName: m.stageName,
              percentage: Number(m.percentage) || 0,
              keyDeliverables: m.keyDeliverables,
              isActive: m.isActive !== false,
            }))
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch pricing configuration');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleUpdatePackage = async (
    id: number,
    slug: string,
    standardRate: number,
    volumeRate: number,
    threshold: number,
    headroomRate?: number
  ) => {
    try {
      await updatePackagePricing(id, {
        pricePerSqft: standardRate,
        volumePricePerSqft: volumeRate,
        volumeDiscountThresholdSqft: threshold,
        headRoomPricePerSqft: headroomRate,
      });
      setSuccessMsg(`Updated ${slug} package pricing.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to update package pricing.');
    }
  };

  const handleUpdateLocation = async (id: number, mult: number) => {
    try {
      await updateLocationMultiplier(id, { priceMultiplier: mult });
      setSuccessMsg('Updated city multiplier.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to update city multiplier.');
    }
  };

  const handleUpdateAddonPrice = async (
    addonId: number,
    addonName: string,
    variantSlug: string,
    variantName: string,
    price: number
  ) => {
    if (isNaN(price) || price < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }
    try {
      await updateAddonVariantPricing(addonId, { variantSlug, price });
      setSuccessMsg(`Updated ${addonName} — ${variantName} to ₹${price.toFixed(2)}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchConfig();
    } catch (err) {
      console.error(err);
      setError(`Failed to update price for ${variantName}.`);
    }
  };

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
    setError(null);
    try {
      await updateMilestones({
        milestones: milestonesState.map((m) => ({
          id: m.id,
          stageNumber: m.stageNumber,
          stageName: m.stageName.trim(),
          percentage: Number(m.percentage),
          keyDeliverables: m.keyDeliverables.trim(),
          isActive: m.isActive !== false,
        })),
      });
      setSuccessMsg('Milestone payment schedule updated successfully (100% verified).');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update milestone stages';
      setError(msg);
    } finally {
      setSavingMilestones(false);
    }
  };

  const filteredPackages = useMemo(() => {
    if (!config?.packages) return [];
    if (selectedPkgFilter === 'ALL') return config.packages;
    return config.packages.filter((p) => p.slug === selectedPkgFilter);
  }, [config?.packages, selectedPkgFilter]);

  const filteredAddons = useMemo(() => {
    if (!config?.addons) return [];
    if (selectedAddonCategory === 'ALL') return config.addons;
    return config.addons.filter((a) => getAddonCategory(a.slug) === selectedAddonCategory);
  }, [config?.addons, selectedAddonCategory]);

  if (loading) {
    return (
      <div className="py-20 text-center calculator-card">
        <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
        <p className="text-xs text-muted">Loading pricing configuration matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Dynamic Pricing Matrix</h2>
          <p className="text-xs text-muted">
            Configure live construction rates, volume thresholds, city factors, add-on variants, and milestone schedules
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Section Navigation Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveSection('packages')}
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
          onClick={() => setActiveSection('addons')}
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
          onClick={() => setActiveSection('locations')}
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
          onClick={() => setActiveSection('milestones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t text-xs font-bold transition-all border-b-2 ${
            activeSection === 'milestones'
              ? 'border-foreground text-foreground bg-surface font-extrabold shadow-sm'
              : 'border-transparent text-muted hover:text-foreground hover:bg-surface/50'
          }`}
        >
          <MilestoneIcon size={15} />
          <span>Milestone Schedule (10)</span>
        </button>
      </div>

      {/* SECTION 1: PACKAGES */}
      {activeSection === 'packages' && (
        <div className="space-y-6">
          {/* Sub-Filters: Specific Package Dividers */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-muted uppercase mr-1 flex items-center gap-1">
                <Sliders size={12} /> Filter:
              </span>
              {[
                { id: 'ALL', label: 'All Packages' },
                { id: 'basic', label: 'Basic Package' },
                { id: 'standard', label: 'Standard Package' },
                { id: 'premium', label: 'Premium Package' },
                { id: 'luxury', label: 'Luxury Package' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedPkgFilter(tab.id as PackageFilter)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    selectedPkgFilter === tab.id
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-surface border border-border text-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-muted font-mono">
              Showing {filteredPackages.length} of {config?.packages.length ?? 0} tiers
            </span>
          </div>

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.slug}
                className="calculator-card p-6 border border-border bg-surface flex flex-col justify-between space-y-5 shadow-sm"
              >
                {/* Tier Header with distinct accent */}
                <div className="pb-3 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-foreground inline-block" />
                        <h3 className="text-base font-extrabold tracking-tight capitalize text-foreground">
                          {pkg.name} Package
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-surface-active text-muted border border-border">
                          {pkg.slug}
                        </span>
                      </div>
                      {pkg.tagline && (
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          {pkg.tagline}
                        </p>
                      )}
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

                {/* Category-Wise Parameter Form */}
                <div className="space-y-4">
                  {/* Divider 1: Core Standard & Volume Pricing */}
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
                          defaultValue={pkg.activePrice?.pricePerSqft ?? ''}
                          id={`pkg-std-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 2099.00"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted font-bold block mb-1">
                          Volume Rate (₹/sq.ft)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={pkg.activePrice?.volumePricePerSqft ?? ''}
                          id={`pkg-vol-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 2000.00"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted font-bold block mb-1">
                          Volume Threshold (Sq.Ft)
                        </label>
                        <input
                          type="number"
                          step="1"
                          defaultValue={pkg.activePrice?.volumeDiscountThresholdSqft ?? ''}
                          id={`pkg-thresh-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 3500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider 2: Structural Extension Pricing */}
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
                          defaultValue={pkg.activePrice?.headRoomPricePerSqft ?? ''}
                          id={`pkg-head-${pkg.slug}`}
                          className="form-input text-xs font-mono font-bold"
                          placeholder="e.g. 1650.00"
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-[11px] text-muted pb-2">
                          Applies to overhead stair headrooms & utility access structures.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button for this Package */}
                <button
                  type="button"
                  onClick={() => {
                    const std = Number((document.getElementById(`pkg-std-${pkg.slug}`) as HTMLInputElement)?.value);
                    const vol = Number((document.getElementById(`pkg-vol-${pkg.slug}`) as HTMLInputElement)?.value);
                    const thresh = Number((document.getElementById(`pkg-thresh-${pkg.slug}`) as HTMLInputElement)?.value);
                    const head = Number((document.getElementById(`pkg-head-${pkg.slug}`) as HTMLInputElement)?.value);
                    handleUpdatePackage(pkg.id, pkg.slug, std, vol, thresh, head);
                  }}
                  className="button button--solid w-full text-xs py-2.5 flex items-center justify-center gap-2 mt-2 group"
                >
                  <Save size={14} className="text-primary transition-transform group-hover:scale-110 shrink-0" />
                  <span>Save {pkg.name} Package Configuration</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: ADD-ONS */}
      {activeSection === 'addons' && (
        <div className="space-y-6">
          {/* Category-Wise Filter Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-muted uppercase mr-1 flex items-center gap-1">
                <Sliders size={12} /> Category:
              </span>
              {[
                { id: 'ALL', label: 'All Add-Ons (15)', icon: Wrench },
                { id: 'water', label: 'Water & Drainage (5)', icon: Droplets },
                { id: 'power', label: 'Power & Solar (4)', icon: Zap },
                { id: 'security', label: 'Perimeter & Security (4)', icon: Shield },
                { id: 'smart_home', label: 'Automation & Lifts (2)', icon: Home },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedAddonCategory(cat.id as AddonCategoryFilter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                      selectedAddonCategory === cat.id
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-surface border border-border text-muted hover:text-foreground'
                    }`}
                  >
                    <Icon size={12} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-muted font-mono">
              Showing {filteredAddons.length} of {config?.addons.length ?? 0} items
            </span>
          </div>

          {/* Add-Ons Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAddons.map((addon) => (
              <div
                key={addon.slug}
                className="calculator-card p-5 rounded border border-border bg-surface space-y-3 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="font-bold text-sm text-foreground">{addon.name}</span>
                      <span className="text-[11px] font-mono text-muted block">{addon.slug}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-active text-muted-ink border border-border shrink-0">
                      {formatPricingUnit(addon.pricingUnit)}
                    </span>
                  </div>
                  {addon.description && (
                    <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1">
                      {addon.description}
                    </p>
                  )}
                </div>

                {/* Variants Price List */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                    Active Price Variants ({addon.activePrices.length})
                  </div>

                  {addon.activePrices.length === 0 ? (
                    <p className="text-xs text-muted italic">No active price rows found.</p>
                  ) : (
                    <div className="space-y-2">
                      {addon.activePrices.map((variant) => (
                        <div
                          key={variant.variantSlug}
                          className="p-2.5 rounded bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-foreground truncate">
                              {variant.variantName}
                            </div>
                            <div className="text-[10px] text-muted flex items-center gap-2">
                              <span className="font-mono">{variant.variantSlug}</span>
                              <span>•</span>
                              <span className="capitalize">{variant.packageTier.replace(/_/g, ' ')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="relative w-28">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-[11px]">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={variant.price}
                                id={`addon-${addon.id}-${variant.variantSlug}`}
                                className="form-input text-xs pl-5 py-1.5 font-mono font-bold"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const inputEl = document.getElementById(
                                  `addon-${addon.id}-${variant.variantSlug}`
                                ) as HTMLInputElement;
                                const price = Number(inputEl?.value);
                                handleUpdateAddonPrice(
                                  addon.id,
                                  addon.name,
                                  variant.variantSlug,
                                  variant.variantName,
                                  price
                                );
                              }}
                              className="button button--solid text-xs py-1.5 px-3 flex items-center gap-1.5 group"
                            >
                              <Save size={13} className="text-primary transition-transform group-hover:scale-110 shrink-0" />
                              <span>Save</span>
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

      {/* SECTION 3: CITY MULTIPLIERS */}
      {activeSection === 'locations' && (
        <div className="space-y-6">
          <div className="calculator-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <h3 className="font-bold text-sm">Regional City Factor Multipliers</h3>
              </div>
              <span className="text-[11px] text-muted">
                Multipliers scale base and volume package pricing based on geographic market rates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {config?.locations.map((loc) => (
                <div key={loc.id} className="p-3.5 rounded border border-border bg-surface space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{loc.name}</span>
                    <span className="text-[10px] font-mono text-muted">{loc.slug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="2.0"
                      defaultValue={loc.priceMultiplier}
                      id={`loc-mult-${loc.id}`}
                      className="form-input text-xs font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const mult = Number((document.getElementById(`loc-mult-${loc.id}`) as HTMLInputElement)?.value);
                        handleUpdateLocation(loc.id, mult);
                      }}
                      className="button button--solid text-xs py-2 px-3 shrink-0 flex items-center gap-1.5 group"
                    >
                      <Save size={12} className="text-primary transition-transform group-hover:scale-110 shrink-0" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: MILESTONES */}
      {activeSection === 'milestones' && (
        <div className="space-y-6">
          <div className="calculator-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <MilestoneIcon size={18} />
                <div>
                  <h3 className="font-bold text-sm">10-Stage Milestone Payment Schedule</h3>
                  <p className="text-xs text-muted">
                    Governs customer disbursement schedule across construction milestones
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Live Percentage Total Meter */}
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
                      <Save size={14} className="text-primary transition-transform group-hover:scale-110 shrink-0" />
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

            <div className="space-y-3">
              {milestonesState.map((stage, idx) => (
                <div
                  key={stage.stageNumber}
                  className="p-3.5 rounded border border-border bg-surface space-y-3 text-xs shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 sm:w-28 shrink-0">
                      <span className="w-6 h-6 rounded-full bg-surface-active font-mono font-bold flex items-center justify-center text-[11px] text-foreground">
                        {stage.stageNumber}
                      </span>
                      <span className="font-bold text-muted text-[11px] uppercase">Stage {stage.stageNumber}</span>
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={stage.stageName}
                        onChange={(e) => handleMilestoneFieldChange(idx, 'stageName', e.target.value)}
                        placeholder="Stage Name (min 2 chars)"
                        className="form-input text-xs w-full font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 sm:w-32 shrink-0">
                      <div className="relative w-full">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={stage.percentage || ''}
                          onChange={(e) => handleMilestoneFieldChange(idx, 'percentage', e.target.value)}
                          placeholder="0.00"
                          className="form-input text-xs pr-6 text-right font-mono font-bold"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">%</span>
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
