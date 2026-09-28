"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { BannerImageField } from "@/components/settings/banner-image-field";
import { useAuth } from "@/hooks/useAuth";
import { canAccess } from "@/lib/roles";

const bannerSchema = z.object({
  id: z.string(),
  imageUrl: z.string().optional().nullable(),
  imageUrlMobile: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  isActive: z.boolean(),
});

const schema = z.object({
  storeName: z.string().min(1),
  tagline: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  hoursNote: z.string().optional().nullable(),
  taxEnabled: z.boolean(),
  taxRateBps: z.number().int().min(0).max(10000),
  taxConfigured: z.boolean().optional(),
  orderingPaused: z.boolean(),
  paymentCod: z.boolean(),
  paymentPayAtPickup: z.boolean(),
  paymentCard: z.boolean(),
  paymentWallet: z.boolean(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  banners: z.array(bannerSchema),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: canAccess(user?.role, ["owner", "manager"]),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: "HeyBrew",
      tagline: "",
      contactPhone: "",
      contactEmail: "",
      whatsappNumber: "",
      hoursNote: "",
      taxEnabled: false,
      taxRateBps: 0,
      taxConfigured: false,
      orderingPaused: false,
      paymentCod: true,
      paymentPayAtPickup: true,
      paymentCard: false,
      paymentWallet: false,
      instagram: "",
      facebook: "",
      tiktok: "",
      banners: [],
    },
  });

  const banners = useFieldArray({ control: form.control, name: "banners" });

  useEffect(() => {
    const s = settingsQuery.data;
    if (!s) return;
    form.reset({
      storeName: s.storeName,
      tagline: s.tagline ?? "",
      contactPhone: s.contactPhone ?? "",
      contactEmail: s.contactEmail ?? "",
      whatsappNumber: s.whatsappNumber ?? "",
      hoursNote: s.hoursNote ?? "",
      taxEnabled: s.taxEnabled,
      taxRateBps: s.taxRateBps,
      taxConfigured: s.taxConfigured ?? false,
      orderingPaused: s.orderingPaused,
      paymentCod: s.paymentMethods?.cod ?? true,
      paymentPayAtPickup: s.paymentMethods?.pay_at_pickup ?? true,
      paymentCard: s.paymentMethods?.card_placeholder ?? false,
      paymentWallet: s.paymentMethods?.wallet_placeholder ?? false,
      instagram: s.social?.instagram ?? "",
      facebook: s.social?.facebook ?? "",
      tiktok: s.social?.tiktok ?? "",
      banners: (s.banners ?? []).map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl ?? "",
        imageUrlMobile: b.imageUrlMobile ?? "",
        title: b.title ?? "",
        subtitle: b.subtitle ?? "",
        linkUrl: b.linkUrl ?? "",
        isActive: b.isActive,
      })),
    });
  }, [settingsQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateSettings({
        storeName: values.storeName,
        tagline: values.tagline || null,
        contactPhone: values.contactPhone || null,
        contactEmail: values.contactEmail || null,
        whatsappNumber: values.whatsappNumber || null,
        hoursNote: values.hoursNote || null,
        taxEnabled: values.taxConfigured ? values.taxEnabled : false,
        taxRateBps: values.taxConfigured ? values.taxRateBps : 0,
        orderingPaused: values.orderingPaused,
        paymentMethods: {
          cod: values.paymentCod,
          pay_at_pickup: values.paymentPayAtPickup,
          card_placeholder: false, // never enable fake providers from UI
          wallet_placeholder: false,
        },
        social: {
          instagram: values.instagram || null,
          facebook: values.facebook || null,
          tiktok: values.tiktok || null,
        },
        banners: values.banners.map((b) => ({
          ...b,
          imageUrl: b.imageUrl || null,
          imageUrlMobile: b.imageUrlMobile || null,
          title: b.title || null,
          subtitle: b.subtitle || null,
          linkUrl: b.linkUrl || null,
        })),
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  if (!canAccess(user?.role, ["owner", "manager"])) {
    return <EmptyState title="Settings require owner or manager" />;
  }

  if (settingsQuery.isError) {
    return <EmptyState title="Could not load settings" />;
  }

  const taxConfigured = form.watch("taxConfigured");

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Store contact, WhatsApp, banners, and ordering flags. Online card/wallet stay off until a real provider is configured."
      />

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
      >
        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <h2 className="font-display text-lg">Store contact</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Store name</Label>
              <Input {...form.register("storeName")} />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input {...form.register("tagline")} />
            </div>
            <div>
              <Label>Contact phone</Label>
              <Input {...form.register("contactPhone")} />
            </div>
            <div>
              <Label>Contact email</Label>
              <Input type="email" {...form.register("contactEmail")} />
            </div>
            <div>
              <Label>WhatsApp number</Label>
              <Input {...form.register("whatsappNumber")} placeholder="03XXXXXXXXX" />
            </div>
            <div className="sm:col-span-2">
              <Label>Hours note</Label>
              <Textarea
                {...form.register("hoursNote")}
                placeholder="e.g. Open daily 9am–11pm Asia/Karachi"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <h2 className="font-display text-lg">Ordering & payments</h2>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("orderingPaused")} />
            Pause online ordering (all channels)
          </label>

          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("paymentCod")} />
              Cash on delivery
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("paymentPayAtPickup")} />
              Pay at pickup
            </label>
            <label className="flex items-center gap-2 text-sm text-espresso/45">
              <input type="checkbox" disabled checked={false} readOnly />
              Card online — not enabled (no fake provider)
            </label>
            <label className="flex items-center gap-2 text-sm text-espresso/45">
              <input type="checkbox" disabled checked={false} readOnly />
              Wallet online — not enabled (no fake provider)
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <h2 className="font-display text-lg">Tax</h2>
          <p className="mt-1 text-xs text-espresso/50">
            Tax controls stay disabled until tax is explicitly configured for HeyBrew.
          </p>
          {!taxConfigured ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Tax is <strong>not configured</strong>. Enablement is locked in the admin UI.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("taxEnabled")} /> Tax enabled
              </label>
              <div>
                <Label>Tax rate (basis points, 100 = 1%)</Label>
                <Input
                  type="number"
                  {...form.register("taxRateBps", { valueAsNumber: true })}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <h2 className="font-display text-lg">Social</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Instagram</Label>
              <Input {...form.register("instagram")} />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input {...form.register("facebook")} />
            </div>
            <div>
              <Label>TikTok</Label>
              <Input {...form.register("tiktok")} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg">Banners</h2>
              <p className="mt-1 text-xs text-espresso/55">
                Home hero images. Upload separate desktop and mobile crops; only active banners
                show on the site.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                banners.append({
                  id: `bn_${Math.random().toString(36).slice(2, 8)}`,
                  imageUrl: "",
                  imageUrlMobile: "",
                  title: "",
                  subtitle: "",
                  linkUrl: "",
                  isActive: true,
                })
              }
            >
              Add banner
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {banners.fields.length === 0 ? (
              <p className="rounded-lg border border-dashed border-espresso/15 px-4 py-8 text-center text-sm text-espresso/50">
                No banners yet. Add one and select desktop / mobile images.
              </p>
            ) : null}
            {banners.fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-4 rounded-lg border border-espresso/10 bg-cream-deep/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-espresso">Banner {index + 1}</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...form.register(`banners.${index}.isActive`)} />
                      Active
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => banners.remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <BannerImageField
                    label="Desktop image"
                    sizeHint="Recommended 2880 × 640 px (shows as 1440 × 320, ratio 9∶2)"
                    previewAspectClass="aspect-[9/2]"
                    value={form.watch(`banners.${index}.imageUrl`)}
                    onChange={(url) =>
                      form.setValue(`banners.${index}.imageUrl`, url ?? "", {
                        shouldDirty: true,
                      })
                    }
                  />
                  <BannerImageField
                    label="Mobile image"
                    sizeHint="Recommended 900 × 450 px (ratio 2∶1)"
                    previewAspectClass="aspect-[2/1]"
                    value={form.watch(`banners.${index}.imageUrlMobile`)}
                    onChange={(url) =>
                      form.setValue(`banners.${index}.imageUrlMobile`, url ?? "", {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label>Title (optional)</Label>
                    <Input placeholder="Title" {...form.register(`banners.${index}.title`)} />
                  </div>
                  <div>
                    <Label>Subtitle (optional)</Label>
                    <Input
                      placeholder="Subtitle"
                      {...form.register(`banners.${index}.subtitle`)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Link URL (optional)</Label>
                    <Input
                      placeholder="https://…"
                      {...form.register(`banners.${index}.linkUrl`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Button type="submit" loading={saveMutation.isPending || settingsQuery.isLoading}>
          Save settings
        </Button>
      </form>
    </div>
  );
}
