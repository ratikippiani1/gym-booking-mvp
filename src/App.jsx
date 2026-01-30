import { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabase"

// ---------- helpers ----------

function pad2(n) {
  return n < 10 ? "0" + n : "" + n
}

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function buildSlots(start, end, step) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)

  let list = []
  let cur = sh * 60 + sm
  const endMin = eh * 60 + em

  while (cur <= endMin) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    list.push(`${pad2(h)}:${pad2(m)}`)
    cur += step
  }

  return list
}

// ---------- component ----------

export default function App() {
  const BUSINESS_START = "10:00"
  const BUSINESS_END = "20:00"
  const STEP_MINUTES = 15
  const SERVICES = ["Gym", "BJJ", "MMA", "Boxing"]

  const ADMIN_PASSWORD = "admin123"

  // booking form
  const [service, setService] = useState(SERVICES[0])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [status, setStatus] = useState("")

  const [bookedTimes, setBookedTimes] = useState([])

  // admin
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("isAdmin") === "true"
  )
  const [allBookings, setAllBookings] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)

  const minDate = useMemo(() => tomorrowISO(), [])
  const timeSlots = useMemo(
    () => buildSlots(BUSINESS_START, BUSINESS_END, STEP_MINUTES),
    []
  )

  // load booked slots for selected service/date
  useEffect(() => {
    async function loadBookedSlots() {
      if (!date || !service) {
        setBookedTimes([])
        return
      }

      const res = await supabase
        .from("bookings")
        .select("time")
        .eq("date", date)
        .eq("service", service)

      if (!res.error) {
        setBookedTimes(res.data.map((r) => r.time))
      }
    }

    loadBookedSlots()
  }, [date, service])

  function isBooked(t) {
    return bookedTimes.includes(t)
  }

  async function loadAllBookings() {
    setAdminLoading(true)

    const res = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (res.error) {
      setStatus("Error: " + res.error.message)
      setAdminLoading(false)
      return
    }

    setAllBookings(res.data || [])
    setAdminLoading(false)
  }

  // auto-load bookings whenever admin becomes true (incl. refresh persistence)
  useEffect(() => {
    if (isAdmin) {
      loadAllBookings()
    }
  }, [isAdmin])

  function handleAdminLogin() {
    const pass = prompt("Enter admin password")

    if (pass === ADMIN_PASSWORD) {
      setIsAdmin(true)
      localStorage.setItem("isAdmin", "true")
      // load happens via useEffect too, but we can call immediately
      loadAllBookings()
    } else {
      alert("Wrong password")
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false)
    localStorage.removeItem("isAdmin")
    setAllBookings([])
    setStatus("")
  }

  async function deleteBooking(id) {
    const ok = window.confirm("Delete this booking?")
    if (!ok) return

    await supabase.from("bookings").delete().eq("id", id)
    loadAllBookings()
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!date || !time) {
      setStatus("Please select date and time")
      return
    }

    // block weird manual dates without breaking native date picker
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!isoDateRegex.test(date)) {
      setStatus("Invalid date format")
      setDate("")
      return
    }

    const currentYear = new Date().getFullYear()
    const year = Number(date.slice(0, 4))
    if (year < currentYear || year > currentYear + 1) {
      setStatus("Please select a valid booking year")
      setDate("")
      return
    }

    if (date < minDate) {
      setStatus("Date must be from tomorrow")
      return
    }

    if (isBooked(time)) {
      setStatus("This slot is already booked")
      return
    }

    setStatus("Saving...")

    const res = await supabase.from("bookings").insert([
      { service, name, email, date, time },
    ])

    if (res.error) {
      setStatus("This slot is already booked")
      return
    }

    setStatus("Booked successfully ✅")
    setName("")
    setEmail("")
    setTime("")
  }

  function TabButton({ active, children, onClick }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          active
            ? "flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            : "flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        }
      >
        {children}
      </button>
    )
  }

  function ActionButton({ variant, children, onClick }) {
    const base =
      "rounded-xl border px-3 py-2 text-sm font-semibold transition"
    if (variant === "danger") {
      return (
        <button
          type="button"
          onClick={onClick}
          className={
            base +
            " border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          }
        >
          {children}
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={
          base +
          " border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
        }
      >
        {children}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Gym Booking System
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              React + Supabase MVP (service, slots, admin)
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Live
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          <TabButton
            active={!isAdmin}
            onClick={() => {
              setStatus("")
              setIsAdmin(false)
            }}
          >
            Booking
          </TabButton>

          <TabButton
            active={isAdmin}
            onClick={() => {
              if (isAdmin) {
                loadAllBookings()
              } else {
                handleAdminLogin()
              }
            }}
          >
            Admin
          </TabButton>
        </div>

        {status && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
            {status}
          </div>
        )}

        {/* BOOKING */}
        {!isAdmin && (
          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-slate-700">
              Service
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="bg-slate-50 border border-slate-300 p-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {SERVICES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <label className="text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border border-slate-300 p-3 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />

            <label className="text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              placeholder="john@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50 border border-slate-300 p-3 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />

            <label className="text-sm font-semibold text-slate-700">
              Date
            </label>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 p-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              required
            />

            <label className="text-sm font-semibold text-slate-700">
              Time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-slate-50 border border-slate-300 p-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select time</option>

              {timeSlots.map((t) => (
                <option key={t} value={t} disabled={isBooked(t)}>
                  {t} {isBooked(t) ? "— booked" : ""}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="mt-2 rounded-xl bg-slate-900 p-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Book Session
            </button>
          </form>
        )}

        {/* ADMIN */}
        {isAdmin && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {adminLoading ? "Loading..." : `Total bookings: ${allBookings.length}`}
              </div>

              <div className="flex gap-2">
                <ActionButton onClick={() => loadAllBookings()}>
                  Refresh
                </ActionButton>

                <ActionButton variant="danger" onClick={handleAdminLogout}>
                  Logout
                </ActionButton>
              </div>
            </div>

            {allBookings.length === 0 && !adminLoading && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600">
                No bookings yet.
              </div>
            )}

            <div className="space-y-3">
              {allBookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex justify-between items-start gap-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {b.name || "(No name)"}{" "}
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {b.service}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {b.email || "(No email)"}
                    </div>

                    <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {b.date} • {b.time}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteBooking(b.id)}
                    className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
