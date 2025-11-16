import { useEffect, useMemo, useState } from 'react'

function App() {
  const [fromCity, setFromCity] = useState('Jakarta')
  const [toCity, setToCity] = useState('Bandung')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState([])
  const [error, setError] = useState('')
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [booking, setBooking] = useState({ name: '', email: '', seats: 1 })
  const [bookingStatus, setBookingStatus] = useState(null)
  const [seeding, setSeeding] = useState(false)

  const backend = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])

  const cityOptions = [
    'Jakarta',
    'Bandung',
    'Yogyakarta',
    'Surabaya',
    'Semarang',
    'Malang',
    'Bogor',
    'Bekasi',
    'Depok',
    'Tangerang',
    'Cirebon',
  ]

  const searchTrips = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    setTrips([])
    try {
      const res = await fetch(`${backend}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_city: fromCity, to_city: toCity, date }),
      })
      if (!res.ok) throw new Error(`Gagal mencari perjalanan (${res.status})`)
      const data = await res.json()
      setTrips(data)
      if (data.length === 0) {
        setError('Tidak ada perjalanan untuk rute dan tanggal ini. Coba seed contoh data di bawah.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const seedSample = async () => {
    setSeeding(true)
    setError('')
    try {
      const samples = [
        {
          from_city: fromCity,
          to_city: toCity,
          date,
          bus_operator: 'BlueLine Express',
          departure_time: '07:30',
          arrival_time: '10:30',
          price: 85000,
          seats_total: 40,
          seats_available: 25,
          amenities: ['AC', 'Reclining Seat', 'USB Charger'],
        },
        {
          from_city: fromCity,
          to_city: toCity,
          date,
          bus_operator: 'Nusantara Bus',
          departure_time: '12:00',
          arrival_time: '15:30',
          price: 95000,
          seats_total: 36,
          seats_available: 12,
          amenities: ['AC', 'Toilet', 'Snack'],
        },
        {
          from_city: fromCity,
          to_city: toCity,
          date,
          bus_operator: 'Maju Lancar',
          departure_time: '18:30',
          arrival_time: '22:00',
          price: 110000,
          seats_total: 45,
          seats_available: 30,
          amenities: ['AC', 'Leg Rest', 'Entertainment'],
        },
      ]

      for (const s of samples) {
        const res = await fetch(`${backend}/api/admin/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        })
        if (!res.ok) throw new Error('Gagal seed data contoh')
      }

      await searchTrips()
    } catch (err) {
      setError(err.message)
    } finally {
      setSeeding(false)
    }
  }

  const openBooking = (trip) => {
    setSelectedTrip(trip)
    setBooking({ name: '', email: '', seats: 1 })
    setBookingStatus(null)
  }

  const submitBooking = async () => {
    if (!selectedTrip) return
    setBookingStatus('processing')
    try {
      const res = await fetch(`${backend}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: selectedTrip.id,
          passenger_name: booking.name,
          passenger_email: booking.email,
          seats: booking.seats,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({detail:'Gagal memesan'}))
        throw new Error(err.detail || 'Gagal memesan')
      }
      const data = await res.json()
      setBookingStatus({ success: data.message })
      await searchTrips()
    } catch (err) {
      setBookingStatus({ error: err.message })
    }
  }

  useEffect(() => {
    // initial search
    searchTrips()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-red-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-red-600 flex items-center justify-center text-white font-bold">B</div>
            <span className="text-xl font-bold text-gray-900">RedBus Lite</span>
          </div>
          <a href="/test" className="text-sm text-blue-600 hover:underline">Test Backend</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 md:p-6">
          <form onSubmit={searchTrips} className="grid md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Dari</label>
              <select className="w-full mt-1 border rounded px-3 py-2" value={fromCity} onChange={e=>setFromCity(e.target.value)}>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Ke</label>
              <select className="w-full mt-1 border rounded px-3 py-2" value={toCity} onChange={e=>setToCity(e.target.value)}>
                {cityOptions.filter(c=>c!==fromCity).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-sm text-gray-600">Tanggal</label>
              <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div className="md:col-span-5 flex gap-3">
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded transition disabled:opacity-60" disabled={loading}>
                {loading ? 'Mencari...' : 'Cari Bus'}
              </button>
              <button type="button" onClick={seedSample} className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded transition disabled:opacity-60" disabled={seeding}>
                {seeding ? 'Menambahkan contoh...' : 'Tambah Contoh Perjalanan'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded p-3 text-sm">{error}</div>
          )}

          <div className="mt-6 divide-y">
            {trips.map((t, idx) => (
              <div key={t.id || idx} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">{t.bus_operator}</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{t.amenities?.length || 0} fasilitas</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{t.from_city} → {t.to_city} • {t.date}</div>
                  <div className="text-sm text-gray-800 mt-1">{t.departure_time} - {t.arrival_time}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(t.amenities || []).map((a, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(Math.round(t.price))}</div>
                  <div className="text-sm text-gray-600">Sisa kursi: {t.seats_available}</div>
                  <button
                    className="mt-2 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
                    onClick={() => openBooking(t)}
                    disabled={t.seats_available <= 0}
                  >
                    Pesan
                  </button>
                </div>
              </div>
            ))}

            {!loading && trips.length === 0 && !error && (
              <div className="text-center text-gray-500 py-12">Mulai dengan mencari rute bus di atas.</div>
            )}
          </div>
        </div>
      </main>

      {selectedTrip && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pesan Tiket</h3>
                <p className="text-sm text-gray-600">{selectedTrip.from_city} → {selectedTrip.to_city} • {selectedTrip.date}</p>
                <p className="text-sm text-gray-600">{selectedTrip.bus_operator} • {selectedTrip.departure_time} - {selectedTrip.arrival_time}</p>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600">Nama</label>
                <input className="w-full mt-1 border rounded px-3 py-2" value={booking.name} onChange={e=>setBooking(b=>({...b, name: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input type="email" className="w-full mt-1 border rounded px-3 py-2" value={booking.email} onChange={e=>setBooking(b=>({...b, email: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Jumlah Kursi</label>
                <input type="number" min={1} max={Math.min(6, selectedTrip.seats_available || 1)} className="w-full mt-1 border rounded px-3 py-2" value={booking.seats} onChange={e=>setBooking(b=>({...b, seats: Number(e.target.value)}))} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-gray-700"><span className="font-semibold">Total:</span> Rp {new Intl.NumberFormat('id-ID').format(Math.round((selectedTrip.price || 0) * (booking.seats || 1)))}
              </div>
              <button
                onClick={submitBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
              >
                Konfirmasi
              </button>
            </div>

            {bookingStatus === 'processing' && (
              <p className="mt-3 text-sm text-gray-600">Memproses...</p>
            )}
            {bookingStatus?.error && (
              <p className="mt-3 text-sm text-red-600">{bookingStatus.error}</p>
            )}
            {bookingStatus?.success && (
              <p className="mt-3 text-sm text-green-600">{bookingStatus.success}</p>
            )}
          </div>
        </div>
      )}

      <footer className="py-8 text-center text-sm text-gray-500">Dibuat oleh AI • Demo RedBus sederhana</footer>
    </div>
  )
}

export default App
