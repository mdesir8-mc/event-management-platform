'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import StatusBadge from '@/components/ui/StatusBadge'
import PieChart from '@/components/charts/PieChart'
import LineChart from '@/components/charts/LineChart'
import AddLeadForm from '@/components/forms/AddLeadForm'

interface Analytics {
  totalLeads: number
  leadsByType: Array<{ interaction_type: string; _count: number }>
  leadsTimeSeries: Array<{ date: string; count: number }>
  recentLeads: Lead[]
}

interface Lead {
  id: string
  attendee_name: string
  attendee_email: string
  interaction_type: string
  notes: string | null
  created_at: string
}

interface SponsorDetail {
  id: string
  company_name: string
  tier: string
  logo_url: string | null
  website_url: string | null
  description: string | null
  booth_number: string | null
  event: {
    title: string
    start_date: string
    end_date: string
    status: string
  }
}

export default function SponsorDetailPage({ params }: { params: Promise<{ sponsorId: string }> }) {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sponsorId, setSponsorId] = useState('')
  const [sponsor, setSponsor] = useState<SponsorDetail | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddLead, setShowAddLead] = useState(false)
  const [page, setPage] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  const loadData = useCallback(async (id: string, currentPage = 1) => {
    if (!token) return
    try {
      const [sponsorRes, analyticsRes, leadsRes] = await Promise.all([
        fetch(`/api/sponsors/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/sponsor-portal/${id}/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/sponsor-portal/${id}/leads?page=${currentPage}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (sponsorRes.ok) {
        const data = await sponsorRes.json()
        setSponsor(data.sponsor)
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data)
      }
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
        setTotalLeads(data.total || 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    params.then(({ sponsorId: id }) => {
      setSponsorId(id)
      if (token) loadData(id)
    })
  }, [token, loadData])

  function handleExport() {
    window.open(`/api/sponsor-portal/${sponsorId}/leads/export`, '_blank')
  }

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>
  }

  if (!sponsor) return null

  const pieData = (analytics?.leadsByType || []).map((l) => ({
    name: l.interaction_type.replace('_', ' '),
    value: l._count,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sponsor.company_name}</h1>
            <p className="text-gray-600 mt-1">{sponsor.event.title}</p>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={sponsor.tier as never} type="tier" />
              <StatusBadge status={sponsor.event.status as never} type="event" />
            </div>
          </div>
          {sponsor.logo_url && (
            <img src={sponsor.logo_url} alt={sponsor.company_name} className="h-16 w-16 object-contain" />
          )}
        </div>
        {sponsor.booth_number && (
          <p className="text-sm text-gray-500 mt-2">Booth: {sponsor.booth_number}</p>
        )}
        {sponsor.website_url && (
          <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
            {sponsor.website_url}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Leads</p>
          <p className="text-3xl font-bold text-blue-600">{analytics?.totalLeads ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:col-span-2">
          <PieChart data={pieData} title="Leads by Interaction Type" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <LineChart data={analytics?.leadsTimeSeries ?? []} title="Leads Over Last 30 Days" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Leads ({totalLeads})</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowAddLead(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700"
            >
              Add Lead
            </button>
          </div>
        </div>

        {leads.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No leads yet. Add your first lead above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 font-medium text-gray-700">Name</th>
                  <th className="pb-3 font-medium text-gray-700">Email</th>
                  <th className="pb-3 font-medium text-gray-700">Type</th>
                  <th className="pb-3 font-medium text-gray-700">Notes</th>
                  <th className="pb-3 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="py-3 font-medium text-gray-900">{lead.attendee_name}</td>
                    <td className="py-3 text-gray-600">{lead.attendee_email}</td>
                    <td className="py-3 text-gray-600 capitalize">{lead.interaction_type.replace('_', ' ')}</td>
                    <td className="py-3 text-gray-600">{lead.notes || '—'}</td>
                    <td className="py-3 text-gray-600">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalLeads > 20 && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => { setPage(p => p - 1); loadData(sponsorId, page - 1) }} disabled={page <= 1} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Previous</button>
            <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
            <button onClick={() => { setPage(p => p + 1); loadData(sponsorId, page + 1) }} disabled={page * 20 >= totalLeads} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Lead</h2>
            <AddLeadForm
              sponsorId={sponsorId}
              onSuccess={() => {
                setShowAddLead(false)
                loadData(sponsorId, page)
              }}
              onCancel={() => setShowAddLead(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
