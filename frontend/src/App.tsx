import { useEffect, useState } from 'react'
import {
  Container, Box, TextField, Button, Table, TableHead, TableRow, 
  TableCell, TableBody, IconButton, Typography, MenuItem, Paper, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { Delete, Add, Edit } from "@mui/icons-material";
import { Header } from './components/Header';

interface Device {
  id: string;
  name: string;
}

interface Auditory {
  id: string;
  name: string;
  capacity: number;
}

interface Booking {
  id: string;
  deviceId: string;
  auditoryId: string;
  startTime: string;
  endTime: string;
  device?: Device;
  auditory?: Auditory;
}

function App() {
  const [active, setActive] = useState("catalog")
  const [devices, setDevices] = useState<Device[]>([])
  const [auditories, setAuditories] = useState<Auditory[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  const [bookingForm, setBookingForm] = useState({ devId: "", audId: "", end: "" })
  const [newDevName, setNewDevName] = useState("")
  const [newAud, setNewAud] = useState({ name: "", cap: 1 })

  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)

  const [editAuditoryOpen, setEditAuditoryOpen] = useState(false)
  const [editingAuditory, setEditingAuditory] = useState<Auditory | null>(null)

  const [editBookingOpen, setEditBookingOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)

   let API: string  = "http://localhost/api"
  if(import.meta.env.PROD)
  {

    API = "https://is-aplication.onrender.com/api"
  }

  const loadData = async () => {
    try {
      const [d, a, b] = await Promise.all([
        fetch(`${API}/devices`).then(r => r.json()),
        fetch(`${API}/auditories`).then(r => r.json()),
        fetch(`${API}/bookings`).then(r => r.json())
      ])
      setDevices(d); setAuditories(a); setBookings(b)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadData() }, [])

  // Логика бронирования
  const handleBooking = async () => {
    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deviceId: bookingForm.devId, 
          auditoryId: bookingForm.audId, 
          endTime: new Date(bookingForm.end).toISOString() 
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Ошибка")
      setBookings([data, ...bookings])
      setBookingForm({ devId: "", audId: "", end: "" })
    } catch (e: any) { alert(e.message) }
  }

  // Создание Устройства
  const addDevice = async () => {
    await fetch(`${API}/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDevName })
    })
    setNewDevName(""); loadData()
  }

  // Создание Аудитории
  const addAuditory = async () => {
    await fetch(`${API}/auditories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAud.name, capacity: Number(newAud.cap) })
    })
    setNewAud({ name: "", cap: 1 }); loadData()
  }

  const deleteItem = async (path: string, id: string) => {
    await fetch(`${API}/${path}/${id}`, { method: "DELETE" })
    loadData()
  }

  const checkStatus = (audId: string) => {
    const activeB = bookings.find(b => b.auditoryId === audId && new Date(b.endTime) > new Date())
    return activeB ? { msg: `Занята до ${new Date(activeB.endTime).toLocaleTimeString()}`, busy: true } : { msg: "Свободна", busy: false }
  }

  const getLocalDatetime = (iso: string) => {
    const date = new Date(iso)
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${d}T${h}:${min}`
  }

  const handleEditDevice = (d: Device) => {
    setEditingDevice(d)
    setEditDeviceOpen(true)
  }

  const saveDevice = async () => {
    if (!editingDevice) return
    try {
      const res = await fetch(`${API}/devices/${editingDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingDevice.name })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Ошибка')
      }
      setEditDeviceOpen(false)
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleEditAuditory = (a: Auditory) => {
    setEditingAuditory(a)
    setEditAuditoryOpen(true)
  }

  const saveAuditory = async () => {
    if (!editingAuditory) return
    try {
      const res = await fetch(`${API}/auditories/${editingAuditory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingAuditory.name, capacity: editingAuditory.capacity })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Ошибка')
      }
      setEditAuditoryOpen(false)
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  const handleEditBooking = (b: Booking) => {
    setEditingBooking(b)
    setEditBookingOpen(true)
  }

  const saveBooking = async () => {
    if (!editingBooking) return
    try {
      const res = await fetch(`${API}/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deviceId: editingBooking.deviceId, 
          auditoryId: editingBooking.auditoryId, 
          endTime: editingBooking.endTime 
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Ошибка')
      setEditBookingOpen(false)
      loadData()
    } catch (e: any) { alert(e.message) }
  }

  return (
    <>
      <Header activeNavId={active} onNavigate={setActive} onBellClick={() => {}} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        
        {/* Секция бронирования */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Бронирование</Typography>
        <Paper sx={{ p: 3, mb: 4, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f5f5f5' }}>
          <TextField select label="Устройство" value={bookingForm.devId} onChange={e => setBookingForm({...bookingForm, devId: e.target.value})} sx={{ flex: 1 }}>
            {devices.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField select label="Аудитория" value={bookingForm.audId} onChange={e => setBookingForm({...bookingForm, audId: e.target.value})} sx={{ flex: 1 }}>
            {auditories.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </TextField>
          <TextField type="datetime-local" label="До" InputLabelProps={{ shrink: true }} value={bookingForm.end} onChange={e => setBookingForm({...bookingForm, end: e.target.value})} sx={{ flex: 1 }} />
          <Button variant="contained" onClick={handleBooking} size="large">Занять</Button>
        </Paper>

        {/* Таблица Устройств */}
        <Typography variant="h6" gutterBottom>Устройства</Typography>
        <Table sx={{ mb: 4 }}>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map(d => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditDevice(d)}><Edit /></IconButton>
                  <IconButton onClick={() => deleteItem('devices', d.id)} color="error"><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Таблица Аудиторий */}
        <Typography variant="h6" gutterBottom>Статус аудиторий</Typography>
        <Table sx={{ mb: 4 }}>
          <TableHead><TableRow><TableCell>Название</TableCell><TableCell>Мест</TableCell><TableCell>Текущее состояние</TableCell><TableCell align="right">Действия</TableCell></TableRow></TableHead>
          <TableBody>
            {auditories.map(a => {
              const s = checkStatus(a.id)
              return (
                <TableRow key={a.id}>
                  <TableCell>{a.name}</TableCell><TableCell>{a.capacity}</TableCell>
                  <TableCell sx={{ color: s.busy ? 'error.main' : 'success.main', fontWeight: 'bold' }}>{s.msg}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEditAuditory(a)}><Edit /></IconButton>
                    <IconButton onClick={() => deleteItem('auditories', a.id)} color="error"><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <Divider sx={{ my: 4 }} />

        {/* Админ-панель: быстрое добавление */}
        <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>Добавить устройство</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder="Название" value={newDevName} onChange={e => setNewDevName(e.target.value)} />
              <Button variant="outlined" onClick={addDevice}><Add /></Button>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>Добавить аудиторию</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" placeholder="Имя" value={newAud.name} onChange={e => setNewAud({...newAud, name: e.target.value})} />
              <TextField size="small" type="number" placeholder="Мест" value={newAud.cap} onChange={e => setNewAud({...newAud, cap: Number(e.target.value)})} sx={{ width: 80 }} />
              <Button variant="outlined" onClick={addAuditory}><Add /></Button>
            </Box>
          </Paper>
        </Box>

        {/* Журнал бронирований */}
        <Typography variant="h6" gutterBottom>Журнал</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Устройство</TableCell>
              <TableCell>Аудитория</TableCell>
              <TableCell>Начало</TableCell>
              <TableCell>Окончание</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map(b => (
              <TableRow key={b.id}>
                <TableCell>{b.device?.name}</TableCell>
                <TableCell>{b.auditory?.name}</TableCell>
                <TableCell>{new Date(b.startTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(b.endTime).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditBooking(b)}><Edit /></IconButton>
                  <IconButton onClick={() => deleteItem('bookings', b.id)} color="error"><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>

      {/* Диалог редактирования устройства */}
      <Dialog open={editDeviceOpen} onClose={() => setEditDeviceOpen(false)}>
        <DialogTitle>Редактировать устройство</DialogTitle>
        <DialogContent>
          <TextField 
            label="Название" 
            value={editingDevice?.name || ''} 
            onChange={e => setEditingDevice({...editingDevice!, name: e.target.value})} 
            fullWidth 
            sx={{ mt: 2 }} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDeviceOpen(false)}>Отмена</Button>
          <Button onClick={saveDevice} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования аудитории */}
      <Dialog open={editAuditoryOpen} onClose={() => setEditAuditoryOpen(false)}>
        <DialogTitle>Редактировать аудиторию</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField 
            label="Название" 
            value={editingAuditory?.name || ''} 
            onChange={e => setEditingAuditory({...editingAuditory!, name: e.target.value})} 
            fullWidth 
          />
          <TextField 
            label="Вместимость" 
            type="number" 
            value={editingAuditory?.capacity || 1} 
            onChange={e => setEditingAuditory({...editingAuditory!, capacity: Number(e.target.value)})} 
            fullWidth 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAuditoryOpen(false)}>Отмена</Button>
          <Button onClick={saveAuditory} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования бронирования */}
      <Dialog open={editBookingOpen} onClose={() => setEditBookingOpen(false)}>
        <DialogTitle>Редактировать бронирование</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Typography>Начало: {editingBooking && new Date(editingBooking.startTime).toLocaleString()}</Typography>
          <TextField 
            select 
            label="Устройство" 
            value={editingBooking?.deviceId || ''} 
            onChange={e => setEditingBooking({...editingBooking!, deviceId: e.target.value})} 
            fullWidth 
          >
            {devices.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField 
            select 
            label="Аудитория" 
            value={editingBooking?.auditoryId || ''} 
            onChange={e => setEditingBooking({...editingBooking!, auditoryId: e.target.value})} 
            fullWidth 
          >
            {auditories.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </TextField>
          <TextField 
            type="datetime-local" 
            label="Окончание" 
            value={editingBooking ? getLocalDatetime(editingBooking.endTime) : ''} 
            onChange={e => setEditingBooking({...editingBooking!, endTime: new Date(e.target.value).toISOString()})} 
            InputLabelProps={{ shrink: true }} 
            fullWidth 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBookingOpen(false)}>Отмена</Button>
          <Button onClick={saveBooking} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default App;