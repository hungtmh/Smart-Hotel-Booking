import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

/**
 * Trang quan tri Admin - 4 tab:
 *  1. Quan ly Booking (xem tat ca, duyet/huy)
 *  2. Quan ly Khach San (CRUD)
 *  3. Quan ly Loai Phong (CRUD)
 *  4. Quan ly Phong Vat Ly (CRUD)
 */
export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [token, setToken] = useState(null);

  // ---- Booking state ----
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // ---- Hotel state ----
  const [hotels, setHotels] = useState([]);
  const [hotelForm, setHotelForm] = useState({ name: '', address: '', city: '', starRating: 5, phone: '', email: '' });
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [hotelLoading, setHotelLoading] = useState(false);

  // ---- RoomType state ----
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomTypeForm, setRoomTypeForm] = useState({ hotelId: '', name: '', basePrice: '', capacityAdults: 2, capacityChildren: 0, areaSqm: '', description: '', amenities: [], images: [] });
  const [amenityInput, setAmenityInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [editingRoomTypeId, setEditingRoomTypeId] = useState(null);
  const [roomTypeLoading, setRoomTypeLoading] = useState(false);

  // ---- Room state ----
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({ roomTypeId: '', roomNumber: '', floor: 1, status: 'AVAILABLE' });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);

  // ---- Transaction state ----
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [selectedBookingForTx, setSelectedBookingForTx] = useState({});

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Lay token tu Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token || null);
    });
  }, []);

  // Redirect neu khong phai admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
    }
  }, [authLoading, isAdmin, navigate]);

  const apiFetch = useCallback(async (path, options = {}) => {
    const res = await fetch(`http://localhost:8080/api/admin${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }, [token]);

  // ==================== BOOKINGS ====================
  const loadBookings = useCallback(async () => {
    if (!token) return;
    setBookingLoading(true);
    try {
      const data = await apiFetch('/bookings');
      setBookings(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setBookingLoading(false); }
  }, [token, apiFetch]);

  const updateBookingStatus = async (id, status) => {
    try {
      await apiFetch(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Đã cập nhật booking sang ${status}`);
      loadBookings();
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ==================== HOTELS ====================
  const loadHotels = useCallback(async () => {
    if (!token) return;
    setHotelLoading(true);
    try {
      const data = await apiFetch('/hotels');
      setHotels(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setHotelLoading(false); }
  }, [token, apiFetch]);

  const saveHotel = async (e) => {
    e.preventDefault();
    try {
      if (editingHotelId) {
        await apiFetch(`/hotels/${editingHotelId}`, { method: 'PUT', body: JSON.stringify(hotelForm) });
        showToast('Đã cập nhật khách sạn!');
      } else {
        await apiFetch('/hotels', { method: 'POST', body: JSON.stringify(hotelForm) });
        showToast('Đã tạo khách sạn mới!');
      }
      setHotelForm({ name: '', address: '', city: '', starRating: 5, phone: '', email: '' });
      setEditingHotelId(null);
      loadHotels();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteHotel = async (id) => {
    if (!confirm('Xóa khách sạn này?')) return;
    try {
      await apiFetch(`/hotels/${id}`, { method: 'DELETE' });
      showToast('Đã xóa khách sạn!');
      loadHotels();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const editHotel = (hotel) => {
    setEditingHotelId(hotel.id);
    setHotelForm({ name: hotel.name, address: hotel.address, city: hotel.city, starRating: hotel.starRating, phone: hotel.phone || '', email: hotel.email || '' });
  };

  // ==================== ROOM TYPES ====================
  const loadRoomTypes = useCallback(async () => {
    if (!token) return;
    setRoomTypeLoading(true);
    try {
      const data = await apiFetch('/room-types');
      setRoomTypes(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setRoomTypeLoading(false); }
  }, [token, apiFetch]);

  const addAmenity = () => {
    const val = amenityInput.trim();
    if (val && !roomTypeForm.amenities.includes(val)) {
      setRoomTypeForm(f => ({ ...f, amenities: [...f.amenities, val] }));
    }
    setAmenityInput('');
  };

  const removeAmenity = (item) => {
    setRoomTypeForm(f => ({ ...f, amenities: f.amenities.filter(a => a !== item) }));
  };

  const addImage = () => {
    const val = imageInput.trim();
    if (val && !roomTypeForm.images.includes(val)) {
      setRoomTypeForm(f => ({ ...f, images: [...f.images, val] }));
    }
    setImageInput('');
  };

  const removeImage = (url) => {
    setRoomTypeForm(f => ({ ...f, images: f.images.filter(i => i !== url) }));
  };

  const saveRoomType = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...roomTypeForm, basePrice: parseFloat(roomTypeForm.basePrice), areaSqm: parseFloat(roomTypeForm.areaSqm) };
      if (editingRoomTypeId) {
        await apiFetch(`/room-types/${editingRoomTypeId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Đã cập nhật loại phòng!');
      } else {
        await apiFetch('/room-types', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Đã tạo loại phòng mới!');
      }
      setRoomTypeForm({ hotelId: '', name: '', basePrice: '', capacityAdults: 2, capacityChildren: 0, areaSqm: '', description: '', amenities: [], images: [] });
      setAmenityInput('');
      setImageInput('');
      setEditingRoomTypeId(null);
      loadRoomTypes();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteRoomType = async (id) => {
    if (!confirm('Xóa loại phòng này?')) return;
    try {
      await apiFetch(`/room-types/${id}`, { method: 'DELETE' });
      showToast('Đã xóa loại phòng!');
      loadRoomTypes();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const editRoomType = (rt) => {
    setEditingRoomTypeId(rt.id);
    setRoomTypeForm({ hotelId: rt.hotel?.id || '', name: rt.name, basePrice: rt.basePrice, capacityAdults: rt.capacityAdults, capacityChildren: rt.capacityChildren, areaSqm: rt.areaSqm || '', description: rt.description || '', amenities: rt.amenities || [], images: rt.images || [] });
    setAmenityInput('');
    setImageInput('');
  };

  // ==================== ROOMS ====================
  const loadRooms = useCallback(async () => {
    if (!token) return;
    setRoomLoading(true);
    try {
      const data = await apiFetch('/rooms');
      setRooms(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setRoomLoading(false); }
  }, [token, apiFetch]);

  const saveRoom = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...roomForm, floor: parseInt(roomForm.floor) };
      if (editingRoomId) {
        await apiFetch(`/rooms/${editingRoomId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Đã cập nhật phòng!');
      } else {
        await apiFetch('/rooms', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Đã tạo phòng mới!');
      }
      setRoomForm({ roomTypeId: '', roomNumber: '', floor: 1, status: 'AVAILABLE' });
      setEditingRoomId(null);
      loadRooms();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteRoom = async (id) => {
    if (!confirm('Xóa phòng này?')) return;
    try {
      await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
      showToast('Đã xóa phòng!');
      loadRooms();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const editRoom = (room) => {
    setEditingRoomId(room.id);
    setRoomForm({ roomTypeId: room.roomType?.id || '', roomNumber: room.roomNumber, floor: room.floor || 1, status: room.status });
  };

  // ==================== TRANSACTIONS ====================
  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setTxLoading(true);
    try {
      const data = await apiFetch('/transactions');
      setTransactions(data || []);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setTxLoading(false); }
  }, [token, apiFetch]);

  const resolveTransaction = async (txId) => {
    const bookingId = selectedBookingForTx[txId];
    if (!bookingId) {
      showToast('Vui lòng chọn 1 đơn phòng PENDING để khớp', 'error');
      return;
    }
    try {
      await apiFetch(`/transactions/${txId}/resolve/${bookingId}`, { method: 'POST' });
      showToast('✅ Đã duyệt thủ công & khớp giao dịch thành công!');
      loadTransactions();
      loadBookings();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDemoUnmatchedTx = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/public/payment/demo-unmatched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1500000, content: 'Thanh toan tien phong (Khach nhap sai cu phap)' })
      });
      if (res.ok) {
        showToast('🧪 Đã giả lập 1 giao dịch sai cú pháp vào Admin!');
        loadTransactions();
      }
    } catch (e) {
      showToast('Lỗi kết nối API giả lập', 'error');
    }
  };

  // Load data khi doi tab
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'hotels') loadHotels();
    if (activeTab === 'room-types') { loadRoomTypes(); loadHotels(); }
    if (activeTab === 'rooms') { loadRooms(); loadRoomTypes(); }
    if (activeTab === 'transactions') { loadBookings(); loadTransactions(); }
  }, [activeTab, token, loadBookings, loadHotels, loadRoomTypes, loadRooms, loadTransactions]);

  const statusBadge = (status) => {
    const map = { PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', CANCELLED: 'badge-cancelled', COMPLETED: 'badge-completed' };
    return <span className={`admin-badge ${map[status] || 'badge-pending'}`}>{status}</span>;
  };

  const roomStatusBadge = (status) => {
    const map = { AVAILABLE: 'badge-confirmed', OCCUPIED: 'badge-pending', CLEANING: 'badge-cancelled', MAINTENANCE: 'badge-cancelled' };
    return <span className={`admin-badge ${map[status] || 'badge-pending'}`}>{status}</span>;
  };

  if (authLoading) return <div className="admin-loading">Đang tải...</div>;

  return (
    <div className="admin-page">
      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type === 'error' ? 'admin-toast-error' : 'admin-toast-success'}`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Admin Panel</h1>
          <p className="admin-subtitle">Quản trị hệ thống Smart Hotel Booking</p>
        </div>
        <button 
          className="admin-btn admin-btn-delete" 
          onClick={async () => {
             await supabase.auth.signOut();
             window.location.href = '/login';
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { key: 'bookings', label: 'Bookings' },
          { key: 'hotels', label: 'Khách Sạn' },
          { key: 'room-types', label: 'Loại Phòng' },
          { key: 'rooms', label: 'Phòng' },
          { key: 'transactions', label: '⚠️ Giao dịch lỗi CK' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`admin-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">

        {/* ==================== TAB BOOKINGS ==================== */}
        {activeTab === 'bookings' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Tất cả Booking</h2>
              <button className="admin-refresh-btn" onClick={loadBookings}>Làm mới</button>
            </div>
            {bookingLoading ? <div className="admin-spinner">Đang tải...</div> : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Khách sạn / Phòng</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 && (
                      <tr><td colSpan="7" className="admin-empty">Chưa có booking nào.</td></tr>
                    )}
                    {bookings.map(b => (
                      <tr key={b.bookingId}>
                        <td>
                          <div className="admin-cell-primary">Phòng {b.roomNumber}</div>
                          <div className="admin-cell-secondary">{b.numAdults} NL</div>
                        </td>
                        <td>
                          <div className="admin-cell-primary">{b.hotelName}</div>
                          <div className="admin-cell-secondary">{b.roomTypeName}</div>
                        </td>
                        <td>{new Date(b.checkInDate).toLocaleString('vi-VN')}</td>
                        <td>{new Date(b.checkOutDate).toLocaleString('vi-VN')}</td>
                        <td className="admin-amount">{b.totalAmount?.toLocaleString('vi-VN')} ₫</td>
                        <td>{statusBadge(b.status)}</td>
                        <td>
                          <div className="admin-action-btns">
                            {b.status === 'PENDING' && (
                              <>
                                <button className="admin-btn admin-btn-confirm" onClick={() => updateBookingStatus(b.bookingId, 'CONFIRMED')}>Duyệt</button>
                                <button className="admin-btn admin-btn-cancel" onClick={() => updateBookingStatus(b.bookingId, 'CANCELLED')}>Hủy</button>
                              </>
                            )}
                            {b.status === 'CONFIRMED' && (
                              <button className="admin-btn admin-btn-cancel" onClick={() => updateBookingStatus(b.bookingId, 'CANCELLED')}>Hủy</button>
                            )}
                            {(b.status === 'COMPLETED' || b.status === 'CANCELLED') && (
                              <span className="admin-cell-secondary">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB HOTELS ==================== */}
        {activeTab === 'hotels' && (
          <div className="admin-section">
            {/* Form */}
            <div className="admin-form-card">
              <h3>{editingHotelId ? 'Sửa Khách Sạn' : 'Thêm Khách Sạn Mới'}</h3>
              <form onSubmit={saveHotel} className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Tên khách sạn *</label>
                    <input required value={hotelForm.name} onChange={e => setHotelForm(f => ({ ...f, name: e.target.value }))} placeholder="Marriott Da Nang..." />
                  </div>
                  <div className="admin-form-group">
                    <label>Thành phố *</label>
                    <input required value={hotelForm.city} onChange={e => setHotelForm(f => ({ ...f, city: e.target.value }))} placeholder="Đà Nẵng" />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Địa chỉ *</label>
                    <input required value={hotelForm.address} onChange={e => setHotelForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Võ Nguyên Giáp..." />
                  </div>
                  <div className="admin-form-group">
                    <label>Số sao</label>
                    <input type="number" min="1" max="5" value={hotelForm.starRating} onChange={e => setHotelForm(f => ({ ...f, starRating: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Điện thoại</label>
                    <input value={hotelForm.phone} onChange={e => setHotelForm(f => ({ ...f, phone: e.target.value }))} placeholder="0236..." />
                  </div>
                  <div className="admin-form-group">
                    <label>Email</label>
                    <input type="email" value={hotelForm.email} onChange={e => setHotelForm(f => ({ ...f, email: e.target.value }))} placeholder="info@hotel.com" />
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingHotelId ? 'Lưu thay đổi' : 'Thêm mới'}
                  </button>
                  {editingHotelId && (
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setEditingHotelId(null); setHotelForm({ name: '', address: '', city: '', starRating: 5, phone: '', email: '' }); }}>
                      Hủy sửa
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Table */}
            <div className="admin-section-header" style={{ marginTop: '1.5rem' }}>
              <h2>Danh sách Khách Sạn ({hotels.length})</h2>
              <button className="admin-refresh-btn" onClick={loadHotels}>Làm mới</button>
            </div>
            {hotelLoading ? <div className="admin-spinner">Đang tải...</div> : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Tên</th><th>Thành phố</th><th>Sao</th><th>Điện thoại</th><th>Hành động</th></tr>
                  </thead>
                  <tbody>
                    {hotels.length === 0 && <tr><td colSpan="5" className="admin-empty">Chưa có khách sạn nào.</td></tr>}
                    {hotels.map(h => (
                      <tr key={h.id}>
                        <td><div className="admin-cell-primary">{h.name}</div><div className="admin-cell-secondary">{h.address}</div></td>
                        <td>{h.city}</td>
                        <td>{'★'.repeat(h.starRating || 0)}</td>
                        <td>{h.phone || '—'}</td>
                        <td>
                          <div className="admin-action-btns">
                            <button className="admin-btn admin-btn-edit" onClick={() => editHotel(h)}>Sửa</button>
                            <button className="admin-btn admin-btn-delete" onClick={() => deleteHotel(h.id)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB ROOM TYPES ==================== */}
        {activeTab === 'room-types' && (
          <div className="admin-section">
            <div className="admin-form-card">
              <h3>{editingRoomTypeId ? 'Sửa Loại Phòng' : 'Thêm Loại Phòng Mới'}</h3>
              <form onSubmit={saveRoomType} className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Khách sạn *</label>
                    <select required value={roomTypeForm.hotelId} onChange={e => setRoomTypeForm(f => ({ ...f, hotelId: e.target.value }))}>
                      <option value="">-- Chọn khách sạn --</option>
                      {hotels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Tên loại phòng *</label>
                    <input required value={roomTypeForm.name} onChange={e => setRoomTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="Deluxe Ocean View..." />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Giá/đêm (₫) *</label>
                    <input required type="number" min="0" value={roomTypeForm.basePrice} onChange={e => setRoomTypeForm(f => ({ ...f, basePrice: e.target.value }))} placeholder="1500000" />
                  </div>
                  <div className="admin-form-group">
                    <label>Diện tích (m²)</label>
                    <input type="number" min="0" value={roomTypeForm.areaSqm} onChange={e => setRoomTypeForm(f => ({ ...f, areaSqm: e.target.value }))} placeholder="35" />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Người lớn (tối đa)</label>
                    <input type="number" min="1" value={roomTypeForm.capacityAdults} onChange={e => setRoomTypeForm(f => ({ ...f, capacityAdults: parseInt(e.target.value) }))} />
                  </div>
                  <div className="admin-form-group">
                    <label>Trẻ em (tối đa)</label>
                    <input type="number" min="0" value={roomTypeForm.capacityChildren} onChange={e => setRoomTypeForm(f => ({ ...f, capacityChildren: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Mô tả</label>
                  <textarea rows={2} value={roomTypeForm.description} onChange={e => setRoomTypeForm(f => ({ ...f, description: e.target.value }))} placeholder="Phòng hướng biển với tầm nhìn toàn cảnh..." />
                </div>

                {/* Amenities */}
                <div className="admin-form-group">
                  <label>Tiện nghi (Amenities)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={amenityInput}
                      onChange={e => setAmenityInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
                      placeholder="WiFi, Bể bơi, Spa... rồi nhấn Enter"
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={addAmenity}>+ Thêm</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {roomTypeForm.amenities.map(a => (
                      <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '3px 10px', fontSize: '13px', fontWeight: 500 }}>
                        {a}
                        <button type="button" onClick={() => removeAmenity(a)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div className="admin-form-group">
                  <label>Ảnh phòng (URL)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={imageInput}
                      onChange={e => setImageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                      placeholder="https://example.com/room.jpg rồi nhấn Enter"
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={addImage}>+ Thêm</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {roomTypeForm.images.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '60px' }}>
                        <img src={url} alt={`img-${idx}`} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }} />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingRoomTypeId ? 'Lưu thay đổi' : 'Thêm mới'}
                  </button>
                  {editingRoomTypeId && (
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setEditingRoomTypeId(null); setRoomTypeForm({ hotelId: '', name: '', basePrice: '', capacityAdults: 2, capacityChildren: 0, areaSqm: '', description: '', amenities: [], images: [] }); setAmenityInput(''); setImageInput(''); }}>
                      Hủy sửa
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-section-header" style={{ marginTop: '1.5rem' }}>
              <h2>Danh sách Loại Phòng ({roomTypes.length})</h2>
              <button className="admin-refresh-btn" onClick={loadRoomTypes}>Làm mới</button>
            </div>
            {roomTypeLoading ? <div className="admin-spinner">Đang tải...</div> : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Tên loại phòng</th><th>Khách sạn</th><th>Giá/đêm</th><th>Sức chứa</th><th>Diện tích</th><th>Hành động</th></tr>
                  </thead>
                  <tbody>
                    {roomTypes.length === 0 && <tr><td colSpan="6" className="admin-empty">Chưa có loại phòng nào.</td></tr>}
                    {roomTypes.map(rt => (
                      <tr key={rt.id}>
                        <td><div className="admin-cell-primary">{rt.name}</div></td>
                        <td>{rt.hotel?.name}</td>
                        <td className="admin-amount">{rt.basePrice?.toLocaleString('vi-VN')} ₫</td>
                        <td>{rt.capacityAdults} NL {rt.capacityChildren > 0 && `+ ${rt.capacityChildren} TE`}</td>
                        <td>{rt.areaSqm ? `${rt.areaSqm} m²` : '—'}</td>
                        <td>
                          <div className="admin-action-btns">
                            <button className="admin-btn admin-btn-edit" onClick={() => editRoomType(rt)}>Sửa</button>
                            <button className="admin-btn admin-btn-delete" onClick={() => deleteRoomType(rt.id)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB ROOMS ==================== */}
        {activeTab === 'rooms' && (
          <div className="admin-section">
            <div className="admin-form-card">
              <h3>{editingRoomId ? 'Sửa Phòng Vật Lý' : 'Thêm Phòng Vật Lý Mới'}</h3>
              <form onSubmit={saveRoom} className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Loại phòng *</label>
                    <select required value={roomForm.roomTypeId} onChange={e => setRoomForm(f => ({ ...f, roomTypeId: e.target.value }))}>
                      <option value="">-- Chọn loại phòng --</option>
                      {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.hotel?.name} — {rt.name}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Số phòng *</label>
                    <input required value={roomForm.roomNumber} onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="101, 302..." />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Tầng</label>
                    <input type="number" min="1" value={roomForm.floor} onChange={e => setRoomForm(f => ({ ...f, floor: e.target.value }))} />
                  </div>
                  <div className="admin-form-group">
                    <label>Trạng thái</label>
                    <select value={roomForm.status} onChange={e => setRoomForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="CLEANING">CLEANING</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingRoomId ? 'Lưu thay đổi' : 'Thêm mới'}
                  </button>
                  {editingRoomId && (
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setEditingRoomId(null); setRoomForm({ roomTypeId: '', roomNumber: '', floor: 1, status: 'AVAILABLE' }); }}>
                      Hủy sửa
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-section-header" style={{ marginTop: '1.5rem' }}>
              <h2>Danh sách Phòng Vật Lý ({rooms.length})</h2>
              <button className="admin-refresh-btn" onClick={loadRooms}>Làm mới</button>
            </div>
            {roomLoading ? <div className="admin-spinner">Đang tải...</div> : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Số phòng</th><th>Tầng</th><th>Loại phòng</th><th>Khách sạn</th><th>Trạng thái</th><th>Hành động</th></tr>
                  </thead>
                  <tbody>
                    {rooms.length === 0 && <tr><td colSpan="6" className="admin-empty">Chưa có phòng nào.</td></tr>}
                    {rooms.map(r => (
                      <tr key={r.id}>
                        <td><div className="admin-cell-primary">Phòng {r.roomNumber}</div></td>
                        <td>Tầng {r.floor || '?'}</td>
                        <td>{r.roomType?.name}</td>
                        <td>{r.roomType?.hotel?.name}</td>
                        <td>{roomStatusBadge(r.status)}</td>
                        <td>
                          <div className="admin-action-btns">
                            <button className="admin-btn admin-btn-edit" onClick={() => editRoom(r)}>Sửa</button>
                            <button className="admin-btn admin-btn-delete" onClick={() => deleteRoom(r.id)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB TRANSACTIONS (KIỂM SOÁT CK) ==================== */}
        {activeTab === 'transactions' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2>Kiểm Soát Giao Dịch Webhook (SePay / VietQR)</h2>
                <p className="admin-subtitle">Danh sách tất cả chuyển khoản. Các chuyển khoản sai cú pháp (UNMATCHED) cần Admin đối chiếu & duyệt thủ công.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="admin-btn admin-btn-confirm" onClick={handleDemoUnmatchedTx}>
                  ⚡ [Test Đồ Án] Giả lập CK sai cú pháp
                </button>
                <button className="admin-refresh-btn" onClick={loadTransactions}>Làm mới</button>
              </div>
            </div>
            {txLoading ? <div className="admin-spinner">Đang tải...</div> : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ngày CK</th>
                      <th>Ngân hàng / STK</th>
                      <th>Số tiền</th>
                      <th>Nội dung CK (Khách nhập)</th>
                      <th>Trạng thái</th>
                      <th>Duyệt thủ công (Đối chiếu)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && (
                      <tr><td colSpan="6" className="admin-empty">Chưa có giao dịch chuyển khoản nào.</td></tr>
                    )}
                    {transactions.map(tx => {
                      const pendingList = bookings.filter(b => b.status === 'PENDING');
                      return (
                        <tr key={tx.id} style={tx.status === 'UNMATCHED' ? { background: 'rgba(251, 191, 36, 0.08)' } : {}}>
                          <td>{tx.transactionDate || new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                          <td>
                            <div className="admin-cell-primary">{tx.gateway}</div>
                            <div className="admin-cell-secondary">{tx.accountNumber}</div>
                          </td>
                          <td className="admin-amount" style={{ color: '#10b981', fontWeight: 'bold' }}>
                            {tx.transferAmount?.toLocaleString('vi-VN')} ₫
                          </td>
                          <td>
                            <div style={{ fontWeight: 'bold', color: tx.status === 'UNMATCHED' ? '#f59e0b' : '#6366f1' }}>
                              "{tx.content}"
                            </div>
                            {tx.note && <div className="admin-cell-secondary" style={{ fontStyle: 'italic', marginTop: '4px' }}>{tx.note}</div>}
                          </td>
                          <td>
                            {tx.status === 'UNMATCHED' ? (
                              <span className="admin-badge badge-pending" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #f59e0b' }}>
                                ⚠️ Sai cú pháp
                              </span>
                            ) : (
                              <span className="admin-badge badge-confirmed">
                                ✓ Đã khớp
                              </span>
                            )}
                          </td>
                          <td>
                            {tx.status === 'UNMATCHED' ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select
                                  className="admin-input"
                                  style={{ padding: '6px', fontSize: '13px', width: '220px' }}
                                  value={selectedBookingForTx[tx.id] || ''}
                                  onChange={e => setSelectedBookingForTx(prev => ({ ...prev, [tx.id]: e.target.value }))}
                                >
                                  <option value="">-- Chọn đơn PENDING --</option>
                                  {pendingList.map(b => (
                                    <option key={b.bookingId} value={b.bookingId}>
                                      #{b.bookingId.slice(0, 8).toUpperCase()} - Phòng {b.roomNumber} ({b.totalAmount?.toLocaleString('vi-VN')} ₫)
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="admin-btn admin-btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '13px' }}
                                  onClick={() => resolveTransaction(tx.id)}
                                >
                                  ✓ Duyệt
                                </button>
                              </div>
                            ) : (
                              <span className="admin-cell-secondary">
                                {tx.matchedBookingId ? `Khớp với #${tx.matchedBookingId.slice(0, 8).toUpperCase()}` : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
