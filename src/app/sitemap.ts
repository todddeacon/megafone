import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megafone.app'
  const supabase = createAdminClient()

  // Fetch all approved demands
  const { data: demands } = await supabase
    .from('demands')
    .select('id, created_at')
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })

  // Fetch all organisations
  const { data: orgs } = await supabase
    .from('organisations')
    .select('slug, created_at')
    .order('name', { ascending: true })

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  const demandPages: MetadataRoute.Sitemap = (demands ?? []).map((d) => ({
    url: `${siteUrl}/demands/${d.id}`,
    lastModified: new Date(d.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const orgPages: MetadataRoute.Sitemap = (orgs ?? []).map((o) => ({
    url: `${siteUrl}/organisations/${o.slug}`,
    lastModified: new Date(o.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...demandPages, ...orgPages]
}
