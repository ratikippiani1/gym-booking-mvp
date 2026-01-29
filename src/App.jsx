import { useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [status, setStatus] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus("Saving...")

    const bookingData = {
      name: name,
      email: email,
      date: date,
      time: time,
    }

    const result = await supabase.from("bookings").insert([bookingData])

    if (result.error) {
      setStatus("Error: " + result.error.message)
      return
    }

    setStatus("Booked ✅")
    setName("")
    setEmail("")
    setDate("")
    setTime("")
  }
  async function loadBookings() {
    setStatus("Loading bookings...")

    const result = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (result.error) {
      setStatus("Error: " + result.error.message)
      return
    }

    setBookings(result.data || [])
    setStatus("")
  }

  const [isAdmin, setIsAdmin] = useState(false)
  const [bookings, setBookings] = useState([])
  async function deleteBooking(id) {
    const ok = window.confirm("Delete this booking?")
    if (!ok) return

    setStatus("Deleting...")

    const result = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)

    if (result.error) {
      setStatus("Error: " + result.error.message)
      return
    }

    setStatus("Deleted ✅")
    loadBookings()
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Gym Booking MVP</h1>
      <p style={{ marginBottom: 20, color: "#555" }}>
        Book a training session (demo).
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setIsAdmin(false)}
          style={{ padding: 10, borderRadius: 10, cursor: "pointer" }}
        >
          Booking form
        </button>

        <button
          onClick={() => {
            setIsAdmin(true)
            loadBookings()
          }}
          style={{ padding: 10, borderRadius: 10, cursor: "pointer" }}
        >
          Admin
        </button>
      </div>


      {isAdmin ? (
        <div>
          <h2 style={{ marginBottom: 10 }}>Bookings</h2>

          <button
            onClick={loadBookings}
            style={{ padding: 10, borderRadius: 10, cursor: "pointer" }}
          >
            Refresh
          </button>

          <div style={{ marginTop: 15, display: "grid", gap: 10 }}>
            {bookings.length === 0 ? (
              <div>No bookings yet.</div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 10,
                  }}
                >
                  <button
                    onClick={() => deleteBooking(b.id)}
                    style={{
                      marginTop: 10,
                      padding: 8,
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>

                  <div style={{ fontWeight: 700 }}>{b.name}</div>
                  <div>{b.email}</div>
                  <div>
                    {b.date} at {b.time}
                  </div>
                </div>
              ))
            )}
          </div>

          {status ? <div style={{ marginTop: 10 }}>{status}</div> : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <button
            type="submit"
            style={{
              padding: 12,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Book Session
          </button>

          {status ? <div style={{ marginTop: 10 }}>{status}</div> : null}
        </form>
      )}

    </div>
  )
}
