import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-stone-900 mb-4">
        Manage &amp; Discover Events
      </h1>
      <p className="text-xl text-stone-600 mb-10 max-w-2xl mx-auto">
        Create events, manage invitations, connect with sponsors, and track leads — all in one platform.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/search"
          className="bg-stone-50 border border-stone-300 text-stone-700 px-8 py-3 rounded-lg font-medium hover:bg-stone-50"
        >
          Browse Events
        </Link>
        <Link
          href="/register"
          className="bg-stone-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-stone-900"
        >
          Get Started Free
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { title: 'Organizers', desc: 'Create events, send invitations, and manage your attendees.' },
          { title: 'Sponsors', desc: 'Access your sponsor portal, manage leads, and track analytics.' },
          { title: 'Attendees', desc: 'Discover and RSVP to events via your personal invitation link.' },
        ].map((item) => (
          <div key={item.title} className="bg-stone-50 rounded-xl p-6 shadow-sm border border-stone-100">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">{item.title}</h3>
            <p className="text-stone-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
