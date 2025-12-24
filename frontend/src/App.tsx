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
  IconButton
} from "@mui/material";
import { Edit, Delete, Save, Close } from "@mui/icons-material";
import { Header } from './components/Header';

type Device = {
  id: string
  name: string
}

function App() {
  const [active, setActive] = useState("catalog")
  const [devices, setDevices] = useState<Device[]>([])
  const [newName, setNewName] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const API = "http://localhost/api/devices"

  const loadDevices = async () => {
    const res = await fetch(API)
    setDevices(await res.json())
  }

  const createDevice = async () => {
    if (!newName.trim()) return
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    })
    const created = await res.json()
    setDevices(prev => [...prev, created])
    setNewName("")
  }

  const startEdit = (device: Device) => {
    setEditId(device.id)
    setEditName(device.name)
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditName("")
  }

  const saveEdit = async (id: string) => {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName })
    })
    const updated = await res.json()
    setDevices(devices.map(d => d.id === id ? updated : d))
    cancelEdit()
  }

  const deleteDevice = async (id: string) => {
    await fetch(`${API}/${id}`, { method: "DELETE" })
    setDevices(devices.filter(d => d.id !== id))
  }

  useEffect(() => {
    loadDevices()
  }, [])

  return (
    <>
      <Header
        activeNavId={active}
        onNavigate={setActive}
        onBellClick={() => console.log("bell")}
      />

      <Container maxWidth="lg">
        <Box sx={{ my: 3 }}>

          {/* Добавление */}
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              label="Новое устройство"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={createDevice}>
              Добавить
            </Button>
          </Box>

          {/* Таблица */}
          <Table>
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
                    {editId === device.id ? (
                      <TextField
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    ) : (
                      device.name
                    )}
                  </TableCell>

                  <TableCell align="right">
                    {editId === device.id ? (
                      <>
                        <IconButton onClick={() => saveEdit(device.id)} color="primary">
                          <Save />
                        </IconButton>
                        <IconButton onClick={cancelEdit}>
                          <Close />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton onClick={() => startEdit(device)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => deleteDevice(device.id)} color="error">
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </Box>
      </Container>
    </>
  )
}

export default App
