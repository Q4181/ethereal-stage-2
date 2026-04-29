import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import EventDetails from './components/EventDetails';
import Checkout from './components/Checkout';
import Login from './components/Login';
import Inventory from './components/Inventory';
import TradeMarket from './components/TradeMarket';
import AdminConcertForm from './components/AdminConcertForm';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          {/* เพิ่ม Routes สำหรับหน้าใหม่ด้านล่างนี้ครับ */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/trade" element={<TradeMarket />} />
          <Route path="/admin/concert" element={<AdminConcertForm />} />
          <Route path="/admin/concert/:id" element={<AdminConcertForm />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}