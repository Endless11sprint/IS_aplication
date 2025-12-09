import { useState } from 'react'
import { Container, Box } from "@mui/material";
import { Header } from './components/Header';
import { RoomsTable } from '@/components/RoomsTable/RoomsTable';

import './App.css'

function App() {
  const [active, setActive] = useState("catalog");
  return (
    <>
      <Header
        activeNavId={active}
        onNavigate={setActive}
        onBellClick={() => console.log("bell")}
      />
      <Container maxWidth="lg">
        <Box sx={{ my: 2 }}>
          <RoomsTable />
        </Box>
      </Container>
    </>
  );
}

export default App;