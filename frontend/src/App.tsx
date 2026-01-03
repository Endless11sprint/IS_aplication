import { useEffect, useState } from 'react'
import {
  Container,
  Box,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Typography,
  Divider
} from "@mui/material";
import { Edit, Delete, Save, Close } from "@mui/icons-material";
import { Header } from './components/Header';

type Device = { id: string; name: string }
type Auditory = { id: string; name: string; capacity: number }

function App() {
  const [active, setActive] = useState("catalog")
  
  // States for Devices
  const [devices, setDevices] = useState<Device[]>([])
  const [newDevName, setNewDevName] = useState("")
  const [editDevId, setEditDevId] = useState<string | null>(null)
  const [editDevName, setEditDevName] = useState("")

  // States for Auditories
  const [auditories, setAuditories] = useState<Auditory[]>([])
  const [newAudName, setNewAudName] = useState("")
  const [newAudCapacity, setNewAudCapacity] = useState<number | "">("")
  const [editAudId, setEditAudId] = useState<string | null>(null)
  const [editAudName, setEditAudName] = useState("")
  const [editAudCapacity, setEditAudCapacity] = useState<number | "">("")

  const BASE_URL = import.meta.env.PROD 
    ? "https://is-aplication.onrender.com/api" 
    : "http://localhost/api"

  const loadData = async () => {
    const [devRes, audRes] = await Promise.all([
      fetch(`${BASE_URL}/devices`),
      fetch(`${BASE_URL}/auditories`)
    ])
    setDevices(await devRes.json())
    setAuditories(await audRes.json())
  }

  useEffect(() => { loadData() }, [])

  // --- Device Actions ---
  const createDevice = async () => {
    if (!newDevName.trim()) return
    const res = await fetch(`${BASE_URL}/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDevName })
    })
    setDevices([...devices, await res.json()])
    setNewDevName("")
  }

  const deleteDevice = async (id: string) => {
    await fetch(`${BASE_URL}/devices/${id}`, { method: "DELETE" })
    setDevices(devices.filter(d => d.id !== id))
  }

  const saveDevEdit = async (id: string) => {
    const res = await fetch(`${BASE_URL}/devices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editDevName })
    })
    const updated = await res.json()
    setDevices(devices.map(d => d.id === id ? updated : d))
    setEditDevId(null)
  }

  // --- Auditory Actions ---
  const createAuditory = async () => {
    if (!newAudName.trim()) return
    const res = await fetch(`${BASE_URL}/auditories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAudName, capacity: Number(newAudCapacity) || 0 })
    })
    setAuditories([...auditories, await res.json()])
    setNewAudName(""); setNewAudCapacity("")
  }

  const deleteAuditory = async (id: string) => {
    await fetch(`${BASE_URL}/auditories/${id}`, { method: "DELETE" })
    setAuditories(auditories.filter(a => a.id !== id))
  }

  const saveAudEdit = async (id: string) => {
    const res = await fetch(`${BASE_URL}/auditories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editAudName, capacity: Number(editAudCapacity) })
    })
    const updated = await res.json()
    setAuditories(auditories.map(a => a.id === id ? updated : a))
    setEditAudId(null)
  }

  return (
    <>
      <Header activeNavId={active} onNavigate={setActive} onBellClick={() => {}} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        
        {/* DEVICES SECTION */}
        <Typography variant="h5" gutterBottom>Устройства</Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField label="Название устройства" value={newDevName} onChange={e => setNewDevName(e.target.value)} fullWidth />
          <Button variant="contained" onClick={createDevice}>Добавить</Button>
        </Box>
        <Table sx={{ mb: 6 }}>
          <TableHead>
            <TableRow>
              <TableCell width="30%">ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map(device => (
              <TableRow key={device.id}>
                <TableCell>{device.id}</TableCell>
                <TableCell>
                  {editDevId === device.id ? 
                    <TextField size="small" value={editDevName} onChange={e => setEditDevName(e.target.value)} fullWidth /> : 
                    device.name}
                </TableCell>
                <TableCell align="right">
                  {editDevId === device.id ? (
                    <><IconButton onClick={() => saveDevEdit(device.id)} color="primary"><Save /></IconButton>
                      <IconButton onClick={() => setEditDevId(null)}><Close /></IconButton></>
                  ) : (
                    <><IconButton onClick={() => { setEditDevId(device.id); setEditDevName(device.name); }}><Edit /></IconButton>
                      <IconButton onClick={() => deleteDevice(device.id)} color="error"><Delete /></IconButton></>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Divider sx={{ my: 4 }} />

        {/* AUDITORIES SECTION */}
        <Typography variant="h5" gutterBottom>Аудитории</Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField label="Название" value={newAudName} onChange={e => setNewAudName(e.target.value)} fullWidth />
          <TextField label="Вместимость" type="number" value={newAudCapacity} onChange={e => setNewAudCapacity(e.target.value === "" ? "" : Number(e.target.value))} />
          <Button variant="contained" color="success" onClick={createAuditory}>Добавить</Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Вместимость</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditories.map(aud => (
              <TableRow key={aud.id}>
                <TableCell>{aud.id}</TableCell>
                <TableCell>
                  {editAudId === aud.id ? 
                    <TextField size="small" value={editAudName} onChange={e => setEditAudName(e.target.value)} fullWidth /> : 
                    aud.name}
                </TableCell>
                <TableCell>
                  {editAudId === aud.id ? 
                    <TextField size="small" type="number" value={editAudCapacity} onChange={e => setEditAudCapacity(Number(e.target.value))} /> : 
                    aud.capacity}
                </TableCell>
                <TableCell align="right">
                  {editAudId === aud.id ? (
                    <><IconButton onClick={() => saveAudEdit(aud.id)} color="primary"><Save /></IconButton>
                      <IconButton onClick={() => setEditAudId(null)}><Close /></IconButton></>
                  ) : (
                    <><IconButton onClick={() => { setEditAudId(aud.id); setEditAudName(aud.name); setEditAudCapacity(aud.capacity); }}><Edit /></IconButton>
                      <IconButton onClick={() => deleteAuditory(aud.id)} color="error"><Delete /></IconButton></>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </Container>
    </>
  )
}

export default App;